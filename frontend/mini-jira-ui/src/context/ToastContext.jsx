import React, { createContext, useContext, useMemo, useState } from "react";
import Toast from "../components/Toast";

const ToastCtx = createContext(null);

function inferSeverity(message) {
    const s = String(message || "");
    if (s.startsWith("✅")) return "success";
    if (s.startsWith("❌")) return "error";
    if (s.startsWith("⚠️")) return "warning";
    return "info";
}

export function ToastProvider({ children }) {
    const [state, setState] = useState({
        open: false,
        message: "",
        severity: "info",
        autoHideDuration: 2600,
    });

    function show(input, opts = {}) {
        let message = input;
        let severity = opts.severity;
        let autoHideDuration = opts.autoHideDuration;

        if (typeof input === "object" && input !== null) {
            message = input.message ?? "";
            severity = input.severity ?? severity;
            autoHideDuration = input.autoHideDuration ?? autoHideDuration;
        }

        const finalMessage = String(message ?? "");
        const finalSeverity = severity || inferSeverity(finalMessage);

        setState({
            open: true,
            message: finalMessage,
            severity: finalSeverity,
            autoHideDuration: autoHideDuration ?? 2600,
        });
    }

    function close() {
        setState((s) => ({ ...s, open: false }));
    }

    const value = useMemo(() => ({ show }), []);

    return (
        <ToastCtx.Provider value={value}>
            {children}
            <Toast
                open={state.open}
                message={state.message}
                severity={state.severity}
                autoHideDuration={state.autoHideDuration}
                onClose={close}
            />
        </ToastCtx.Provider>
    );
}

export function useToast() {
    const v = useContext(ToastCtx);
    if (!v) throw new Error("useToast must be used within ToastProvider");
    return v;
}
