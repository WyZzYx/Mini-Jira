import { request } from "./client";

export function getMe(token) {
    return request("/api/me", { token });
}
