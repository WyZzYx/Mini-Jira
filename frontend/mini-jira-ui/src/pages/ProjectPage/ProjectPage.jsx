import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    Stack,
    Tab,
    Tabs,
    Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import ViewKanbanIcon from "@mui/icons-material/ViewKanban";
import GroupIcon from "@mui/icons-material/Group";
import SettingsIcon from "@mui/icons-material/Settings";
import ListAltIcon from "@mui/icons-material/ListAlt";

import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { request } from "../../api/client";

import BoardTab from "./BoardTab";
import MembersTab from "./MembersTab";
import TaskModal from "./TaskModal";
import TasksTab from "./TasksTab";
import SettingsTab from "./SettingsTab";





function canManageProject(me, project) {
    if (!me || !project) return false;
    if (me.roles?.includes("ADMIN")) return true;
    if (project.myProjectRole === "OWNER") return true;
    if (me.roles?.includes("MANAGER") && me.departmentId && project.departmentId && me.departmentId === project.departmentId) return true;
    return false;
}

function canManageMembers(me, project) {
    if (!me || !project) return false;
    if (me.roles?.includes("ADMIN")) return true;
    return project.myProjectRole === "OWNER";
}

export default function ProjectPage({ t, projectId, onBack }) {
    const { token, me } = useAuth();
    const { show } = useToast();

    const [busy, setBusy] = useState(false);
    const [tab, setTab] = useState("board"); // board | tasks | members | settings

    const [project, setProject] = useState(null);
    const [members, setMembers] = useState([]);
    const [tasks, setTasks] = useState([]);

    const [taskModal, setTaskModal] = useState({ open: false, taskId: null });

    const title = useMemo(() => {
        if (!project) return t?.("loading") || "Loading…";
        return `${project.key} — ${project.name}`;
    }, [project, t]);

    async function loadAll() {
        if (!token || !projectId) return;
        setBusy(true);
        try {
            const p = await request(`/api/projects/${projectId}`, { token });
            const ms = await request(`/api/projects/${projectId}/members`, { token });
            const ts = await request(`/api/projects/${projectId}/tasks?page=1&pageSize=200`, { token });
            setProject(p);
            setMembers(ms || []);
            setTasks((ts && ts.items) || []);
        } catch (e) {
            show(`❌ ${e.status ? `${e.status} ` : ""}${e.message}`, { severity: "error" });
        } finally {
            setBusy(false);
        }
    }

    async function createTask({ title, description, priority, dueDate }) {
        if (!token || !projectId) return;
        setBusy(true);
        try {
            await request(`/api/projects/${projectId}/tasks`, {
                token,
                method: "POST",
                body: {
                    title: title?.trim(),
                    description: description?.trim() || null,
                    priority,
                    dueDate: dueDate ? new Date(dueDate).toISOString() : null,
                },
            });
            show("✅ Task created", { severity: "success" });
            await loadAll();
        } catch (e) {
            show(`❌ ${e.status ? `${e.status} ` : ""}${e.message}`, { severity: "error" });
        } finally {
            setBusy(false);
        }
    }

    async function updateProject({ name, archived }) {
        if (!token || !projectId) return;
        setBusy(true);
        try {
            await request(`/api/projects/${projectId}`, {
                token,
                method: "PUT",
                body: { name, archived },
            });
            show("✅ Saved", { severity: "success" });
            await loadAll();
        } catch (e) {
            show(`❌ ${e.status ? `${e.status} ` : ""}${e.message}`, { severity: "error" });
        } finally {
            setBusy(false);
        }
    }


    useEffect(() => {
        setTab("board");
    }, [projectId]);

    useEffect(() => {
        loadAll();
    }, [token, projectId]);

    const manageProject = canManageProject(me, project);
    const manageMembers = canManageMembers(me, project);

    return (
        <Box>
            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <IconButton onClick={onBack} aria-label="back">
                    <ArrowBackIcon />
                </IconButton>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" fontWeight={800} noWrap>
                        {title}
                    </Typography>

                    {project ? (
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                            <Chip size="small" label={project.departmentName || project.departmentId || "—"} />
                            <Chip size="small" label={project.archived ? (t?.("archived") || "Archived") : "Active"} color={project.archived ? "warning" : "success"} />
                            <Chip size="small" label={project.myProjectRole ? `Role: ${project.myProjectRole}` : "Role: —"} />
                            {manageProject && <Chip size="small" label="Manage" color="primary" />}
                        </Stack>
                    ) : null}
                </Box>

                <IconButton onClick={loadAll} disabled={busy} aria-label="refresh">
                    <RefreshIcon />
                </IconButton>

                {busy ? <CircularProgress size={22} /> : null}
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {/* Tabs */}
            <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 2 }}
            >
                <Tab icon={<ViewKanbanIcon />} iconPosition="start" value="board" label={t?.("board") || "Board"} />
                <Tab icon={<ListAltIcon />} iconPosition="start" value="tasks" label={t?.("tasks") || "Tasks"} />
                <Tab icon={<GroupIcon />} iconPosition="start" value="members" label={t?.("members") || "Members"} />
                <Tab icon={<SettingsIcon />} iconPosition="start" value="settings" label={t?.("settings") || "Settings"} />
            </Tabs>

            {/* Content */}
            {tab === "board" && (
                <BoardTab
                    t={t}
                    tasks={tasks}
                    onOpenTask={(id) => setTaskModal({ open: true, taskId: id })}
                />
            )}

            {tab === "tasks" && (
                <TasksTab
                    t={t}
                    project={project}
                    tasks={tasks}
                    onOpenTask={(taskId) => setTaskModal({ open: true, taskId })}
                    onCreateTask={async (payload) => {
                        try {
                            await request(`/api/projects/${projectId}/tasks`, { token, method: "POST", body: payload });
                            show("✅ Created", { severity: "success" });
                            await loadAll();
                        } catch (e) {
                            show(`❌ ${e.status ? `${e.status} ` : ""}${e.message}`, { severity: "error" });
                        }
                    }}
                />
            )}


            {tab === "members" && project && (
                <MembersTab
                    t={t}
                    project={project}
                    members={members}
                    canManageMembers={manageMembers}
                    onChanged={loadAll}
                />
            )}

            {tab === "settings" && project && (
                <SettingsTab
                    t={t}
                    project={project}
                    canManage={manageProject}
                    onSave={updateProject}
                />
            )}

            <TaskModal
                t={t}
                open={taskModal.open}
                taskId={taskModal.taskId}
                project={project}
                members={members}
                canManageProject={manageProject}
                onClose={() => setTaskModal({ open: false, taskId: null })}
                onUpdated={loadAll}
            />
        </Box>
    );
}
