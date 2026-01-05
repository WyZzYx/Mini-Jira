import React, { useMemo } from "react";
import {
    Box,
    Card,
    CardActionArea,
    CardContent,
    Chip,
    Paper,
    Stack,
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

export default function BoardTab({ t, tasks, onOpenTask }) {
    const columns = useMemo(() => {
        const col = {
            TODO: [],
            IN_PROGRESS: [],
            REVIEW: [],
            DONE: [],
        };

        for (const task of tasks || []) {
            const sKey = toKey(task.status, STATUS_KEYS);
            if (col[sKey]) col[sKey].push(task);
        }

        for (const k of Object.keys(col)) {
            col[k].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        return col;
    }, [tasks]);

    const colOrder = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
                gap: 2,
            }}
        >
            {colOrder.map((k) => {
                const items = columns[k] || [];
                return (
                    <Paper
                        key={k}
                        variant="outlined"
                        sx={{
                            p: 2,
                            borderRadius: 3,
                            minHeight: 360,
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.5,
                        }}
                    >
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Typography fontWeight={900}>
                                {t?.(k) || humanize(k)}
                            </Typography>
                            <Chip size="small" label={items.length} />
                        </Stack>

                        <Box sx={{ display: "grid", gap: 1.25 }}>
                            {items.map((task) => {
                                const pKey = toKey(task.priority, PRIORITY_KEYS);
                                const sKey = toKey(task.status, STATUS_KEYS);

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

                                                    {!!task.description && (
                                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                            {task.description}
                                                        </Typography>
                                                    )}
                                                </Stack>
                                            </CardContent>
                                        </CardActionArea>
                                    </Card>
                                );
                            })}

                            {items.length === 0 && (
                                <Typography variant="body2" color="text.secondary">
                                    {t?.("No tasks") || "No tasks."}
                                </Typography>
                            )}
                        </Box>
                    </Paper>
                );
            })}
        </Box>
    );
}
