import React from "react";
import { Alert, Snackbar } from "@mui/material";

export default function Toast({ open, message, severity = "info", onClose, autoHideDuration = 2600 }) {
    return (
        <Snackbar
            open={open}
            autoHideDuration={autoHideDuration}
            onClose={onClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
            <Alert
                onClose={onClose}
                severity={severity}
                variant="filled"
                sx={{ borderRadius: 2 }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
}
