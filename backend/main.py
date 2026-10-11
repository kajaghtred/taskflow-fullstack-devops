
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import SessionLocal
from models import TaskModel


app = FastAPI(
    title="TaskFlow API",
    description="A full-stack task management application",
    version="1.0.0",
)


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    priority: str = Field(default="medium", pattern="^(low|medium|high)$")


class Task(TaskCreate):
    id: int
    completed: bool = False


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "Welcome to TaskFlow API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/tasks", response_model=Task, status_code=201)
def create_task(task_data: TaskCreate, db: Session = Depends(get_db)):
    task = TaskModel(
        title=task_data.title,
        description=task_data.description,
        priority=task_data.priority,
        completed=False,
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return task


@app.get("/tasks", response_model=list[Task])
def get_tasks(db: Session = Depends(get_db)):
    return db.query(TaskModel).order_by(TaskModel.id).all()


@app.get("/tasks/{task_id}", response_model=Task)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.get(TaskModel, task_id)

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    return task


@app.patch("/tasks/{task_id}", response_model=Task)
def update_task(
    task_id: int,
    completed: bool,
    db: Session = Depends(get_db),
):
    task = db.get(TaskModel, task_id)

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    task.completed = completed
    db.commit()
    db.refresh(task)

    return task


@app.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.get(TaskModel, task_id)

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
