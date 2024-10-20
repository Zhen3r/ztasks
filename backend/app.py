from fastapi import FastAPI, HTTPException
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime
from copy import deepcopy
import uuid
import json
import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from loguru import logger

dir_path = os.path.dirname(os.path.realpath(__file__))
logs_path = os.path.join(dir_path, "logs.log")
pwd_path = os.path.join(dir_path, "data", "pwd.json")
db_path = os.path.join(dir_path, "data", "tasks_db.json")

logger.add(logs_path, rotation="50 MB", retention="10 days", level="DEBUG")
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

with open(pwd_path, "r") as file:
    users = json.load(file)
auth_tokens = {}

class DB:
# In-memory storage
    def __init__(self):
        self._db = {}
        self.db_file = db_path
        self.load_db()

    # Load database from file if exists
    def load_db(self):
        if os.path.exists(self.db_file):
            if os.path.getsize(self.db_file) == 0:
                return
            with open(self.db_file, "r") as file:
                self._db = json.load(file)

    # Save database to file
    def save_db(self):
        if not os.path.exists(os.path.dirname(self.db_file)):
            os.makedirs(os.path.dirname(self.db_file))
        with open(self.db_file, "w") as file:
            json.dump(self._db, file)

    @property
    def db(self, remove_invalid=True):
        res = self._db
        if remove_invalid:
            res = {k: v for k, v in res.items() if v.get("is_valid", True)}
        return deepcopy(res)
    
    def __setitem__(self, key, value):
        self._db[key] = value
    
    def __getitem__(self, key):
        if not key in self._db:
            return None
        item = self._db[key]
        if not item.get("is_valid", True):
            return None
        return deepcopy(item)
    
    def __contains__(self, key):
        return key in self._db and self._db[key].get("is_valid", True)

        




# Load DB on startup
db = DB()


# Task model
class TaskCreate(BaseModel):
    name: str
    type: str
    tracking_period_days: int
    goal_each_period: int
    unit: Optional[str] = None
    is_valid: Optional[bool] = True
    status: Optional[Dict[str, Any]] = None


class TaskUpdate(BaseModel):
    name: Optional[str] = None
    tracking_period_days: Optional[int] = None
    goal_each_period: Optional[int] = None
    unit: Optional[str] = None
    is_valid: Optional[bool] = None


class StatusUpdate(BaseModel):
    date: str
    value: str | int | float | None


@app.get("/api/tasks", response_model=List[dict])
async def get_tasks(start_date: Optional[str] = None, end_date: Optional[str] = None):
    filtered_tasks = list(db.db.values())

    # Filter by date range if provided
    for task in filtered_tasks:
        if start_date or end_date:
            filtered_status = {}
            for date, value in task['status'].items():
                if start_date and date < start_date:
                    continue
                if end_date and date > end_date:
                    continue
                filtered_status[date] = value
            task["status"] = filtered_status

    return filtered_tasks


@app.get("/api/tasks/{id}", response_model=dict)
async def get_task(id: str, start_date: Optional[str] = None, end_date: Optional[str] = None):
    task = db[id]
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if start_date or end_date:
        filtered_status = {}
        for date, value in task['status'].items():
            if start_date and date < start_date:
                continue
            if end_date and date > end_date:
                continue
            filtered_status[date] = value
        task = {**task, "status": filtered_status}

    return task


@app.post("/api/tasks", response_model=dict)
async def create_task(task: TaskCreate):
    def generate_id():
        u = uuid.uuid4()
        return u.hex[:8]
    while True:
        task_id = generate_id()
        if task_id not in db.db:
            break
    new_task = task.dict()
    new_task['id'] = task_id
    new_task["created"] = int(datetime.now().timestamp()*1000)
    db[task_id] = new_task
    if not new_task.get("status"):
        new_task["status"] = {}
    db.save_db()
    return new_task


@app.patch("/api/tasks/{id}", response_model=dict)
async def update_task(id: str, task_update: TaskUpdate):
    task = db[id]
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    updated_task = {**task, **task_update.dict(exclude_unset=True)}
    db[id] = updated_task
    db.save_db()
    return updated_task


@app.patch("/api/tasks/{id}/status", response_model=dict)
async def update_task_status(id: str, status_update: StatusUpdate):
    print(id, status_update)
    task = db[id]
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not task.get("status"):
        task["status"] = {}
    task['status'][status_update.date] = status_update.value
    db[id] = task
    db.save_db()
    return task


@app.delete("/api/tasks/{id}", response_model=dict)
async def delete_task(id: str):
    if id not in db:
        raise HTTPException(status_code=404, detail="Task not found")
    task = db[id]
    task["is_valid"] = False
    db[id] = task
    db.save_db()
    return {"message": "Task deleted successfully"}



class Login(BaseModel):
    username: str
    password: str

@app.post("/api/login", response_model=dict)
async def login(login: Login):
    import hashlib
    username = login.username
    password = login.password
    password_md5 = hashlib.md5(password.encode()).hexdigest()
    if users.get(username) == password_md5:
        token = uuid.uuid4()
        auth_tokens[token] = username
        return {"message": "Login successful", "token": token}
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/api/validate_token", response_model=dict)
async def validate_token(token: str):
    if token in auth_tokens:
        return {"message": "Token is valid"}
    else:
        raise HTTPException(status_code=401, detail="Invalid token")


build_path = os.path.join(os.path.dirname(__file__), "../build")
@app.get("/")
async def index():
    return FileResponse(os.path.join(build_path, "index.html"))

@app.get("/{file_path:path}")
async def serve_file(file_path: str):
    return FileResponse(os.path.join(build_path, file_path))

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="localhost", port=8000, reload=True)