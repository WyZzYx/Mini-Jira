import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
    CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { request } from "../../api/client";

const STATUS_KEYS = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
const PRIORITY_KEYS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function toKey(value, keys) {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return keys[value] ?? String(value);
    return String(value);
}

function humanize(key) {
    if (!key) return "—";
    return String(key)
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDateInput(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function canEditTask(me, project, task, canManageProject) {
    if (!me || !project || !task) return false;
    if (canManageProject) return true;
    return task.createdByUserId && task.createdByUserId === me.id;
}

export default function TaskModal({
                                      t,
                                      open,
                                      taskId,
                                      project,
                                      members,
                                      canManageProject,
                                      onClose,
                                      onUpdated,
                                  }) {
    const { token, me } = useAuth();
    const { show } = useToast();

    const [busy, setBusy] = useState(false);
    const [task, setTask] = useState(null);
    const [draft, setDraft] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");

    const editable = useMemo(
        () => canEditTask(me, project, task, canManageProject),
        [me, project, task, canManageProject]
    );

    const assigneeIds = useMemo(
        () => new Set((draft?.assignees || []).map((a) => a.id)),
        [draft]
    );

    async function load() {
        if (!token || !taskId) return;
        setBusy(true);
        try {
            const fresh = await request(`/api/tasks/${taskId}`, { token });
            const comm = await request(`/api/tasks/${taskId}/comments`, { token });

            setTask(fresh);
            setDraft(fresh);
            setComments(comm || []);
            setCommentText("");
        } catch (e) {
            show(`❌ ${e.status ? `${e.status} ` : ""}${e.message}`, { severity: "error" });
        } finally {
            setBusy(false);
        }
    }

    useEffect(() => {
        if (open) load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, taskId, token]);

    async function save() {
        if (!draft) return;
        setBusy(true);
        try {
            await request(`/api/tasks/${draft.id}`, {
                token,
                method: "PUT",
                body: {
                    title: draft.title,
                    description: draft.description || null,
                    status: draft.status,     // numeric enum -> backend accepts -> no 400
                    priority: draft.priority, // numeric enum -> backend accepts -> no 400
                    dueDate: draft.dueDate || null,
                },
            });
            show("✅ Saved", { severity: "success" });
            await load();
            onUpdated?.();
        } catch (e) {
            show(`❌ ${e.status ? `${e.status} ` : ""}${e.message}`, { severity: "error" });
        } finally {
            setBusy(false);
        }
    }

    async function del() {
        if (!draft) return;
        if (!confirm("Delete this task?")) return;
        setBusy(true);
        try {
            await request(`/api/tasks/${draft.id}`, { token, method: "DELETE" });
            show("✅ Deleted", { severity: "success" });
            onClose?.();
            onUpdated?.();
        } catch (e) {
            show(`❌ ${e.status ? `${e.status} ` : ""}${e.message}`, { severity: "error" });
        } finally {
            setBusy(false);
        }
    }

    async function addComment() {
        const txt = commentText.trim();
        if (!txt) return;
        setBusy(true);
        try {
            await request(`/api/tasks/${taskId}/comments`, { token, method: "POST", body: { body: txt } });
            setCommentText("");
            const comm = await request(`/api/tasks/${taskId}/comments`, { token });
            setComments(comm || []);
            show("✅ Comment added", { severity: "success" });
            onUpdated?.();
        } catch (e) {
            show(`❌ ${e.status ? `${e.status} ` : ""}${e.message}`, { severity: "error" });
        } finally {
            setBusy(false);
        }
    }

    async function assign(userId) {
        setBusy(true);
        try {
            await request(`/api/tasks/${taskId}/assignees/${userId}`, { token, method: "POST" });
            await load();
            onUpdated?.();
            show("✅ Assigned", { severity: "success" });
        } catch (e) {
            show(`❌ ${e.status ? `${e.status} ` : ""}${e.message}`, { severity: "error" });
        } finally {
            setBusy(false);
        }
    }

    async function unassign(userId) {
        setBusy(true);
        try {
            await request(`/api/tasks/${taskId}/assignees/${userId}`, { token, method: "DELETE" });
            await load();
            onUpdated?.();
            show("✅ Unassigned", { severity: "success" });
        } catch (e) {
            show(`❌ ${e.status ? `${e.status} ` : ""}${e.message}`, { severity: "error" });
        } finally {
            setBusy(false);
        }
    }

    const sKey = toKey(draft?.status, STATUS_KEYS);
    const pKey = toKey(draft?.priority, PRIORITY_KEYS);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            BackdropProps={{ sx: { backgroundColor: "rgba(0,0,0,0.75)" } }}
            sx={{
                "& .MuiDialog-paper": {
                    backgroundColor: "#0B1220 !important",
                    backgroundImage: "none !important",
                    opacity: "1 !important",
                    borderRadius: 2,
                    border: "1px solid rgba(255,255,255,0.10)",
                },
            }}
        >
            <DialogTitle sx={{ pr: 6, backgroundColor: "#0B1220" }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" fontWeight={900} noWrap>
                            {draft?.title || t?.("loading") || "Loading…"}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                            <Chip size="small" label={humanize(pKey)} />
                            <Chip size="small" label={humanize(sKey)} />
                            {draft?.dueDate ? (
                                <Chip size="small" label={`Due ${formatDateInput(draft.dueDate)}`} />
                            ) : (
                                <Chip size="small" label="No due date" />
                            )}
                        </Stack>
                    </Box>

                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Stack>
            </DialogTitle>

            <DialogContent dividers sx={{ backgroundColor: "#0B1220" }}>
                {!draft ? (
                    <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <CircularProgress size={22} />
                            <Typography sx={{ opacity: 0.8 }}>{t?.("loading") || "Loading…"} </Typography>
                        </Stack>
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {/* Form */}
                        <Stack spacing={1.5}>
                            <TextField
                                label={t?.("title") || "Title"}
                                value={draft.title || ""}
                                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                                disabled={!editable || busy}
                                fullWidth
                            />

                            <TextField
                                label={t?.("description") || "Description"}
                                value={draft.description || ""}
                                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                                disabled={!editable || busy}
                                fullWidth
                                multiline
                                minRows={3}
                            />

                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                        {t?.("status") || "Status"}
                                    </Typography>
                                    <Select
                                        fullWidth
                                        value={draft.status}
                                        disabled={!editable || busy}
                                        onChange={(e) => setDraft((d) => ({ ...d, status: Number(e.target.value) }))}
                                    >
                                        {STATUS_KEYS.map((k, idx) => (
                                            <MenuItem key={k} value={idx}>
                                                {humanize(k)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </Box>

                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                        {t?.("priority") || "Priority"}
                                    </Typography>
                                    <Select
                                        fullWidth
                                        value={draft.priority}
                                        disabled={!editable || busy}
                                        onChange={(e) => setDraft((d) => ({ ...d, priority: Number(e.target.value) }))}
                                    >
                                        {PRIORITY_KEYS.slice(0, 3).map((k, idx) => (
                                            <MenuItem key={k} value={idx}>
                                                {humanize(k)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </Box>

                                <TextField
                                    sx={{ flex: 1 }}
                                    label={t?.("dueDate") || "Due date"}
                                    type="date"
                                    value={formatDateInput(draft.dueDate)}
                                    disabled={!editable || busy}
                                    onChange={(e) =>
                                        setDraft((d) => ({
                                            ...d,
                                            dueDate: e.target.value ? new Date(`${e.target.value}T00:00:00Z`).toISOString() : null,
                                        }))
                                    }
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Stack>
                        </Stack>

                        <Divider sx={{ borderColor: "rgba(255,255,255,0.10)" }} />

                        {/* Assignees */}
                        <Box>
                            <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 1 }}>
                                {t?.("assignees") || "Assignees"}
                            </Typography>

                            <Stack spacing={1}>
                                {(members || []).map((m) => {
                                    const assigned = assigneeIds.has(m.userId);
                                    const canChange = (editable || canManageProject) && !busy;

                                    return (
                                        <Stack
                                            key={m.userId}
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                            justifyContent="space-between"
                                            sx={{
                                                p: 1.25,
                                                borderRadius: 2,
                                                border: "1px solid rgba(255,255,255,0.10)",
                                                backgroundColor: "rgba(255,255,255,0.04)",
                                            }}
                                        >
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography fontWeight={800} noWrap>
                                                    {m.name || m.email}
                                                </Typography>
                                                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                                    {m.projectRole}
                                                </Typography>
                                            </Box>

                                            {assigned ? (
                                                <Button variant="outlined" size="small" disabled={!canChange} onClick={() => unassign(m.userId)}>
                                                    Unassign
                                                </Button>
                                            ) : (
                                                <Button variant="contained" size="small" disabled={!canChange} onClick={() => assign(m.userId)}>
                                                    Assign
                                                </Button>
                                            )}
                                        </Stack>
                                    );
                                })}
                            </Stack>
                        </Box>

                        <Divider sx={{ borderColor: "rgba(255,255,255,0.10)" }} />

                        {/* Comments */}
                        <Box>
                            <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 1 }}>
                                {t?.("comments") || "Comments"}
                            </Typography>

                            <Stack spacing={1}>
                                {(comments || []).map((c) => (
                                    <Box
                                        key={c.id}
                                        sx={{
                                            p: 1.25,
                                            borderRadius: 2,
                                            border: "1px solid rgba(255,255,255,0.10)",
                                            backgroundColor: "rgba(255,255,255,0.04)",
                                        }}
                                    >
                                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                            {c.authorEmail || "Unknown"} • {new Date(c.createdAt).toLocaleString()}
                                        </Typography>
                                        <Typography sx={{ mt: 0.5 }}>{c.body}</Typography>
                                    </Box>
                                ))}

                                {(!comments || comments.length === 0) && (
                                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                        No comments yet.
                                    </Typography>
                                )}
                            </Stack>

                            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                                <TextField
                                    fullWidth
                                    placeholder="Write a comment…"
                                    value={commentText}
                                    disabled={busy}
                                    onChange={(e) => setCommentText(e.target.value)}
                                />
                                <Button variant="contained" disabled={busy || !commentText.trim()} onClick={addComment}>
                                    {t?.("addComment") || "Add"}
                                </Button>
                            </Stack>
                        </Box>

                        {!editable && (
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                {t?.("cannot") || "You don't have permission for this action."}
                            </Typography>
                        )}
                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{ backgroundColor: "#0B1220" }}>
                <Button color="error" startIcon={<DeleteOutlineIcon />} disabled={!editable || busy} onClick={del}>
                    Delete
                </Button>

                <Box sx={{ flex: 1 }} />

                <Button onClick={onClose} disabled={busy}>
                    {t?.("cancel") || "Cancel"}
                </Button>
                <Button variant="contained" onClick={save} disabled={!editable || busy}>
                    {t?.("save") || "Save"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
