import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControlLabel,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { updateProject, deleteProject } from "../../api/projects";

export default function SettingsTab({ t, project, onChanged, onDeleted }) {
    const { token, me } = useAuth();
    const { show } = useToast();

    const isAdmin = !!me?.roles?.includes("ADMIN");

    const [name, setName] = useState(project?.name || "");
    const [archived, setArchived] = useState(!!project?.archived);
    const [saving, setSaving] = useState(false);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmKey, setConfirmKey] = useState("");

    useEffect(() => {
        setName(project?.name || "");
        setArchived(!!project?.archived);
    }, [project?.id]);

    const deleteDisabled = useMemo(() => {
        if (!isAdmin) return true;
        return confirmKey.trim().toUpperCase() !== (project?.key || "").toUpperCase();
    }, [confirmKey, isAdmin, project?.key]);

    async function onSave() {
        setSaving(true);
        try {
            await updateProject(project.id, { name, archived }, token);
            show("✅ Saved", { severity: "success" });
            onChanged?.();
        } catch (e) {
            show(`❌ ${e.status ? `${e.status} ` : ""}${e.message}`, { severity: "error" });
        } finally {
            setSaving(false);
        }
    }

    async function onDelete() {
        setSaving(true);
        try {
            await deleteProject(project.id, token);
            show("✅ Project deleted", { severity: "success" });
            setConfirmOpen(false);
            onDeleted?.(); // navigate away
        } catch (e) {
            show(`❌ ${e.status ? `${e.status} ` : ""}${e.message}`, { severity: "error" });
        } finally {
            setSaving(false);
        }
    }

    return (
        <Stack spacing={2}>
            <Card>
                <CardHeader title={t?.("settings") || "Settings"} />
                <CardContent>
                    <Stack spacing={2}>
                        <TextField
                            label={t?.("projectName") || "Project name"}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            fullWidth
                        />

                        <FormControlLabel
                            control={<Checkbox checked={archived} onChange={(e) => setArchived(e.target.checked)} />}
                            label={t?.("archived") || "Archived"}
                        />

                        <Box>
                            <Button variant="contained" onClick={onSave} disabled={saving}>
                                {t?.("save") || "Save"}
                            </Button>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>

            <Card>
                <CardHeader title="Danger zone" />
                <CardContent>
                    {!isAdmin ? (
                        <Alert severity="info">
                            Only <b>ADMIN</b> can delete projects.
                        </Alert>
                    ) : (
                        <>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                Deleting a project removes its tasks, members, assignees and comments.
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            <Button color="error" variant="contained" onClick={() => setConfirmOpen(true)}>
                                Delete project
                            </Button>

                            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
                                <DialogTitle>Delete project</DialogTitle>
                                <DialogContent>
                                    <Stack spacing={2} sx={{ mt: 1 }}>
                                        <Alert severity="warning">
                                            This action is <b>irreversible</b>.
                                        </Alert>

                                        <Typography variant="body2">
                                            Type <b>{project?.key}</b> to confirm.
                                        </Typography>

                                        <TextField
                                            value={confirmKey}
                                            onChange={(e) => setConfirmKey(e.target.value)}
                                            placeholder={project?.key}
                                            fullWidth
                                        />
                                    </Stack>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={() => setConfirmOpen(false)} disabled={saving}>
                                        {t?.("cancel") || "Cancel"}
                                    </Button>
                                    <Button
                                        color="error"
                                        variant="contained"
                                        onClick={onDelete}
                                        disabled={saving || deleteDisabled}
                                    >
                                        Delete
                                    </Button>
                                </DialogActions>
                            </Dialog>
                        </>
                    )}
                </CardContent>
            </Card>
        </Stack>
    );
}
