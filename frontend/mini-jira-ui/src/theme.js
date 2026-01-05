import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
    palette: {
        mode: "dark",
        background: {
            default: "#0b0f14",
            paper: "rgba(255,255,255,0.04)",
        },
        primary: { main: "#6366f1" },
    },
    shape: { borderRadius: 14 },
    typography: {
        fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    },
});
