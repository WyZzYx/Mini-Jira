import { request } from "./client";

export function createProject(token, payload) {
    return request(`/api/projects`, { token, method: "POST", body: payload });
}

export function updateProject(token, id, payload) {
    return request(`/api/projects/${id}`, { token, method: "PUT", body: payload });
}


export function addMember(token, projectId, payload) {
    return request(`/api/projects/${projectId}/members`, { token, method: "POST", body: payload });
}

export function createTask(token, projectId, payload) {
    return request(`/api/projects/${projectId}/tasks`, { token, method: "POST", body: payload });
}


export function deleteProject(projectId, token) {
    return request(`/api/projects/${projectId}`, {
        method: "DELETE",
        token,
    });
}

