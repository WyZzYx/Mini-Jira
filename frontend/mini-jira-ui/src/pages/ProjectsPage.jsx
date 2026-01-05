import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Grid,
    IconButton,
    MenuItem,
    Select,
    Stack,
    Switch,
    TextField,
    Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";

import Pager from "../components/Pager";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { request } from "../api/client";

function normalizePaged(res) {
    return {
        page: res?.page ?? 1,
        pageSize: res?.pageSize ?? 8,
        total: res?.total ?? 0,
        items: res?.items ?? [],
    };
}

export default function ProjectsPage({ t, onOpenProject }) {
    const { token, me } = useAuth();
    const { show } = useToast();

    const [query, setQuery] = useState("");
    const [includeArchived, setIncludeArchived] = useState(true);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);

    const [busy, setBusy] = useState(false);
    const [data, setData] = useState({ items: [], total: 0, page: 1, pageSize: 8 });

    const [createOpen, setCreateOpen] = useState(false);
    const [newKey, setNewKey] = useState("");
    const [newName, setNewName] = useState("");
    const [newDept, setNewDept] = useState(me?.departmentId || "");

    const pages = useMemo(() => {
        const total = Number(data.total) || 0;
        return Math.max(1, Math.ceil(total / pageSize));
    }, [data.total, pageSize]);

    async function load() {
        if (!token) return;
        setBusy(true);
        try {
            const qs = new URLSearchParams();
            if (query?.trim()) qs.set("query", query.trim());
            qs.set("page", String(page));
            qs.set("pageSize", String(pageSize));
            qs.set("includeArchived", includeArchived ? "true" : "false");

            const res = await request(`/api/projects?${qs.toString()}`, { token });
            setData(normalizePaged(res));
        } catch (e) {
            show(`❌ ${e?.status ? `${e.status} ` : ""}${e?.message || "Failed to load projects"}`);
        } finally {
            setBusy(false);
        }
    }

    async function createProject() {
        const key = newKey.trim().toUpperCase();
        const name = newName.trim();
        const departmentId = (newDept || "").trim() || null;

        if (key.length < 2) return show("❌ Key must be at least 2 characters.");
        if (name.length < 3) return show("❌ Name must be at least 3 characters.");

        setBusy(true);
        try {
            await request(`/api/projects`, {
                method: "POST",
                token,
                body: { key, name, departmentId },
            });

            show("✅ Project created");
            setCreateOpen(false);
            setNewKey("");
            setNewName("");

            setPage(1);
            await load();
        } catch (e) {
            show(`❌ ${e?.status ? `${e.status} ` : ""}${e?.message || "Failed to create project"}`);
        } finally {
            setBusy(false);
        }
    }

    useEffect(() => {
        setNewDept(me?.departmentId || "");
    }, [me?.departmentId]);

    useEffect(() => {
        load();
    }, [token, query, page, pageSize, includeArchived]);

    return (
        <Box>
            {/* Header row */}
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }} sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={900} sx={{ flex: 1 }}>
                    {t("projects")}
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton onClick={load} disabled={busy} title="Refresh">
                        <RefreshIcon />
                    </IconButton>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateOpen(true)}
                        sx={{ borderRadius: 2, fontWeight: 800 }}
                    >
                        {t("createProject")}
                    </Button>
                </Stack>
            </Stack>

            {/* Filters */}
            <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ md: "center" }}
                sx={{ mb: 2 }}
            >
                <TextField
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(1);
                    }}
                    label={t("search")}
                    placeholder={t("search")}
                    fullWidth
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={includeArchived}
                            onChange={(e) => {
                                setIncludeArchived(e.target.checked);
                                setPage(1);
                            }}
                        />
                    }
                    label={t("archived")}
                />

                <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                    <Typography variant="body2" sx={{ opacity: 0.75 }}>
                        Page size
                    </Typography>
                    <Select
                        size="small"
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setPage(1);
                        }}
                        sx={{ minWidth: 110, borderRadius: 2 }}
                    >
                        {[5, 8, 12, 20].map((n) => (
                            <MenuItem key={n} value={n}>
                                {n}
                            </MenuItem>
                        ))}
                    </Select>
                </Stack>
            </Stack>

            {/* Grid */}
            <Grid container spacing={2}>
                {data.items.map((p) => (
                    <Grid item xs={12} sm={6} lg={4} xl={3} key={p.id}>
                        <Card
                            sx={{
                                borderRadius: 3,
                                border: "1px solid rgba(255,255,255,0.10)",
                                background: "rgba(255,255,255,0.04)",
                            }}
                        >
                            <CardActionArea onClick={() => onOpenProject?.(p.id)}>
                                <CardContent>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                                        <Typography fontWeight={900}>{p.key}</Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.75 }}>
                                            {p.departmentName || p.departmentId || "—"}
                                        </Typography>
                                    </Stack>

                                    <Typography sx={{ mt: 1 }} fontWeight={800}>
                                        {p.name}
                                    </Typography>

                                    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} alignItems="center">
                                        {p.archived ? <Chip size="small" label={t("archived")} /> : <Chip size="small" label="Active" />}
                                        {p.myProjectRole ? <Chip size="small" label={`Role: ${p.myProjectRole}`} variant="outlined" /> : null}
                                    </Stack>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Pagination */}
            <Box sx={{ mt: 2 }}>
                <Pager page={page} pages={pages} onPage={setPage} />
            </Box>

            {/* Create dialog */}
            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 900 }}>{t("createProject")}</DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label={t("projectKey")}
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value.toUpperCase())}
                            placeholder="ACME"
                            inputProps={{ maxLength: 10 }}
                            fullWidth
                        />
                        <TextField
                            label={t("projectName")}
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="ACME Platform"
                            fullWidth
                        />
                        <TextField
                            label={t("department")}
                            value={newDept}
                            onChange={(e) => setNewDept(e.target.value)}
                            placeholder={me?.departmentId || "dep_eng"}
                            helperText="Optional. If empty, project can be created without department."
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button variant="outlined" onClick={() => setCreateOpen(false)} sx={{ borderRadius: 2 }}>
                        {t("cancel")}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={createProject}
                        disabled={busy}
                        sx={{ borderRadius: 2, fontWeight: 900 }}
                    >
                        {t("save")}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
