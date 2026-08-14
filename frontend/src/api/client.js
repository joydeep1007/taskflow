const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function fetchWithHandling(url, options = {}) {
    options.headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    let response;
    try {
        response = await fetch(url, options);
    } catch (error) {
        throw new Error("Network error — is the backend running?");
    }

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = {};
        }
        throw new Error(errorData.error || "Request failed");
    }

    return response.json();
}

export async function getBoard(boardId) {
    return fetchWithHandling(`${API_URL}/api/boards/${boardId}`);
}

export async function createTask(data) {
    return fetchWithHandling(`${API_URL}/api/tasks`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateTask(id, data) {
    return fetchWithHandling(`${API_URL}/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

export async function moveTask(id, data) {
    return fetchWithHandling(`${API_URL}/api/tasks/${id}/move`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

export async function deleteTask(id) {
    return fetchWithHandling(`${API_URL}/api/tasks/${id}`, {
        method: "DELETE",
    });
}

export async function getTasksByPriority(boardId, priority) {
    return fetchWithHandling(`${API_URL}/api/boards/${boardId}/tasks?priority=${priority}`);
}
