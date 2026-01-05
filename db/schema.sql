
CREATE DATABASE IF NOT EXISTS minijira CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE minijira;

CREATE TABLE IF NOT EXISTS AspNetRoles (
  Id VARCHAR(255) NOT NULL,
  Name VARCHAR(255) NULL,
  NormalizedName VARCHAR(255) NULL,
  ConcurrencyStamp TEXT NULL,
  PRIMARY KEY (Id),
  UNIQUE KEY IX_AspNetRoles_NormalizedName (NormalizedName)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS AspNetUsers (
  Id VARCHAR(255) NOT NULL,
  UserName VARCHAR(255) NULL,
  NormalizedUserName VARCHAR(255) NULL,
  Email VARCHAR(255) NULL,
  NormalizedEmail VARCHAR(255) NULL,
  EmailConfirmed TINYINT(1) NOT NULL,
  PasswordHash TEXT NULL,
  SecurityStamp TEXT NULL,
  ConcurrencyStamp TEXT NULL,
  PhoneNumber TEXT NULL,
  PhoneNumberConfirmed TINYINT(1) NOT NULL,
  TwoFactorEnabled TINYINT(1) NOT NULL,
  LockoutEnd DATETIME(6) NULL,
  LockoutEnabled TINYINT(1) NOT NULL,
  AccessFailedCount INT NOT NULL,

  -- AppUser extra columns
  Name VARCHAR(128) NULL,
  DepartmentId VARCHAR(64) NULL,

  PRIMARY KEY (Id),
  UNIQUE KEY IX_AspNetUsers_NormalizedUserName (NormalizedUserName),
  KEY IX_AspNetUsers_NormalizedEmail (NormalizedEmail)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS AspNetRoleClaims (
  Id INT NOT NULL AUTO_INCREMENT,
  RoleId VARCHAR(255) NOT NULL,
  ClaimType TEXT NULL,
  ClaimValue TEXT NULL,
  PRIMARY KEY (Id),
  KEY IX_AspNetRoleClaims_RoleId (RoleId),
  CONSTRAINT FK_AspNetRoleClaims_AspNetRoles_RoleId FOREIGN KEY (RoleId) REFERENCES AspNetRoles (Id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS AspNetUserClaims (
  Id INT NOT NULL AUTO_INCREMENT,
  UserId VARCHAR(255) NOT NULL,
  ClaimType TEXT NULL,
  ClaimValue TEXT NULL,
  PRIMARY KEY (Id),
  KEY IX_AspNetUserClaims_UserId (UserId),
  CONSTRAINT FK_AspNetUserClaims_AspNetUsers_UserId FOREIGN KEY (UserId) REFERENCES AspNetUsers (Id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS AspNetUserLogins (
  LoginProvider VARCHAR(128) NOT NULL,
  ProviderKey VARCHAR(128) NOT NULL,
  ProviderDisplayName TEXT NULL,
  UserId VARCHAR(255) NOT NULL,
  PRIMARY KEY (LoginProvider, ProviderKey),
  KEY IX_AspNetUserLogins_UserId (UserId),
  CONSTRAINT FK_AspNetUserLogins_AspNetUsers_UserId FOREIGN KEY (UserId) REFERENCES AspNetUsers (Id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS AspNetUserRoles (
  UserId VARCHAR(255) NOT NULL,
  RoleId VARCHAR(255) NOT NULL,
  PRIMARY KEY (UserId, RoleId),
  KEY IX_AspNetUserRoles_RoleId (RoleId),
  CONSTRAINT FK_AspNetUserRoles_AspNetRoles_RoleId FOREIGN KEY (RoleId) REFERENCES AspNetRoles (Id) ON DELETE CASCADE,
  CONSTRAINT FK_AspNetUserRoles_AspNetUsers_UserId FOREIGN KEY (UserId) REFERENCES AspNetUsers (Id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS AspNetUserTokens (
  UserId VARCHAR(255) NOT NULL,
  LoginProvider VARCHAR(128) NOT NULL,
  Name VARCHAR(128) NOT NULL,
  Value TEXT NULL,
  PRIMARY KEY (UserId, LoginProvider, Name),
  CONSTRAINT FK_AspNetUserTokens_AspNetUsers_UserId FOREIGN KEY (UserId) REFERENCES AspNetUsers (Id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- App tables ----------
CREATE TABLE IF NOT EXISTS Departments (
  Id VARCHAR(64) NOT NULL,
  Name VARCHAR(128) NOT NULL,
  PRIMARY KEY (Id),
  UNIQUE KEY IX_Departments_Name (Name)
) ENGINE=InnoDB;

-- Add FK from users to departments now that Departments exists
ALTER TABLE AspNetUsers
  ADD CONSTRAINT FK_AspNetUsers_Departments_DepartmentId
  FOREIGN KEY (DepartmentId) REFERENCES Departments (Id)
  ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS Projects (
  Id VARCHAR(64) NOT NULL,
  `Key` VARCHAR(12) NOT NULL,
  Name VARCHAR(200) NOT NULL,
  DepartmentId VARCHAR(64) NOT NULL,
  Archived TINYINT(1) NOT NULL DEFAULT 0,
  CreatedAt DATETIME(6) NOT NULL,
  CreatedByUserId VARCHAR(255) NULL,
  PRIMARY KEY (Id),
  UNIQUE KEY IX_Projects_Key (`Key`),
  KEY IX_Projects_DepartmentId (DepartmentId),
  KEY IX_Projects_CreatedByUserId (CreatedByUserId),
  CONSTRAINT FK_Projects_Departments_DepartmentId FOREIGN KEY (DepartmentId) REFERENCES Departments (Id) ON DELETE RESTRICT,
  CONSTRAINT FK_Projects_AspNetUsers_CreatedByUserId FOREIGN KEY (CreatedByUserId) REFERENCES AspNetUsers (Id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ProjectMembers (
  ProjectId VARCHAR(64) NOT NULL,
  UserId VARCHAR(255) NOT NULL,
  Role VARCHAR(16) NOT NULL,
  JoinedAt DATETIME(6) NOT NULL,
  PRIMARY KEY (ProjectId, UserId),
  KEY IX_ProjectMembers_UserId (UserId),
  CONSTRAINT FK_ProjectMembers_Projects_ProjectId FOREIGN KEY (ProjectId) REFERENCES Projects (Id) ON DELETE CASCADE,
  CONSTRAINT FK_ProjectMembers_AspNetUsers_UserId FOREIGN KEY (UserId) REFERENCES AspNetUsers (Id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Tasks (
  Id VARCHAR(64) NOT NULL,
  ProjectId VARCHAR(64) NOT NULL,
  Title VARCHAR(200) NOT NULL,
  Description VARCHAR(4000) NULL,
  Status VARCHAR(24) NOT NULL,
  Priority VARCHAR(24) NOT NULL,
  DueDate DATETIME(6) NULL,
  CreatedAt DATETIME(6) NOT NULL,
  CreatedByUserId VARCHAR(255) NULL,
  PRIMARY KEY (Id),
  KEY IX_Tasks_ProjectId (ProjectId),
  KEY IX_Tasks_CreatedByUserId (CreatedByUserId),
  CONSTRAINT FK_Tasks_Projects_ProjectId FOREIGN KEY (ProjectId) REFERENCES Projects (Id) ON DELETE CASCADE,
  CONSTRAINT FK_Tasks_AspNetUsers_CreatedByUserId FOREIGN KEY (CreatedByUserId) REFERENCES AspNetUsers (Id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS TaskAssignees (
  TaskId VARCHAR(64) NOT NULL,
  UserId VARCHAR(450) NOT NULL,
  AssignedAt DATETIME(6) NOT NULL,
  AssignedByUserId VARCHAR(255) NULL,
  PRIMARY KEY (TaskId, UserId),
  KEY IX_TaskAssignees_UserId (UserId),
  KEY IX_TaskAssignees_AssignedByUserId (AssignedByUserId),
  CONSTRAINT FK_TaskAssignees_Tasks_TaskId FOREIGN KEY (TaskId) REFERENCES Tasks (Id) ON DELETE CASCADE,
  CONSTRAINT FK_TaskAssignees_AspNetUsers_UserId FOREIGN KEY (UserId) REFERENCES AspNetUsers (Id) ON DELETE CASCADE,
  CONSTRAINT FK_TaskAssignees_AspNetUsers_AssignedByUserId FOREIGN KEY (AssignedByUserId) REFERENCES AspNetUsers (Id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Comments (
  Id VARCHAR(64) NOT NULL,
  TaskId VARCHAR(64) NOT NULL,
  AuthorUserId VARCHAR(255) NULL,
  Body VARCHAR(4000) NOT NULL,
  CreatedAt DATETIME(6) NOT NULL,
  PRIMARY KEY (Id),
  KEY IX_Comments_TaskId (TaskId),
  KEY IX_Comments_AuthorUserId (AuthorUserId),
  CONSTRAINT FK_Comments_Tasks_TaskId FOREIGN KEY (TaskId) REFERENCES Tasks (Id) ON DELETE CASCADE,
  CONSTRAINT FK_Comments_AspNetUsers_AuthorUserId FOREIGN KEY (AuthorUserId) REFERENCES AspNetUsers (Id) ON DELETE SET NULL
) ENGINE=InnoDB;
