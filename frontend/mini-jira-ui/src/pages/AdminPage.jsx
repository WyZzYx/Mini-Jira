import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Chip,
    Divider,
    MenuItem,
    Paper,
    Select,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography,
} from "@mui/material";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { request } from "../api/client";
import Pager from "../components/Pager";

const GLOBAL_ROLES = ["USER", "MANAGER", "ADMIN"];

export default function AdminPage({ t }) {
    const { token, me } = useAuth();
    const { show } = useToast();

    const [tab, setTab] = useState("users"); // users | departments
    const isAdmin = me?.roles?.includes("ADMIN");

    // Users state
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [usersRes, setUsersRes] = useState({ items: [], total: 0, page: 1, pageSize: 20 });
    const [busyUsers, setBusyUsers] = useState(false);

    // Departments state
    const [deps, setDeps] = useState([]);
    const [busyDeps, setBusyDeps] = useState(false);

    const pages = Math.max(1, Math.ceil((usersRes.total || 0) / (usersRes.pageSize || pageSize)));

    async function loadDeps() {
        setBusyDeps(true);
        try {
            const list = await request("/api/admin/departments", { token });
            setDeps(list || []);
        } catch (e) {
            show(`❌ ${e.status ? `${e.status} ` : ""}${e.message}`, { severity: "error" });
        } finally {
            setBusyDeps(false);
        }
    }

    async function loadUsers() {
        setBusyUsers(true);
        try {
            const res = await request(
                `/api/admin/users?page=${page}&pageSize=${pageSize}&query=${encodeURIComponent(q || "")}`,
                { token }
            );
            // backend returns PagedResponse<T> with Items/page/pageSize/total
            setUsersRes({
                items: res.items || res.Items || [],
                total: res.total ?? res.Total ?? 0,
                page: res.page ?? res.Page ?? page,
                pageSize: res.pageSize ?? res.PageSize ?? pageSize,
            });
        } catch (e) {
            show(`❌ ${e.status ? `${e.status} ` : ""}${e.message}`, { severity: "error" });
        } finally {
            setBusyUsers(false);
        }
    }

    useEffect(() => {
        if (!token || !isAdmin) return;
        loadDeps();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, isAdmin]);

    useEffect(() => {
        if (!token || !isAdmin) return;
        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, isAdmin, page, pageSize]);

    function depOptions() {
        return deps.map((d) => ({ id: d.id || d.Id, name: d.name || d.Name }));
    }

    const depMap = useMemo(() => {
        const m = new Map();
        for (const d of depOptions()) m.set(d.id, d.name);
        return m;
    }, [deps]);

    async function updateUserDept(userId, departmentId) {
        try {
            await request(`/api/admin/users/${userId}/department`, {
                token,
                method: "PUT",
                body: { departmentId },
            });
            show("✅ Department updated", { severity: "success" });
            loadUsers();
        } catch (e) {
            show(`❌ ${e.status ? `${e.status} ` : ""}${e.message}`, { severity: "error" });
        }
    }

    async function updateUserRoles(userId, roles) {
        try {
            await request(`/api/admin/users/${userId}/roles`, {
                token,
                method: "PUT",
                body: { roles },
            });
            show("✅ Roles updated", { severity: "success" });
            loadUsers();
        } catch (e) {
            show(`❌ ${e.status ? `${e.status} ` : ""}${e.message}`, { severity: "error" });
        }
    }

    async function resetPassword(userId) {
        const newPassword = prompt("New password (min 4 chars):");
        if (!newPassword) return;
        try {
            await request(`/api/admin/users/${userId}/reset-password`, {
                token,
                method: "POST",
                body: { newPassword },
            });
            show("✅ Password reset", { severity: "success" });
        } catch (e) {
            show(`❌ ${e.status ? `${e.status} ` : ""}${e.message}`, { severity: "error" });
        }
    }

    if (!isAdmin) {
        return (
            <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(255,255,255,0.10)" }}>
                {t?.("cannot") || "You don't have permission for this action."}
            </Paper>
        );
    }

    return (
        <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="h6" fontWeight={900}>
                    Admin
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={busyUsers || busyDeps ? "Loading…" : "Ready"} />
                </Stack>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
                <Tab value="users" label="Users" />
                <Tab value="departments" label="Departments" />
            </Tabs>

            {tab === "users" && (
                <Stack spacing={2}>
                    <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(255,255,255,0.10)" }}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center">
                            <TextField
                                fullWidth
                                label="Search"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        setPage(1);
                                        loadUsers();
                                    }
                                }}
                            />
                            <Select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setPage(1);
                                }}
                                sx={{ minWidth: 140 }}
                            >
                                {[10, 20, 50, 100].map((n) => (
                                    <MenuItem key={n} value={n}>
                                        {n}/page
                                    </MenuItem>
                                ))}
                            </Select>
                            <Button
                                variant="contained"
                                onClick={() => {
                                    setPage(1);
                                    loadUsers();
                                }}
                            >
                                Search
                            </Button>
                        </Stack>

                        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
                            <Pager page={page} pages={pages} onChange={setPage} />
                        </Stack>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(255,255,255,0.10)" }}>
                        <Stack spacing={1.25}>
                            {(usersRes.items || []).map((u) => {
                                const roles = u.roles || u.Roles || [];
                                const depId = u.departmentId || u.DepartmentId || "";
                                const depName = depMap.get(depId) || u.departmentName || u.DepartmentName || "—";

                                return (
                                    <Paper
                                        key={u.id || u.Id}
                                        variant="outlined"
                                        sx={{ p: 1.5, borderColor: "rgba(255,255,255,0.10)" }}
                                    >
                                        <Stack
                                            direction={{ xs: "column", md: "row" }}
                                            spacing={1.5}
                                            alignItems={{ xs: "stretch", md: "center" }}
                                        >
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography fontWeight={800} noWrap>
                                                    {u.email || u.Email}
                                                </Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.75 }}>
                                                    {u.name || u.Name || "—"} • {depName}
                                                </Typography>

                                                <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                                                    {roles.length ? roles.map((r) => <Chip key={r} size="small" label={r} />) : <Chip size="small" label="No roles" />}
                                                </Stack>
                                            </Box>

                                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ minWidth: { md: 520 } }}>
                                                <Select
                                                    size="small"
                                                    value={depId || ""}
                                                    onChange={(e) => updateUserDept(u.id || u.Id, e.target.value)}
                                                    sx={{ minWidth: 200 }}
                                                >
                                                    {depOptions().map((d) => (
                                                        <MenuItem key={d.id} value={d.id}>
                                                            {d.name} ({d.id})
                                                        </MenuItem>
                                                    ))}
                                                </Select>

                                                <Select
                                                    size="small"
                                                    multiple
                                                    value={roles}
                                                    onChange={(e) => updateUserRoles(u.id || u.Id, e.target.value)}
                                                    renderValue={(selected) => selected.join(", ")}
                                                    sx={{ minWidth: 240 }}
                                                >
                                                    {GLOBAL_ROLES.map((r) => (
                                                        <MenuItem key={r} value={r}>
                                                            {r}
                                                        </MenuItem>
                                                    ))}
                                                </Select>

                                                <Button variant="outlined" onClick={() => resetPassword(u.id || u.Id)}>
                                                    Reset password
                                                </Button>
                                            </Stack>
                                        </Stack>
                                    </Paper>
                                );
                            })}

                            {(!usersRes.items || usersRes.items.length === 0) && (
                                <Typography sx={{ opacity: 0.7 }}>No users.</Typography>
                            )}
                        </Stack>

                        <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                Total: {usersRes.total || 0}
                            </Typography>
                            <Pager page={page} pages={pages} onChange={setPage} />
                        </Stack>
                    </Paper>
                </Stack>
            )}

            {tab === "departments" && (
                <Stack spacing={2}>
                    <Paper variant="outlined" sx={{ p: 2, borderColor: "rgba(255,255,255,0.10)" }}>
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                            <Typography fontWeight={900}>Departments</Typography>
                            <Button variant="outlined" onClick={loadDeps}>
                                Refresh
                            </Button>
                        </Stack>

                        <Divider sx={{ my: 2 }} />

                        <Stack spacing={1}>
                            {depOptions().map((d) => (
                                <Paper key={d.id} variant="outlined" sx={{ p: 1.25, borderColor: "rgba(255,255,255,0.10)" }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography fontWeight={800}>
                                            {d.name} <Typography component="span" sx={{ opacity: 0.7 }}>({d.id})</Typography>
                                        </Typography>
                                    </Stack>
                                </Paper>
                            ))}
                            {depOptions().length === 0 && <Typography sx={{ opacity: 0.7 }}>No departments.</Typography>}
                        </Stack>
                    </Paper>
                </Stack>
            )}
        </Box>
    );
}
