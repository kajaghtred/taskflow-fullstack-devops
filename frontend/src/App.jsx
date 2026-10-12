
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


useEffect(() => {
  let ignore = false;

  async function loadTasks() {
    try {
      const response = await fetch(`${API_URL}/tasks`);

      if (!response.ok) {
        throw new Error("Unable to load tasks.");
      }

      const data = await response.json();

      if (!ignore) {
        setTasks(data);
        setError("");
      }
    } catch {
      if (!ignore) {
        setError(
          "Could not connect to the API. Make sure FastAPI is running.",
        );
      }
    } finally {
      if (!ignore) {
        setLoading(false);
      }
    }
  }

  loadTasks();

  return () => {
    ignore = true;
  };
}, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim()) return;

    try {
      setError("");

      const response = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          priority,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to create task.");
      }

      const newTask = await response.json();
      setTasks((currentTasks) => [...currentTasks, newTask]);
      setTitle("");
      setDescription("");
      setPriority("medium");
    } catch {
      setError("Could not create the task. Please try again.");
    }
  }

  async function toggleTask(task) {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/tasks/${task.id}?completed=${!task.completed}`,
        { method: "PATCH" },
      );

      if (!response.ok) {
        throw new Error("Unable to update task.");
      }

      const updatedTask = await response.json();

      setTasks((currentTasks) =>
        currentTasks.map((item) =>
          item.id === updatedTask.id ? updatedTask : item,
        ),
      );
    } catch {
      setError("Could not update the task. Please try again.");
    }
  }

  async function deleteTask(taskId) {
    try {
      setError("");

      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to delete task.");
      }

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId),
      );
    } catch {
      setError("Could not delete the task. Please try again.");
    }
  }

  const completedCount = tasks.filter((task) => task.completed).length;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">T</span>
          TaskFlow
        </a>
        <span className="api-status">
          <span className="status-dot" />
          Task workspace
        </span>
      </header>

      <section className="dashboard">
        <div className="welcome">
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1>Make progress, one task at a time.</h1>
          <p className="subtitle">
            Organize your work and keep your momentum going.
          </p>
        </div>

        <div className="stats">
          <article className="stat-card">
            <span>Total tasks</span>
            <strong>{tasks.length}</strong>
          </article>
          <article className="stat-card">
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </article>
          <article className="stat-card">
            <span>Remaining</span>
            <strong>{tasks.length - completedCount}</strong>
          </article>
        </div>

        <div className="content-grid">
          <section className="panel task-panel">
            <div className="section-heading">
              <div>
                <h2>Your tasks</h2>
                <p>Everything you need to get done.</p>
              </div>
              <span className="task-count">{tasks.length} tasks</span>
            </div>

            {error && <p className="error-message">{error}</p>}

            {loading ? (
              <p className="empty-state">Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">✓</span>
                <h3>You're all caught up</h3>
                <p>Add your first task to get started.</p>
              </div>
            ) : (
              <div className="task-list">
                {tasks.map((task) => (
                  <article
                    className={`task-item ${task.completed ? "is-completed" : ""}`}
                    key={task.id}
                  >
                    <button
                      className={`completion-toggle ${task.completed ? "checked" : ""}`}
                      onClick={() => toggleTask(task)}
                      aria-label={
                        task.completed ? "Mark incomplete" : "Mark complete"
                      }
                    >
                      {task.completed ? "✓" : ""}
                    </button>

                    <div className="task-details">
                      <h3>{task.title}</h3>
                      {task.description && <p>{task.description}</p>}
                      <span className={`priority priority-${task.priority}`}>
                        {task.priority}
                      </span>
                    </div>

                    <button
                      className="delete-button"
                      onClick={() => deleteTask(task.id)}
                      aria-label={`Delete ${task.title}`}
                      title="Delete task"
                    >
                      Delete
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="panel form-panel">
            <div className="section-heading">
              <div>
                <h2>Create a task</h2>
                <p>What's on your mind?</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <label htmlFor="title">Task title</label>
              <input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Learn Docker"
                maxLength={200}
                required
              />

              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Add a few details..."
                rows={4}
                maxLength={2000}
              />

              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

              <button className="primary-button" type="submit">
                + Add task
              </button>
            </form>
          </aside>
        </div>
      </section>

      <footer className="footer">
        Built with React, FastAPI and PostgreSQL
      </footer>
    </main>
  );
}

export default App;
