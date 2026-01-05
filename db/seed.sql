USE minijira;

-- Roles
INSERT INTO AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp) VALUES
('r_user', 'USER', 'USER', 'd9b6a39d-e638-4900-b5d6-38c97acba304'),
('r_mgr', 'MANAGER', 'MANAGER', '12fe76e6-d177-4d1a-85e8-21247cbb5545'),
('r_admin', 'ADMIN', 'ADMIN', '392fcabc-df23-4468-9e48-ea0e532360f6')
ON DUPLICATE KEY UPDATE ConcurrencyStamp = VALUES(ConcurrencyStamp);

-- Departments
INSERT INTO Departments (Id, Name) VALUES
('dep_eng', 'Engineering'),
('dep_ops', 'Operations'),
('dep_sales', 'Sales')
ON DUPLICATE KEY UPDATE Name = VALUES(Name);

-- Users (IdentityV3 password hash). EmailConfirmed = 1.
INSERT INTO AspNetUsers (
  Id, UserName, NormalizedUserName, Email, NormalizedEmail, EmailConfirmed,
  PasswordHash, SecurityStamp, ConcurrencyStamp,
  PhoneNumberConfirmed, TwoFactorEnabled, LockoutEnabled, AccessFailedCount,
  Name, DepartmentId
) VALUES
('u_user', 'user@demo.com', 'USER@DEMO.COM', 'user@demo.com', 'USER@DEMO.COM', 1,
'AQAAAAEAACcQAAAAECqCyDnolsZHSZ8cG3bOVnEAAAAga81xB0/ofSKvL+mj+NnnZM6JPgGiWO5sgFnjS1e2n6g=', 'c816c7cf-8e1a-422e-9930-c3ef5b52cc08', 'f8135392-3f83-4ffd-8474-f49792f6d647',
0, 0, 1, 0,
'Demo User', 'dep_eng'),
('u_mgr', 'manager@demo.com', 'MANAGER@DEMO.COM', 'manager@demo.com', 'MANAGER@DEMO.COM', 1,
'AQAAAAEAACcQAAAAECqCyDnolsZHSZ8cG3bOVnEAAAAga81xB0/ofSKvL+mj+NnnZM6JPgGiWO5sgFnjS1e2n6g=', 'befd8f57-128e-4369-8695-51937c01d404', '30329be0-5dd8-4270-b4e8-194991a3d39d',
0, 0, 1, 0,
'Demo Manager', 'dep_eng'),
('u_admin', 'admin@demo.com', 'ADMIN@DEMO.COM', 'admin@demo.com', 'ADMIN@DEMO.COM', 1,
'AQAAAAEAACcQAAAAECqCyDnolsZHSZ8cG3bOVnEAAAAga81xB0/ofSKvL+mj+NnnZM6JPgGiWO5sgFnjS1e2n6g=', '3a054f95-95bd-46d9-9cf8-da9bd4e97145', '87ee6666-204e-451a-adc0-26d7eac0e25f',
0, 0, 1, 0,
'Demo Admin', 'dep_ops')
ON DUPLICATE KEY UPDATE
  Email = VALUES(Email),
  NormalizedEmail = VALUES(NormalizedEmail),
  PasswordHash = VALUES(PasswordHash),
  Name = VALUES(Name),
  DepartmentId = VALUES(DepartmentId);

-- User roles
INSERT IGNORE INTO AspNetUserRoles (UserId, RoleId) VALUES
('u_user', 'r_user'),
('u_mgr', 'r_mgr'),
('u_admin', 'r_admin');

-- Projects
INSERT INTO Projects (Id, `Key`, Name, DepartmentId, Archived, CreatedAt, CreatedByUserId) VALUES
('p_acme', 'ACME', 'ACME Platform', 'dep_eng', 0, UTC_TIMESTAMP(6) - INTERVAL 12 DAY, 'u_user'),
('p_ops', 'OPS', 'Ops Dashboard', 'dep_ops', 0, UTC_TIMESTAMP(6) - INTERVAL 6 DAY, 'u_admin')
ON DUPLICATE KEY UPDATE Name = VALUES(Name), DepartmentId = VALUES(DepartmentId), Archived = VALUES(Archived);

-- Project members (M:N + Role + JoinedAt)
INSERT IGNORE INTO ProjectMembers (ProjectId, UserId, Role, JoinedAt) VALUES
('p_acme', 'u_user', 'OWNER', UTC_TIMESTAMP(6) - INTERVAL 12 DAY),
('p_acme', 'u_mgr', 'MEMBER', UTC_TIMESTAMP(6) - INTERVAL 6 DAY),
('p_ops', 'u_admin', 'OWNER', UTC_TIMESTAMP(6) - INTERVAL 6 DAY);

-- Tasks
INSERT INTO Tasks (Id, ProjectId, Title, Description, Status, Priority, DueDate, CreatedAt, CreatedByUserId) VALUES
('t_1', 'p_acme', 'Implement JWT auth', 'Add login/register + JWT configuration + protected endpoints.', 'IN_PROGRESS', 'HIGH', UTC_TIMESTAMP(6) + INTERVAL 7 DAY, UTC_TIMESTAMP(6) - INTERVAL 2 DAY, 'u_user'),
('t_2', 'p_acme', 'Create ProjectMembers (M:N + role)', 'Join table with Role + JoinedAt.', 'TODO', 'MEDIUM', UTC_TIMESTAMP(6) + INTERVAL 14 DAY, UTC_TIMESTAMP(6) - INTERVAL 1 DAY, 'u_mgr'),
('t_3', 'p_ops', 'Add departments page', 'Admin-only CRUD for departments.', 'REVIEW', 'LOW', NULL, UTC_TIMESTAMP(6) - INTERVAL 3 DAY, 'u_admin')
ON DUPLICATE KEY UPDATE Title = VALUES(Title), Status = VALUES(Status), Priority = VALUES(Priority);

-- Task assignees (M:N + AssignedAt)
INSERT IGNORE INTO TaskAssignees (TaskId, UserId, AssignedAt, AssignedByUserId) VALUES
('t_1', 'u_user', UTC_TIMESTAMP(6) - INTERVAL 2 DAY, 'u_user'),
('t_2', 'u_mgr', UTC_TIMESTAMP(6) - INTERVAL 1 DAY, 'u_user'),
('t_3', 'u_admin', UTC_TIMESTAMP(6) - INTERVAL 3 DAY, 'u_admin');

-- Comments
INSERT INTO Comments (Id, TaskId, AuthorUserId, Body, CreatedAt) VALUES
('c_1', 't_1', 'u_mgr', 'Keep access tokens short-lived; refresh tokens should be HttpOnly cookies in production.', UTC_TIMESTAMP(6) - INTERVAL 1 DAY)
ON DUPLICATE KEY UPDATE Body = VALUES(Body);
