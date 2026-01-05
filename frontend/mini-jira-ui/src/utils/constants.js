

export const LS_TOKEN = "minijira_token";
export const LS_LANG = "minijira_lang";

export const API_BASE =
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) ||
    "http://localhost:5000";
