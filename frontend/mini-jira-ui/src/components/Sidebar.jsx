import React from "react";
import {
    Box,
    Button,
    Divider,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";

import TranslateIcon from "@mui/icons-material/Translate";
import LogoutIcon from "@mui/icons-material/Logout";

const DRAWER_WIDTH = 280;

export default function Sidebar({
                                    open = true,
                                    variant = "permanent", // "permanent" | "temporary"
                                    onClose,

                                    brand = "MiniJira",
                                    subtitle,
                                    items = [],
                                    activeKey,
                                    onNavigate,

                                    lang,
                                    setLang,
                                    onLogout,
                                }) {
    const content = (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ px: 2, py: 2 }}>
                <Typography variant="h6" fontWeight={800} lineHeight={1.1}>
                    {brand}
                </Typography>
                {subtitle ? (
                    <Typography variant="caption" sx={{ opacity: 0.75 }}>
                        {subtitle}
                    </Typography>
                ) : null}
            </Box>

            <Divider sx={{ opacity: 0.12 }} />

            <List sx={{ px: 1, py: 1 }}>
                {items
                    .filter((x) => !x.hidden)
                    .map((item) => (
                        <ListItemButton
                            key={item.key}
                            selected={activeKey === item.key}
                            onClick={() => onNavigate?.(item.key)}
                            disabled={item.disabled}
                            sx={{ borderRadius: 2, mx: 0.5, my: 0.4 }}
                        >
                            {item.icon ? <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon> : null}
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
                {setLang ? (
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
                ) : null}

                {onLogout ? (
                    <Tooltip title="Logout">
                        <Button
                            variant="outlined"
                            startIcon={<LogoutIcon />}
                            onClick={onLogout}
                            sx={{ textTransform: "none", borderRadius: 2, ml: "auto" }}
                        >
                            Logout
                        </Button>
                    </Tooltip>
                ) : null}
            </Stack>
        </Box>
    );

    return (
        <Drawer
            open={open}
            variant={variant}
            onClose={onClose}
            sx={{
                "& .MuiDrawer-paper": {
                    width: DRAWER_WIDTH,
                    boxSizing: "border-box",
                    borderRight: "1px solid rgba(255,255,255,0.08)",
                },
            }}
        >
            {content}
        </Drawer>
    );
}
