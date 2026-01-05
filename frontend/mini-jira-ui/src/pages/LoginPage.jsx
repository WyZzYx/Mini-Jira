import React, { useState } from "react";
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
} from "@mui/material";
import TranslateIcon from "@mui/icons-material/Translate";
import LoginIcon from "@mui/icons-material/Login";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function LoginPage({ t, lang, setLang, onGoRegister }) {
    const { login } = useAuth();
    const { show } = useToast();

    const [email, setEmail] = useState("user@demo.com");
    const [password, setPassword] = useState("Demo123!");
    const [busy, setBusy] = useState(false);

    async function submit(e) {
        e?.preventDefault?.();

        setBusy(true);
        try {
            await login(email, password);
            show("✅ Logged in");
        } catch (err) {
            show(`❌ ${err?.status ? `${err.status} ` : ""}${err?.message || "Login failed"}`);
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
                        <Box>
                            <Typography variant="h5" fontWeight={900}>
                                {t("login")}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.75 }}>
                                {t("app")}
                            </Typography>
                        </Box>

                        <Button
                            variant="outlined"
                            startIcon={<TranslateIcon />}
                            onClick={() => setLang(lang === "en" ? "pl" : "en")}
                            sx={{ textTransform: "none", borderRadius: 2 }}
                        >
                            {String(lang || "en").toUpperCase()}
                        </Button>
                    </Stack>

                    <Box component="form" onSubmit={submit}>
                        <Stack spacing={1.5}>
                            <TextField
                                label={t("email")}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                fullWidth
                            />

                            <TextField
                                label={t("password")}
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                fullWidth
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                disabled={busy}
                                startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <LoginIcon />}
                                sx={{ borderRadius: 2, py: 1.1, fontWeight: 800 }}
                            >
                                {busy ? t("loading") : t("signIn")}
                            </Button>

                            <Stack direction="row" justifyContent="center">
                                <Button
                                    variant="text"
                                    onClick={onGoRegister}
                                    sx={{ textTransform: "none" }}
                                >
                                    Create account
                                </Button>
                            </Stack>

                            <Divider sx={{ opacity: 0.12, my: 1 }} />

                            <Typography variant="subtitle2" fontWeight={800}>
                                {t("demoAccounts")}
                            </Typography>

                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Button variant="outlined" onClick={() => setEmail("user@demo.com")} sx={{ borderRadius: 2 }}>
                                    {t("user")}
                                </Button>
                                <Button variant="outlined" onClick={() => setEmail("manager@demo.com")} sx={{ borderRadius: 2 }}>
                                    {t("manager")}
                                </Button>
                                <Button variant="outlined" onClick={() => setEmail("admin@demo.com")} sx={{ borderRadius: 2 }}>
                                    {t("admin")}
                                </Button>
                                <Button variant="outlined" onClick={() => setPassword("Demo123!")} sx={{ borderRadius: 2 }}>
                                    Demo123!
                                </Button>
                            </Stack>
                        </Stack>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}
