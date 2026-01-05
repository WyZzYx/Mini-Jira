import { request } from "./client";

export function login(email, password) {
    return request("/api/auth/login", {
        method: "POST",
        body: { email, password },
    });
}
export function register(body) {
    return request("/api/auth/register", {
        method: "POST",
        body,
    });
}
