import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Paper,
    Typography,
    Divider,
    Stack,
    List,
    ListItemButton,
    ListItemText,
    Chip,
    CircularProgress,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableContainer,
} from "@mui/material";
import { request } from "../api/client";
import { useAuth } from "../context/AuthContext";

function formatYmd(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

export default function MyTasksPage({ t, onOpenProject, onOpenTask }) {
    const { token, me } = useAuth();

    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [busy, setBusy] = useState(false);

    async function loadProjects() {
        setBusy(true);
        try {
            const res = await request(
                `/api/projects?query=&page=1&pageSize=200&includeArchived=true`,
                { token }
            );
            setProjects(res?.items || []);
            if (!selectedProjectId && (res?.items || []).length > 0) {
                setSelectedProjectId(res.items[0].id);
            }
        } finally {
            setBusy(false);
        }
    }

    async function loadTasks(projectId) {
        if (!projectId) return;
        setBusy(true);
        try {
            const res = await request(`/api/projects/${projectId}/tasks?page=1&pageSize=200`, { token });
            setTasks(res?.items || []);
        } finally {
            setBusy(false);
        }
    }

    useEffect(() => {
        if (!token) return;
        loadProjects().catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    useEffect(() => {
        if (!token || !selectedProjectId) return;
        loadTasks(selectedProjectId).catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, selectedProjectId]);

    const myTasks = useMemo(() => {
        const myId = me?.id;
        if (!myId) return [];
        return (tasks || []).filter((task) =>
            (task.assignees || []).some((a) => a.id === myId)
        );
    }, [tasks, me?.id]);

    const selectedProject = useMemo(
        () => projects.find((p) => p.id === selectedProjectId) || null,
        [projects, selectedProjectId]
    );

    return (
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, width: { xs: "100%", md: 320 } }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography sx={{ fontWeight: 800 }}>{t("projects")}</Typography>
                    {busy && <CircularProgress size={18} />}
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <List dense sx={{ maxHeight: "65vh", overflow: "auto" }}>
                    {projects.map((p) => (
                        <ListItemButton
                            key={p.id}
                            selected={p.id === selectedProjectId}
                            onClick={() => setSelectedProjectId(p.id)}
                        >
                            <ListItemText
                                primary={
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Typography sx={{ fontWeight: 800 }}>{p.key}</Typography>
                                        {p.archived ? <Chip size="small" label={t("archived")} /> : null}
                                    </Box>
                                }
                                secondary={p.name}
                            />
                        </ListItemButton>
                    ))}

                    {projects.length === 0 && (
                        <Typography variant="body2" sx={{ opacity: 0.7, px: 1 }}>
                            No projects yet.
                        </Typography>
                    )}
                </List>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ display: "flex", gap: 1 }}>
                    <Chip size="small" label={`My tasks: ${myTasks.length}`} />
                    {selectedProject ? (
                        <Chip size="small" variant="outlined" label={selectedProject.key} />
                    ) : null}
                </Box>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {t("myTasks")}
                        {selectedProject ? ` — ${selectedProject.key}` : ""}
                    </Typography>

                    {selectedProject ? (
                        <Chip
                            clickable
                            label={`Open project`}
                            onClick={() => onOpenProject?.(selectedProject.id)}
                        />
                    ) : null}
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>{t("title")}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{t("status")}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{t("priority")}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{t("dueDate")}</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {myTasks.map((task) => (
                                <TableRow
                                    key={task.id}
                                    hover
                                    sx={{ cursor: "pointer" }}
                                    onClick={() => {
                                        if (!selectedProjectId) return;
                                        onOpenTask?.(selectedProjectId, task.id);
                                    }}
                                >
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 700 }}>{task.title}</Typography>
                                        {task.description ? (
                                            <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                                {task.description}
                                            </Typography>
                                        ) : null}
                                    </TableCell>

                                    <TableCell>
                                        <Chip size="small" label={task.status || "—"} />
                                    </TableCell>

                                    <TableCell>
                                        <Chip size="small" variant="outlined" label={task.priority || "—"} />
                                    </TableCell>

                                    <TableCell>{task.dueDate ? formatYmd(task.dueDate) : "—"}</TableCell>
                                </TableRow>
                            ))}

                            {myTasks.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4}>
                                        <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                            No assigned tasks in this project.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Stack>
    );
}
