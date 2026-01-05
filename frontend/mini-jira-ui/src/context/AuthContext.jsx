import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { LS_TOKEN } from "../utils/constants";
import { login as apiLogin, register as apiRegister } from "../api/auth";
import { getMe } from "../api/me";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem(LS_TOKEN) || "");
    const [me, setMe] = useState(null);

    async function refreshMe(t = token) {
        if (!t) return null;
        const data = await getMe(t);
        setMe(data);
        return data;
    }

    async function applyToken(newToken) {
        localStorage.setItem(LS_TOKEN, newToken);
        setToken(newToken);
        await refreshMe(newToken); // avoid race
    }

    async function login(email, password) {
        const res = await apiLogin(email, password);
        await applyToken(res.accessToken);
        return res;
    }

    async function register(payload) {
        const res = await apiRegister(payload);
        const newToken = res.accessToken;
        localStorage.setItem(LS_TOKEN, newToken);
        setToken(newToken);
        await refreshMe(newToken);
        return res;
    }


    function logout() {
        localStorage.removeItem(LS_TOKEN);
        setToken("");
        setMe(null);
    }

    useEffect(() => {
        if (!token) return;
        refreshMe(token).catch(() => {});
    }, [token]);

    const value = useMemo(
        () => ({ token, me, login, register, logout, refreshMe }),
        [token, me]
    );


    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
    const v = useContext(AuthCtx);
    if (!v) throw new Error("useAuth must be used within AuthProvider");
    return v;
}
