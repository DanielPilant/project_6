// =============================================================================
// controllers/auth.controller.js
// -----------------------------------------------------------------------------
// HTTP layer for authentication. Validates input, calls the auth DAL, and
// returns the right status codes. CRITICAL: responses NEVER include the
// password hash — only public profile data is returned to the client.
//
//   POST /register -> 201 + user data | 400 missing fields | 409 duplicate
//   POST /login    -> 200 + user data | 400 missing fields | 401 bad creds
// =============================================================================

const authService = require("../services/auth.service");

// POST /register
async function register(req, res, next) {
  try {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({
        message: "Fields 'name', 'username', 'email' and 'password' are required",
      });
    }

    const user = await authService.registerUser(req.body);
    // user contains NO password hash by construction.
    res.status(201).json(user);
  } catch (err) {
    // Duplicate username/email -> 409 Conflict (friendlier than a raw 500).
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Username or email already taken" });
    }
    next(err);
  }
}

// POST /login
async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Fields 'username' and 'password' are required" });
    }

    const account = await authService.findAuthByUsername(username);

    // Use the SAME 401 message whether the username is unknown or the password
    // is wrong, so we don't leak which usernames exist.
    if (!account) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const ok = await authService.verifyPassword(password, account.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Strip the hash before sending the profile back to the client.
    const { password_hash, ...publicUser } = account;
    res.status(200).json(publicUser);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
