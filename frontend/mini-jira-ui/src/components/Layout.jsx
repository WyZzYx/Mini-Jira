import React, { useMemo, useState } from "react";
import {
    AppBar,
    Box,
    Button,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Stack,
    Toolbar,
    Tooltip,
    Typography,
    useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import TranslateIcon from "@mui/icons-material/Translate";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

import { useAuth } from "../context/AuthContext";

const DRAWER_WIDTH = 280;

export default function Layout({
                                   t,
                                   lang,
                                   setLang,
                                   activeKey,
                                   onNavigate,
                                   navItems,
                                   topRight,
                                   children,
                               }) {
    const { me, logout } = useAuth();

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [mobileOpen, setMobileOpen] = useState(false);

    const defaultNavItems = useMemo(() => {
        const items = [
            { key: "projects", label: t("projects"), icon: <DashboardIcon /> },
            { key: "myTasks", label: t("myTasks"), icon: <AssignmentTurnedInIcon /> },
        ];

        if (me?.roles?.includes("ADMIN")) {
            items.push({ key: "admin", label: "Admin", icon: <AdminPanelSettingsIcon /> });
        }

        return items;
    }, [me, t]);

    const items = navItems || defaultNavItems;

    function handleNavigate(key) {
        if (!onNavigate) return;
        onNavigate(key);
        if (isMobile) setMobileOpen(false);
    }

    const drawerContent = (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ px: 2, py: 2 }}>
                <Typography variant="h6" fontWeight={800} lineHeight={1.1}>
                    {t("app")}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.75 }}>
                    {me?.email || ""}
                </Typography>
            </Box>

            <Divider sx={{ opacity: 0.12 }} />

            <List sx={{ px: 1, py: 1 }}>
                {items
                    .filter((x) => !x.hidden)
                    .map((item) => (
                        <ListItemButton
                            key={item.key}
                            selected={activeKey === item.key}
                            onClick={() => handleNavigate(item.key)}
                            disabled={item.disabled}
                            sx={{
                                borderRadius: 2,
                                mx: 0.5,
                                my: 0.4,
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                            <ListItemText
                                primary={item.label}
                                primaryTypographyProps={{ fontWeight: activeKey === item.key ? 800 : 600 }}
                            />
                        </ListItemButton>
                    ))}
            </List>

            <Box sx={{ flex: 1 }} />

            <Divider sx={{ opacity: 0.12 }} />

            <Stack direction="row" spacing={1} sx={{ p: 2 }}>
                <Tooltip title="Language">
                    <Button
                        variant="outlined"
                        startIcon={<TranslateIcon />}
                        onClick={() => setLang(lang === "en" ? "pl" : "en")}
                        sx={{ textTransform: "none", borderRadius: 2 }}
                    >
                        {String(lang || "en").toUpperCase()}
                    </Button>
                </Tooltip>

                <Tooltip title={t("logout")}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        startIcon={<LogoutIcon />}
                        onClick={logout}
                        sx={{ textTransform: "none", borderRadius: 2, ml: "auto" }}
                    >
                        {t("logout")}
                    </Button>
                </Tooltip>
            </Stack>
        </Box>
    );

    return (
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.02)",
                    backdropFilter: "blur(10px)",
                }}
            >
                <Toolbar sx={{ gap: 1 }}>
                    {isMobile && (
                        <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)}>
                            <MenuIcon />
                        </IconButton>
                    )}

                    {topRight ? <Box>{topRight}</Box> : null}
                </Toolbar>
            </AppBar>

            <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
                {isMobile ? (
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={() => setMobileOpen(false)}
                        ModalProps={{ keepMounted: true }}
                        sx={{
                            "& .MuiDrawer-paper": {
                                width: DRAWER_WIDTH,
                                boxSizing: "border-box",
                            },
                        }}
                    >
                        {drawerContent}
                    </Drawer>
                ) : (
                    <Drawer
                        variant="permanent"
                        open
                        sx={{
                            "& .MuiDrawer-paper": {
                                width: DRAWER_WIDTH,
                                boxSizing: "border-box",
                                borderRight: "1px solid rgba(255,255,255,0.08)",
                            },
                        }}
                    >
                        {drawerContent}
                    </Drawer>
                )}
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
                    p: 2,
                }}
            >
                <Toolbar />
                {children}
            </Box>
        </Box>
    );
}
