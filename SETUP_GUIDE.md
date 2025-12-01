# Capstone Job Portal – Setup & Transfer Guide

This document explains **everything that was added**, **how the project is structured**, and **every step you or someone else must follow** to run it on any Windows machine.

---

## 1. What the project contains

| Path / File | Purpose |
|-------------|---------|
| `server.js` | Express app, session setup, static file serving, API mounts |
| `config/db.js` | mysql2 connection pool using `.env` variables |
| `routes/authRoutes.js` | `/api/auth/login`, `/logout`, `/me` |
| `routes/applicationRoutes.js` | Job application upload + list endpoints |
| `middleware/auth.js` | Guards for regular and admin-only routes |
| `uploads/` | Stored resumes (served through `/uploads`) |
| `index.html`, `jobs.html`, `login.html` | Existing UI, now wired to backend |
| `applied.html` | Shows the logged-in user’s applications |
| `admin.html` | Dashboard for admins to review all submissions |
| `script.js` | Front-end logic (login, application submit, dashboards, chatbot) |
| `schema.sql` | Creates `users` and `job_applications` tables |
| `seed.sql` | Inserts demo admin (`admin/Admin@123`) and user (`student/User@123`) |
| `env.sample` | Template for `.env` variables |
| `README.md` | Quick reference and high-level summary |
| `SETUP_GUIDE.md` | (this file) step-by-step instructions and transfer notes |

Everything is already coded; you only need to configure MySQL, create the `.env`, and start the server.

---

## 2. One-time environment preparation (Windows)

### 2.1 Install prerequisites
1. **Node.js 18+** – download from https://nodejs.org and run the installer.
2. **MySQL Community Server 8.x** – download the “Windows (x86, 64-bit), MSI Installer” from https://dev.mysql.com/downloads/mysql/.
   - Choose *Developer Default* during setup.
   - Set a root password you can remember (example: `MyPass123!`).
   - When the wizard shows the checklist (writing config, firewall, etc.) click **Execute** and wait for all green checks.

### 2.2 Verify `mysql` command works
Open a *new* PowerShell window (close others first) and run:
```powershell
mysql --version
```
If it prints a version string, you are good. If it says “not recognized”, add MySQL’s `bin` folder to PATH (adjust version if needed):
```powershell
setx PATH "$Env:PATH;C:\Program Files\MySQL\MySQL Server 8.0\bin"
```
Close the window, open a new one, and run `mysql --version` again.

---

## 3. Project setup steps (run inside the project folder)

All commands below are executed from:
```
C:\Users\nutha\Downloads\capstone\capstone FINAL
```

1. **Install Node dependencies**
   ```powershell
   npm install
   ```

2. **Create the `.env` file**
   ```powershell
   Copy-Item env.sample .env
   notepad .env
   ```
   Update the values:
   ```
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root                # replace if you created another user
   DB_PASSWORD=MyPass123!      # the password you chose during install
   DB_NAME=capstone_jobs
   SESSION_SECRET=anyRandomString
   ```
   Save and close Notepad.

3. **Create tables + demo users (run each once)**
   ```powershell
   cmd /c "mysql -u root -p < schema.sql"
   cmd /c "mysql -u root -p < seed.sql"
   ```
   Enter your MySQL password when prompted. If you used a different username, replace `root`.

4. **Start the application**
   ```powershell
   npm start
   ```
   Leave this window running; it serves the static files and APIs on `http://localhost:3000`.

5. **Use the portal**
   - Open `http://localhost:3000/login.html`.
   - Log in with:
     - Admin → `admin / Admin@123`
     - User → `student / User@123`
   - Users apply via `jobs.html` and track entries in `applied.html`.
   - Admin reviews everything at `admin.html`.

Once steps 1–3 are done, the daily routine is simply: `cd …`, `npm start`, browse to the site.

---

## 4. Troubleshooting quick notes

| Problem | Fix |
|---------|-----|
| `mysql` not recognized | Re-open PowerShell after installing MySQL or run the `setx PATH ...` command with the correct bin folder. |
| Permission error writing `.env` | Ensure the terminal is opened with normal user privileges (not inside a read-only folder). |
| SQL command asks for password repeatedly | Check that you’re typing the same password set during MySQL install; if you forget, open MySQL Workbench and reset the root password. |
| `npm start` fails with DB error | Confirm `.env` values (host/user/password/db name) match your MySQL settings and that MySQL is running (Services → MySQL80 → Start). |

---

## 5. Sharing / running from a ZIP on another system

1. Zip up the entire `capstone FINAL` folder (include hidden files like `.env` if you want to keep credentials; otherwise leave `.env` out).
2. On the new machine:
   - Install Node.js and MySQL just like section 2.
   - Extract the ZIP to a convenient path (e.g., `C:\Projects\capstone`).
   - Copy `env.sample` → `.env` and fill in the *new machine’s* MySQL credentials.
   - From the extracted folder, run `npm install`, then execute `schema.sql` and `seed.sql` using the local MySQL credentials.
   - Finally run `npm start`.

Remember: the SQL scripts must be run on each machine because they create the database locally; the uploaded resumes live in `uploads/`, so copy that folder if you need existing submissions.

---

## 6. Summary of what has already been done

- Frontend pages remain unchanged visually but now point to real API routes.
- Backend is fully implemented with Express, mysql2, sessions, and multer.
- Schema and seed scripts are included for quick DB setup.
- Demo credentials are baked in for testing.
- This guide + README give you every command to reproduce the environment.

You now have a complete, repeatable procedure to launch the capstone job portal on any Windows device. Keep this file with the project so future teammates can bootstrap the app without asking for extra instructions.


