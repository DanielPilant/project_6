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
        message:
          "Fields 'name', 'username', 'email' and 'password' are required",
      });
    }

    const user = await authService.registerUser(req.body);
    // user contains NO password hash by construction.
    res.status(201).json(user);
  } catch (err) {
    // Duplicate username/email -> 409 Conflict (friendlier than a raw 500).
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "Username or email already taken" });
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

    // Lightweight lookup for the lockout state (does NOT check the password).
    const account = await authService.findAuthByUsername(username);

    // Use the SAME 401 message whether the username is unknown or the password
    // is wrong, so we don't leak which usernames exist.
    if (!account) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Blocked? Reject before even checking the password.
    if (account.failed_attempts >= authService.MAX_FAILED_ATTEMPTS) {
      return res.status(403).json({
        message:
          "Account blocked due to too many failed login attempts. Contact an administrator.",
      });
    }

    // THE PASSWORD CHECK HAPPENS IN SQL: this returns the user only if the
    // username + password match in the JOIN's WHERE clause (SHA2). Otherwise undefined.
    const user = await authService.findUserByCredentials(username, password);
    if (!user) {
      // Wrong password: count this failure and block on the Nth one.
      await authService.registerFailedAttempt(account.id);
      const attemptsLeft =
        authService.MAX_FAILED_ATTEMPTS - (account.failed_attempts + 1);

      if (attemptsLeft <= 0) {
        return res.status(403).json({
          message:
            "Account blocked due to too many failed login attempts. Contact an administrator.",
        });
      }
      return res.status(401).json({
        message: `Invalid username or password. ${attemptsLeft} attempt(s) left before the account is blocked.`,
      });
    }

    // Success: clear the failure counter and any lock, then return the profile.
    // `user` already contains only public columns (no hash), so nothing to strip.
    await authService.resetFailedAttempts(account.id);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

// POST /change-password
async function changePassword(req, res, next) {
  try {
    const { user_id, currentPassword, newPassword } = req.body;
    if (!user_id || !currentPassword || !newPassword) {
      return res.status(400).json({
        message:
          "Fields 'user_id', 'currentPassword' and 'newPassword' are required",
      });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    const result = await authService.changePassword(
      user_id,
      currentPassword,
      newPassword,
    );
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }
    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, changePassword };
