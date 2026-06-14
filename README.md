# Full-Stack JSONPlaceholder Clone (MySQL + Express + React)

A full client–server app that mimics [jsonplaceholder.typicode.com](https://jsonplaceholder.typicode.com)
with a real relational database and built-in authentication.

- **Database:** MySQL (run in Docker)
- **Backend:** Node.js + Express REST API, 3-layer architecture (routes → controllers → services), raw SQL via `mysql2` (no ORM)
- **Frontend:** React (Vite) + React Router + axios, with localStorage auth

```
project_6/
├── backend/     # Express API + init.sql (database schema & seed)
└── frontend/    # React (Vite) client
```

> **About "requirements.txt":** Node projects don't use one. The equivalent is
> each folder's **`package.json`** (the dependency list) — running `npm install`
> in `backend/` and `frontend/` installs everything, just like `pip install -r`.

---

## Prerequisites

Install these once:

- **Node.js 18+** (developed on v24) — https://nodejs.org → check with `node -v`
- **Docker Desktop** — https://www.docker.com/products/docker-desktop → check with `docker -v`

---

## Setup (first time)

### 1. Start MySQL in Docker

This creates a MySQL container named `my-mysql-db`, root password `mysecretpassword`,
exposed on port `3306`:

```bash
docker run --name my-mysql-db -e MYSQL_ROOT_PASSWORD=mysecretpassword -p 3306:3306 -d mysql:latest
```

Wait ~15–30s for it to finish starting. Check it's ready:

```bash
docker exec my-mysql-db mysqladmin ping -u root -pmysecretpassword
# -> "mysqld is alive"
```

(Optional) make it start automatically when Docker/Windows boots, so you don't
have to start it manually each time:

```bash
docker update --restart unless-stopped my-mysql-db
```

### 2. Create the database and load the seed data

This runs `backend/init.sql`, which creates all tables and inserts mock data.

**Windows CMD** (or macOS/Linux):
```bash
docker exec -i my-mysql-db mysql -u root -pmysecretpassword < backend/init.sql
```

**Windows PowerShell** (the `<` redirect isn't supported there, so pipe instead):
```powershell
Get-Content backend/init.sql | docker exec -i my-mysql-db mysql -u root -pmysecretpassword
```

Verify:
```bash
docker exec -i my-mysql-db mysql -u root -pmysecretpassword jsonplaceholder_db -e "SHOW TABLES;"
```

### 3. Backend (Express API)

```bash
cd backend
copy .env.example .env     # Windows CMD   (PowerShell: Copy-Item .env.example .env ; macOS/Linux: cp)
npm install
npm start
```

The API runs on **http://localhost:3000**. You should see:
```
[db] Connected to MySQL 'jsonplaceholder_db' at localhost:3306
[server] API listening on http://localhost:3000
```

### 4. Frontend (React client)

Open a **second terminal**:

```bash
cd frontend
copy .env.example .env     # Windows CMD   (PowerShell: Copy-Item ; macOS/Linux: cp)
npm install
npm run dev
```

The app runs on **http://localhost:4000** (not the Vite default 5173, which is in a
Windows-reserved port range — see `frontend/vite.config.js`).

---

## Using the app

Open http://localhost:4000 and log in with a seed account:

| Username | Password      |
|----------|---------------|
| `bret`   | `password123` |

Or click **Register** to create a new account. Once logged in you can manage your
**Todos** and **Posts** (with comments).

---

## Running it again later

The database persists inside the container, so you only do the setup once. To run
the app on subsequent days:

```bash
docker start my-mysql-db        # if it isn't already running
cd backend  && npm start        # terminal 1
cd frontend && npm run dev       # terminal 2
```

---

## Default configuration

| Setting        | Value                  | Where                      |
|----------------|------------------------|----------------------------|
| DB host:port   | `localhost:3306`       | `backend/.env`             |
| DB user / pass | `root` / `mysecretpassword` | `backend/.env`        |
| DB name        | `jsonplaceholder_db`   | `backend/.env`             |
| API port       | `3000`                 | `backend/.env`             |
| Frontend port  | `4000`                 | `frontend/vite.config.js`  |
| API base URL   | `http://localhost:3000`| `frontend/.env`            |

---

## Troubleshooting

- **Backend: `could not connect to MySQL`** → the container is stopped. Run `docker start my-mysql-db`.
- **`EADDRINUSE: ...:3000`** → a previous backend is still running. Stop it, or find the process on port 3000 and kill it.
- **Reset the database to the clean seed** → re-run step 2 (it drops and recreates everything).
- **Frontend can't reach the API** → make sure the backend is running and `frontend/.env` has `VITE_API_URL=http://localhost:3000`.
