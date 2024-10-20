// const apibase = "http://localhost:8000";
const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT;
console.log(API_ENDPOINT);

// Get all tasks with optional filters
async function getTasks(startDate = null, endDate = null) {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    
    const response = await fetch(`${API_ENDPOINT}/tasks?${params}`);
    return await response.json();
}

// Get a specific task by ID
async function getTask(id, startDate = null, endDate = null) {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    
    const response = await fetch(`${API_ENDPOINT}/tasks/${id}?${params}`);
    return await response.json();
}

// Create a new task
async function createTask(task) {
    const response = await fetch(`${API_ENDPOINT}/tasks`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(task),
    });
    return await response.json();
}

// Update a task's details
async function updateTask(id, taskUpdates) {
    const response = await fetch(`${API_ENDPOINT}/tasks/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(taskUpdates),
    });
    return await response.json();
}

// Update the status of a task on a specific date
async function updateTaskStatus(id, date, value) {
    const response = await fetch(`${API_ENDPOINT}/tasks/${id}/status`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ date, value }),
    });
    return await response.json();
}

// Delete a task by ID
async function deleteTask(id) {
    const response = await fetch(`${API_ENDPOINT}/tasks/${id}`, {
        method: "DELETE",
    });
    return await response.json();
}

async function login(username, password) {
    const response = await fetch(`${API_ENDPOINT}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
    });
    console.log({
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
    });

    let json = await response.json();

    const code = response.status;
    if (code !== 200) {
        console.log(json);
        throw new Error(`Failed to login. Status code: ${code}`);
    }

    return await json;
}




export { getTasks, getTask, createTask, updateTask, updateTaskStatus, deleteTask, login };

