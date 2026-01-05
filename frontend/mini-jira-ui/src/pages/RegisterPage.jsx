import React, { useMemo, useState } from "react";
import {
    Box,
    Button,
    Container,
    Divider,
    Paper,
    Stack,
    TextField,
    Typography,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TranslateIcon from "@mui/icons-material/Translate";

import { register as apiRegister } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";


export default function RegisterPage({ t, lang, setLang, onGoLogin }) {
    const { login } = useAuth();
    const { show } = useToast();

    const [busy, setBusy] = useState(false);

    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    const [departmentId, setDepartmentId] = useState("dep_eng");


    const DEPARTMENTS = [
        { id: "dep_eng", name: "Engineering" },
        { id: "dep_ops", name: "Operations" },
        { id: "dep_sales", name: "Sales" },
    ];


    const canSubmit = useMemo(() => {
        if (!email.trim()) return false;
        if (!password) return false;
        if (password.length < 4) return false;
        if (password !== confirm) return false;
        return true;
    }, [email, password, confirm]);

    async function submit(e) {
        e?.preventDefault?.();
        if (!canSubmit) return;

        setBusy(true);
        try {
            const body = {
                email: email.trim(),
                password,
                name: name.trim() || null,
                ...(departmentId ? { departmentId } : {}),
            };

            await apiRegister(body);

            await login(body.email, password);

            show("✅ Account created", { severity: "success" });
        } catch (err) {
            show(`❌ ${err?.status ? `${err.status} ` : ""}${err?.message || "Register failed"}`, {
                severity: "error",
            });
        } finally {
            setBusy(false);
        }
    }

    return (
        <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
            <Container maxWidth="sm">
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        borderRadius: 3,
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(255,255,255,0.04)",
                    }}
                >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Button
                                variant="text"
                                startIcon={<ArrowBackIcon />}
                                onClick={() => onGoLogin?.()}
                                sx={{ textTransform: "none" }}
                            >
                                Back
                            </Button>

                            <Box>
                                <Typography variant="h5" fontWeight={900}>
                                    Create account
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.75 }}>
                                    {t?.("app") || "MiniJira"}
                                </Typography>
                            </Box>
                        </Stack>

                        <Button
                            variant="outlined"
                            startIcon={<TranslateIcon />}
                            onClick={() => setLang?.(lang === "en" ? "pl" : "en")}
                            sx={{ textTransform: "none", borderRadius: 2 }}
                        >
                            {String(lang || "en").toUpperCase()}
                        </Button>
                    </Stack>

                    <Box component="form" onSubmit={submit}>
                        <Stack spacing={1.5}>
                            <TextField
                                label={t?.("email") || "Email"}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                fullWidth
                            />

                            <TextField
                                label={t?.("name") || "Name (optional)"}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="name"
                                fullWidth
                            />


                            <FormControl fullWidth>
                                <InputLabel>Department (optional)</InputLabel>
                                <Select
                                    label="Department"
                                    value={departmentId}
                                    onChange={(e) => setDepartmentId(e.target.value)}
                                >
                                    {DEPARTMENTS.map((d) => (
                                        <MenuItem key={d.id} value={d.id}>
                                            {d.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                label={t?.("password") || "Password"}
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                fullWidth
                            />

                            <TextField
                                label="Confirm password"
                                type="password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                autoComplete="new-password"
                                fullWidth
                                error={!!confirm && confirm !== password}
                                helperText={confirm && confirm !== password ? "Passwords do not match" : " "}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                disabled={busy || !canSubmit}
                                startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <PersonAddIcon />}
                                sx={{ borderRadius: 2, py: 1.1, fontWeight: 800 }}
                            >
                                {busy ? (t?.("loading") || "Loading…") : "Create account"}
                            </Button>

                            <Divider sx={{ opacity: 0.12, my: 1 }} />

                            <Stack direction="row" justifyContent="center">
                                <Button variant="text" onClick={() => onGoLogin?.()} sx={{ textTransform: "none" }}>
                                    Already have an account? Sign in
                                </Button>
                            </Stack>
                        </Stack>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}
