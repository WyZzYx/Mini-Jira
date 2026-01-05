import React from "react";
import { Box, Pagination } from "@mui/material";

export default function Pager({ page, pages, onPage, size = "small" }) {
    const safePages = Math.max(1, Number(pages) || 1);
    const safePage = Math.min(Math.max(1, Number(page) || 1), safePages);

    return (
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Pagination
                size={size}
                count={safePages}
                page={safePage}
                onChange={(_, value) => onPage?.(value)}
                showFirstButton
                showLastButton
            />
        </Box>
    );
}
