import React from "react";
import { Box, Typography } from "@mui/material";

export default function Topbar({ title, right }) {
    return (
        <Box
            sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
            }}
        >
            <Typography variant="h6" fontWeight={900}>
                {title}
            </Typography>
            {right ? <Box>{right}</Box> : null}
        </Box>
    );
}
