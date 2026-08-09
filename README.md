# Task Management Application

Full-stack task manager — HTML/CSS/JS frontend, Node.js/Express backend, MongoDB database, JWT authentication.

## Features
- User registration & login (passwords hashed with bcrypt)
- JWT-based authentication protecting all task routes
- Full CRUD for tasks (create, read, update status, delete)
- Each user only sees their own tasks
- Responsive layout

## Project structure
```
task-manager/
  backend/
    config/db.js
    models/User.js
    models/Task.js
    middleware/auth.js
    routes/authRoutes.js
    routes/taskRoutes.js
    server.js
    package.json
    .env.example
  frontend/
    index.html
    style.css
    script.js
```

## Running the backend

1. Make sure MongoDB is installed and running locally (or use a MongoDB Atlas connection string).
2. In `backend/`, copy `.env.example` to `.env` and fill in your own `JWT_SECRET`:
   ```
   cd backend
   cp .env.example .env
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the server:
   ```
   npm start
   ```
   You should see `MongoDB connected` and `Server running on port 5000`.

## Running the frontend

The frontend is plain HTML/CSS/JS — no build step needed. Just open `frontend/index.html` in your browser (or use the "Live Server" extension in VS Code).

Make sure the backend is running first, since the frontend calls `http://localhost:5000/api`.

## API endpoints

| Method | Endpoint             | Auth required | Description         |
|--------|-----------------------|:--:|----------------------|
| POST   | /api/auth/register    | No | Create a new account |
| POST   | /api/auth/login       | No | Log in, get a JWT    |
| GET    | /api/tasks            | Yes | List your tasks     |
| POST   | /api/tasks            | Yes | Create a task        |
| PUT    | /api/tasks/:id        | Yes | Update a task        |
| DELETE | /api/tasks/:id        | Yes | Delete a task        |
