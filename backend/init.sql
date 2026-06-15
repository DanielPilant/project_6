-- =============================================================================
-- init.sql — Database initialization for a JSONPlaceholder-style API
-- =============================================================================
-- Mimics jsonplaceholder.typicode.com (users, todos, posts, comments) but with
-- real relational constraints and built-in authentication.
--
-- Engine/charset notes:
--   * InnoDB is required for FOREIGN KEY enforcement.
--   * utf8mb4 is used so the data can store the full Unicode range (emojis, etc.).
-- =============================================================================

-- Create and select the database. Dropping first makes this script idempotent
-- for local development (re-run to reset to a known seed state).
DROP DATABASE IF EXISTS jsonplaceholder_db;
CREATE DATABASE jsonplaceholder_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE jsonplaceholder_db;

-- =============================================================================
-- TABLE: users
-- -----------------------------------------------------------------------------
-- Public profile data only — the fields a JSONPlaceholder-style API exposes.
-- Kept intentionally lean (no address/company/geo blobs) to focus on the core
-- fields needed for the API and for linking todos/posts back to an owner.
--
-- SECURITY DESIGN CHOICE (1/2): No password column lives here.
-- Authentication secrets are split out into `user_auth` (below) so that any
-- query that serves public profile data (GET /users) physically cannot leak a
-- credential. This separation of concerns also lets us grant the application's
-- "read profile" role access to `users` WITHOUT access to `user_auth`.
-- =============================================================================
CREATE TABLE users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,                 -- display name
  username   VARCHAR(50)  NOT NULL UNIQUE,          -- public handle, used for login lookup
  email      VARCHAR(255) NOT NULL UNIQUE,          -- public + used for login lookup
  phone      VARCHAR(40),
  website    VARCHAR(255),
  is_admin       TINYINT(1) NOT NULL DEFAULT 0,     -- can use the admin dashboard
  is_super_admin TINYINT(1) NOT NULL DEFAULT 0,     -- the protected first admin (cannot be demoted/blocked)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- TABLE: user_auth
-- -----------------------------------------------------------------------------
-- SECURITY DESIGN CHOICE (2/2): Sensitive authentication data is isolated here.
--
--   * One-to-one with `users` (user_id is both PK and FK) so each account has
--     exactly one credential row, removed automatically via ON DELETE CASCADE.
--   * We store a PASSWORD HASH, never a plaintext password. The column is sized
--     for a bcrypt/argon2 hash (e.g. bcrypt = 60 chars; 255 leaves headroom for
--     argon2id). Hashing must happen in the application layer (bcrypt/argon2)
--     BEFORE insert — the salt is embedded in the hash string.
--   * ACCESS RESTRICTION PLAN: in production this table is reachable only by a
--     dedicated, least-privilege DB user (e.g. `auth_service`) granted just
--     SELECT/INSERT/UPDATE here. The general API role is granted access to
--     `users`, `todos`, `posts`, `comments` but NOT to `user_auth`, so an
--     ORM/query bug elsewhere cannot read password hashes.
--   * Operational fields (failed_attempts, locked_until) support basic
--     brute-force lockout without touching the public profile table.
-- =============================================================================
CREATE TABLE user_auth (
  user_id        INT PRIMARY KEY,
  password_hash  VARCHAR(255) NOT NULL,             -- bcrypt/argon2 hash ONLY (never plaintext)
  failed_attempts INT NOT NULL DEFAULT 0,           -- for brute-force lockout
  locked_until   TIMESTAMP NULL DEFAULT NULL,       -- account lock expiry, NULL = not locked
  last_login_at  TIMESTAMP NULL DEFAULT NULL,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_auth_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- TABLE: todos  (users 1 --- * todos)
-- =============================================================================
CREATE TABLE todos (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id   INT NOT NULL,
  title     VARCHAR(255) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_todos_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_todos_user (user_id)                    -- speeds up GET /users/:id/todos
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- TABLE: posts  (users 1 --- * posts)
-- =============================================================================
CREATE TABLE posts (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id   INT NOT NULL,
  title     VARCHAR(255) NOT NULL,
  body      TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_posts_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_posts_user (user_id)                    -- speeds up GET /users/:id/posts
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- TABLE: comments  (posts 1 --- * comments, users 1 --- * comments)
-- -----------------------------------------------------------------------------
-- Like JSONPlaceholder a comment carries its own name/email label, but it also
-- has a `user_id` OWNER (the registered user who wrote it). Stage E uses this
-- owner to allow PUT/DELETE only on a user's own comments.
-- =============================================================================
CREATE TABLE comments (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,                             -- owner: the user who wrote it
  name    VARCHAR(255) NOT NULL,                    -- comment subject/author label
  email   VARCHAR(255) NOT NULL,                    -- commenter email (not a FK)
  body    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_post
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_comments_post (post_id),                -- speeds up GET /posts/:id/comments
  INDEX idx_comments_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- TABLE: albums  (users 1 --- * albums)
-- -----------------------------------------------------------------------------
-- A user owns many albums. Owner-only edit/delete (like posts).
-- =============================================================================
CREATE TABLE albums (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,                             -- owner
  title   VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_albums_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_albums_user (user_id)                   -- speeds up GET /users/:id/albums
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- TABLE: photos  (albums 1 --- * photos)
-- -----------------------------------------------------------------------------
-- Images are stored as URLs (the user "uploads" by pasting an image link),
-- mirroring JSONPlaceholder's photos resource. Ownership is derived from the
-- parent album, so no separate user_id column is needed here.
-- =============================================================================
CREATE TABLE photos (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  album_id INT NOT NULL,
  title    VARCHAR(255),                            -- optional caption
  url      VARCHAR(2048) NOT NULL,                  -- the image URL
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_photos_album
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
  INDEX idx_photos_album (album_id)                 -- speeds up GET /albums/:id/photos
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- SEED DATA
-- -----------------------------------------------------------------------------
-- Explicit IDs are used so foreign keys line up deterministically and so the
-- data is easy to target when testing GET/POST/PUT/DELETE routes.
-- =============================================================================

-- ---- users -----------------------------------------------------------------
-- Daniel (id 5) is the SUPER ADMIN: the protected first admin who can never be
-- demoted or blocked. On a fresh seed his password is "password123".
INSERT INTO users (id, name, username, email, phone, website, is_admin, is_super_admin) VALUES
  (1, 'Leanne Graham',  'bret',      'leanne@example.com',  '1-770-736-8031', 'hildegard.org', 0, 0),
  (2, 'Ervin Howell',   'antonette', 'ervin@example.com',   '010-692-6593',   'anastasia.net', 0, 0),
  (3, 'Clementine Bauch','samantha', 'clementine@example.com','1-463-123-4447','ramiro.info',   0, 0),
  (4, 'Patricia Lebsack','karianne', 'patricia@example.com', '493-170-9623',  'kale.biz',       0, 0),
  (5, 'Daniel Pilant',  'Daniel',    'doubledan@gmail.com',  '050-000-0000',   'daniel.dev',    1, 1);

-- ---- user_auth -------------------------------------------------------------
-- IMPORTANT: these are real bcrypt hashes for the literal password
-- "password123" (generated with bcryptjs, cost 10) — for local testing only,
-- so the seed accounts can log in. Real hashes are generated by the app at
-- registration time; never insert plaintext here.
INSERT INTO user_auth (user_id, password_hash) VALUES
  (1, '$2b$10$D2gunAzk9PIMECepePasce7Q.dv8z.nrwQO1Zg7Px2A2qTK8aFppi'),
  (2, '$2b$10$D2gunAzk9PIMECepePasce7Q.dv8z.nrwQO1Zg7Px2A2qTK8aFppi'),
  (3, '$2b$10$D2gunAzk9PIMECepePasce7Q.dv8z.nrwQO1Zg7Px2A2qTK8aFppi'),
  (4, '$2b$10$D2gunAzk9PIMECepePasce7Q.dv8z.nrwQO1Zg7Px2A2qTK8aFppi'),
  (5, '$2b$10$D2gunAzk9PIMECepePasce7Q.dv8z.nrwQO1Zg7Px2A2qTK8aFppi');

-- ---- todos -----------------------------------------------------------------
INSERT INTO todos (id, user_id, title, completed) VALUES
  (1, 1, 'Buy groceries',            FALSE),
  (2, 1, 'Finish backend API',       TRUE),
  (3, 2, 'Write unit tests',         FALSE),
  (4, 2, 'Review pull request',      TRUE),
  (5, 3, 'Deploy to staging',        FALSE),
  (6, 4, 'Update documentation',     FALSE);

-- ---- posts -----------------------------------------------------------------
INSERT INTO posts (id, user_id, title, body) VALUES
  (1, 1, 'Getting started with SQL',  'A short intro to relational databases and joins.'),
  (2, 1, 'Why InnoDB matters',        'Foreign keys and transactions explained simply.'),
  (3, 2, 'REST API design tips',      'Naming routes and structuring resources cleanly.'),
  (4, 3, 'Hashing passwords safely',  'Use bcrypt or argon2 — never store plaintext.');

-- ---- comments --------------------------------------------------------------
-- user_id = the comment's owner. Seeded to the post's author so each seed
-- comment has a valid owner who can edit/delete it.
INSERT INTO comments (id, post_id, user_id, name, email, body) VALUES
  (1, 1, 1, 'Great read',        'reader1@example.com', 'This cleared up joins for me, thanks!'),
  (2, 1, 1, 'Follow-up',         'reader2@example.com', 'Could you cover LEFT vs INNER next?'),
  (3, 2, 1, 'Helpful',           'reader3@example.com', 'Switched my tables to InnoDB after this.'),
  (4, 3, 2, 'Nice tips',         'reader4@example.com', 'The route naming section was gold.'),
  (5, 4, 3, 'Security matters',  'reader5@example.com', 'Glad you mentioned argon2 too.');

-- ---- albums ----------------------------------------------------------------
INSERT INTO albums (id, user_id, title) VALUES
  (1, 1, 'Vacation 2026'),
  (2, 1, 'Pets'),
  (3, 2, 'Work projects');

-- ---- photos (images by URL) ------------------------------------------------
INSERT INTO photos (id, album_id, title, url) VALUES
  (1, 1, 'Beach sunset', 'https://picsum.photos/seed/beach/300/200'),
  (2, 1, 'Mountain trail', 'https://picsum.photos/seed/mountain/300/200'),
  (3, 2, 'Sleepy cat', 'https://picsum.photos/seed/cat/300/200'),
  (4, 3, 'Whiteboard plan', 'https://picsum.photos/seed/work/300/200');

-- =============================================================================
-- End of init.sql
-- =============================================================================
