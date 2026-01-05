
# MiniJira  (Mini project management app)

A lightweight Jira-like app built as a learning project:
- Projects with members and roles
- Kanban board + task list
- Task details modal (edit, assign users, comments)
- Admin panel: users + departments + project deletion (admin-only)
- JWT authentication + role-based authorization

## Tech stack
**Frontend**
- React + Vite
- Material UI (MUI)

**Backend**
- ASP.NET Core Web API
- Entity Framework Core + MySQL
- ASP.NET Core Identity (users/roles)
- JWT auth

**Infrastructure**
- Docker Compose (MySQL)

---

## Features
### Authentication
- Register + Login
- JWT stored in localStorage
- Role-based access control (USER / MANAGER / ADMIN)

### Projects
- List projects you can access
- Create project (role-based rules)
- Project page tabs:
  - Board (Kanban)
  - Tasks (create + list)
  - Members (manage membership + project roles)
  - Settings (archive, rename, etc.)

### Tasks
- Create / Edit / Delete (permission-based)
- Priority, status, due date
- Assign/unassign users
- Comments per task

### Admin panel (ADMIN only)
- Users list + search + pagination
- Change user roles
- Change user department
- Reset user password
- Departments CRUD
- Delete projects (hard delete with cascade cleanup)

---

## Demo accounts
Seeded by backend startup seeder:

- **User**: `user@demo.com` / `Demo123!`
- **Manager**: `manager@demo.com` / `Demo123!`
- **Admin**: `admin@demo.com` / `Demo123!`

---

## Run locally (Docker + backend + frontend)

### 1) Start MySQL
From repo root:
```bash
docker compose up -d
````

> If you changed SQL init scripts and want them to re-run:

```bash
docker compose down -v
docker compose up -d
```

### 2) Run backend

```bash
cd backend/MiniJira.Api
dotnet restore
dotnet run
```

Backend should be available at:

* `http://localhost:5000`

Swagger (dev):

* `http://localhost:5000/swagger`

### 3) Run frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend (Vite):

* `http://localhost:5173`

---

## Environment notes

### CORS

Backend allows the frontend origin:

* `http://localhost:5173`

### Database

EF Core + Identity creates/uses tables automatically.
The project domain tables:

* Departments, Projects, ProjectMembers, Tasks, TaskAssignees, Comments

Identity tables (framework-managed):

* AspNetUsers, AspNetRoles, AspNetUserRoles, etc.

---

## API overview (high level)

* `POST /api/auth/register`
* `POST /api/auth/login`
* `GET /api/me`

Projects:

* `GET /api/projects`
* `POST /api/projects`
* `GET /api/projects/{id}`
* `PUT /api/projects/{id}`
* `DELETE /api/projects/{id}` (ADMIN)

Members:

* `GET /api/projects/{id}/members`
* `POST /api/projects/{id}/members`
* `PUT /api/projects/{id}/members/{userId}`
* `DELETE /api/projects/{id}/members/{userId}`

Tasks:

* `GET /api/projects/{projectId}/tasks`
* `POST /api/projects/{projectId}/tasks`
* `GET /api/tasks/{taskId}`
* `PUT /api/tasks/{taskId}`
* `DELETE /api/tasks/{taskId}`
* `POST /api/tasks/{taskId}/assignees/{userId}`
* `DELETE /api/tasks/{taskId}/assignees/{userId}`

Comments:

* `GET /api/tasks/{taskId}/comments`
* `POST /api/tasks/{taskId}/comments`

Admin (ADMIN only):

* `/api/admin/users...`
* `/api/admin/departments...`
