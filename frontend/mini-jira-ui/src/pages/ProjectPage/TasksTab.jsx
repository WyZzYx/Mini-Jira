import React, { useMemo, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Chip,
    Divider,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

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

function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

export default function TasksTab({ t, project, tasks, onCreateTask, onOpenTask }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState(1); // MEDIUM (numeric enum)
    const [dueDate, setDueDate] = useState("");  // yyyy-mm-dd

    const archived = !!project?.archived;

    const counts = useMemo(() => {
        const m = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 };
        for (const x of tasks || []) {
            const k = toKey(x.status, STATUS_KEYS);
            if (m[k] !== undefined) m[k] += 1;
        }
        return m;
    }, [tasks]);

    function submitCreate() {
        const cleanTitle = title.trim();
        if (cleanTitle.length < 3) return;

        onCreateTask?.({
            title: cleanTitle,
            description: description.trim() || null,
            priority, // numeric
            dueDate: dueDate ? new Date(`${dueDate}T00:00:00Z`).toISOString() : null,
        });

        setTitle("");
        setDescription("");
        setPriority(1);
        setDueDate("");
    }

    return (
        <Grid container spacing={2}>
            {/* Create */}
            <Grid item xs={12} md={5} lg={4}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                    <Stack spacing={1.5}>
                        <Typography variant="h6" fontWeight={900}>
                            {t?.("createTask") || "Create task"}
                        </Typography>

                        <TextField
                            label={t?.("title") || "Title"}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={archived}
                            fullWidth
                        />

                        <TextField
                            label={t?.("description") || "Description"}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={archived}
                            fullWidth
                            multiline
                            minRows={3}
                        />

                        <Grid container spacing={1.5}>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth disabled={archived}>
                                    <InputLabel>{t?.("priority") || "Priority"}</InputLabel>
                                    <Select
                                        label={t?.("priority") || "Priority"}
                                        value={priority}
                                        onChange={(e) => setPriority(Number(e.target.value))}
                                    >
                                        {PRIORITY_KEYS.slice(0, 3).map((k, idx) => (
                                            <MenuItem key={k} value={idx}>
                                                {humanize(k)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label={t?.("dueDate") || "Due date"}
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    disabled={archived}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </Grid>

                        <Button
                            variant="contained"
                            onClick={submitCreate}
                            disabled={archived || title.trim().length < 3}
                        >
                            {t?.("save") || "Save"}
                        </Button>

                        {archived && (
                            <Typography variant="caption" color="text.secondary">
                                {t?.("archived") || "Project is archived"}
                            </Typography>
                        )}
                    </Stack>
                </Paper>
            </Grid>

            {/* List */}
            <Grid item xs={12} md={7} lg={8}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                    <Stack spacing={1.5}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                            <Typography variant="h6" fontWeight={900}>
                                {t?.("tasks") || "Tasks"}
                            </Typography>

                            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                                {STATUS_KEYS.map((k) => (
                                    <Chip key={k} size="small" label={`${humanize(k)}: ${counts[k] || 0}`} />
                                ))}
                            </Stack>
                        </Stack>

                        <Divider />

                        <Box sx={{ display: "grid", gap: 1.25 }}>
                            {(tasks || []).map((task) => {
                                const sKey = toKey(task.status, STATUS_KEYS);
                                const pKey = toKey(task.priority, PRIORITY_KEYS);

                                return (
                                    <Card key={task.id} variant="outlined" sx={{ borderRadius: 2 }}>
                                        <CardActionArea onClick={() => onOpenTask?.(task.id)}>
                                            <CardContent>
                                                <Stack spacing={0.75}>
                                                    <Typography fontWeight={900}>{task.title}</Typography>

                                                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                                                        <Chip size="small" label={humanize(sKey)} />
                                                        <Chip size="small" variant="outlined" label={humanize(pKey)} />
                                                        <Chip
                                                            size="small"
                                                            variant="outlined"
                                                            label={task.dueDate ? `Due ${formatDate(task.dueDate)}` : "No due date"}
                                                        />
                                                        {!!task.assignees?.length && (
                                                            <Chip size="small" variant="outlined" label={`${task.assignees.length} assignee(s)`} />
                                                        )}
                                                    </Stack>

                                                    {task.description ? (
                                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                            {task.description}
                                                        </Typography>
                                                    ) : null}
                                                </Stack>
                                            </CardContent>
                                        </CardActionArea>
                                    </Card>
                                );
                            })}

                            {(tasks || []).length === 0 && (
                                <Typography variant="body2" color="text.secondary">
                                    {t?.("noTasks") || "No tasks yet."}
                                </Typography>
                            )}
                        </Box>
                    </Stack>
                </Paper>
            </Grid>
        </Grid>
    );
}
