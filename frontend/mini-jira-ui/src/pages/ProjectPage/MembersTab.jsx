import React, { useMemo, useState } from "react";
import {
    Box,
    Button,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";

import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { request } from "../../api/client";

const ROLE_OPTIONS = [
    { value: 0, label: "Member" },
    { value: 1, label: "Owner" },
];

function humanizeGlobalRole(r) {
    return String(r || "")
        .replaceAll("_", " ")
        .toUpperCase();
}

function toRoleValue(projectRole) {
    if (projectRole === null || projectRole === undefined) return "";
    if (typeof projectRole === "number") return projectRole;

    const s = String(projectRole).toUpperCase().trim();
    if (s === "MEMBER") return 0;
    if (s === "OWNER") return 1;

    return projectRole;
}

function roleLabelFromValue(v) {
    if (typeof v === "number") {
        const found = ROLE_OPTIONS.find((x) => x.value === v);
        return found ? found.label : `Role ${v}`;
    }
    if (typeof v === "string") return v;
    return "—";
}

export default function MembersTab({ t, project, members, canManageMembers, onChanged }) {
    const { token, me } = useAuth();
    const { show } = useToast();

    const [busy, setBusy] = useState(false);
    const [email, setEmail] = useState("");
    const [newRole, setNewRole] = useState(0);

    const projectId = project?.id;

    const extraRoleValues = useMemo(() => {
        const set = new Set();
        for (const m of members || []) {
            const v = toRoleValue(m.projectRole);
            if (v !== "" && !ROLE_OPTIONS.some((x) => x.value === v)) set.add(v);
        }
        return Array.from(set);
    }, [members]);

    async function addMember() {
        const e = email.trim();
        if (!e) return;

        setBusy(true);
        try {
            await request(`/api/projects/${projectId}/members`, {
                token,
                method: "POST",
                body: { email: e, projectRole: Number(newRole) },
            });
            show("✅ Member added", { severity: "success" });
            setEmail("");
            setNewRole(0);
            onChanged?.();
        } catch (err) {
            show(`❌ ${err.status ? `${err.status} ` : ""}${err.message}`, { severity: "error" });
        } finally {
            setBusy(false);
        }
    }

    async function updateRole(userId, value) {
        if (me?.id && userId === me.id) {
            show("⚠️ You can’t change your own role.", { severity: "warning" });
            return;
        }

        let roleEnum = value;
        if (typeof roleEnum === "string") {
            const s = roleEnum.toUpperCase().trim();
            roleEnum = s === "OWNER" ? 1 : 0;
        }
        roleEnum = Number(roleEnum);

        setBusy(true);
        try {
            await request(`/api/projects/${projectId}/members/${userId}`, {
                token,
                method: "PUT",
                body: { projectRole: roleEnum }, // IMPORTANT: camelCase matches ASP.NET default
            });
            show("✅ Role updated", { severity: "success" });
            onChanged?.();
        } catch (err) {
            show(`❌ ${err.status ? `${err.status} ` : ""}${err.message}`, { severity: "error" });
        } finally {
            setBusy(false);
        }
    }

    async function removeMember(userId) {
        if (me?.id && userId === me.id) {
            show("⚠️ You can’t remove yourself.", { severity: "warning" });
            return;
        }

        if (!confirm("Remove this member from project?")) return;

        setBusy(true);
        try {
            await request(`/api/projects/${projectId}/members/${userId}`, {
                token,
                method: "DELETE",
            });
            show("✅ Removed", { severity: "success" });
            onChanged?.();
        } catch (err) {
            show(`❌ ${err.status ? `${err.status} ` : ""}${err.message}`, { severity: "error" });
        } finally {
            setBusy(false);
        }
    }

    return (
        <Stack spacing={2}>
            {canManageMembers && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>
                        {t?.("addMember") || "Add member"}
                    </Typography>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="stretch">
                        <TextField
                            label={t?.("email") || "Email"}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={busy}
                            fullWidth
                        />

                        <FormControl sx={{ minWidth: 220 }} disabled={busy}>
                            <InputLabel>{t?.("projectRole") || "Project role"}</InputLabel>
                            <Select
                                label={t?.("projectRole") || "Project role"}
                                value={newRole}
                                onChange={(e) => setNewRole(Number(e.target.value))}
                            >
                                {ROLE_OPTIONS.map((r) => (
                                    <MenuItem key={r.value} value={r.value}>
                                        {r.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Button
                            variant="contained"
                            startIcon={<PersonAddAlt1Icon />}
                            onClick={addMember}
                            disabled={busy || !email.trim()}
                            sx={{ whiteSpace: "nowrap" }}
                        >
                            {t?.("add") || "Add"}
                        </Button>
                    </Stack>
                </Paper>
            )}

            <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><b>{t?.("Name") || "Name"}</b></TableCell>
                            <TableCell><b>{t?.("Email") || "Email"}</b></TableCell>
                            <TableCell><b>{t?.("Department") || "Department"}</b></TableCell>
                            <TableCell><b>{t?.("Global Roles") || "Global roles"}</b></TableCell>
                            <TableCell><b>{t?.("Project Role") || "Project role"}</b></TableCell>
                            <TableCell align="right"><b>{t?.("Actions") || "Actions"}</b></TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {(members || []).map((m) => {
                            const roleValue = toRoleValue(m.projectRole);
                            const isSelf = me?.id && m.userId === me.id;

                            return (
                                <TableRow key={m.userId} hover>
                                    <TableCell>{m.name || "—"}</TableCell>
                                    <TableCell>{m.email}</TableCell>
                                    <TableCell>{m.departmentName || m.departmentId || "—"}</TableCell>
                                    <TableCell>{(m.globalRoles || []).map(humanizeGlobalRole).join(", ") || "—"}</TableCell>

                                    <TableCell sx={{ minWidth: 260 }}>
                                        <FormControl fullWidth size="small" disabled={!canManageMembers || busy || isSelf}>
                                            <Select
                                                value={roleValue}
                                                onChange={(e) => updateRole(m.userId, e.target.value)}
                                                displayEmpty
                                                renderValue={(v) => roleLabelFromValue(v)}
                                            >
                                                {ROLE_OPTIONS.map((r) => (
                                                    <MenuItem key={r.value} value={r.value}>
                                                        {r.label}
                                                    </MenuItem>
                                                ))}

                                                {extraRoleValues.map((v) => (
                                                    <MenuItem key={String(v)} value={v}>
                                                        {roleLabelFromValue(v)}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        {isSelf && (
                                            <Typography variant="caption" sx={{ opacity: 0.65 }}>
                                                You can’t change your own role
                                            </Typography>
                                        )}
                                    </TableCell>

                                    <TableCell align="right">
                                        <Button
                                            color="error"
                                            variant="outlined"
                                            startIcon={<DeleteOutlineIcon />}
                                            onClick={() => removeMember(m.userId)}
                                            disabled={!canManageMembers || busy || isSelf}
                                        >
                                            {t?.("remove") || "Remove"}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}

                        {(members || []).length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6}>
                                    <Box sx={{ py: 3 }}>
                                        <Typography color="text.secondary">
                                            {t?.("No members.") || "No members."}
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Divider />
            </Paper>
        </Stack>
    );
}
