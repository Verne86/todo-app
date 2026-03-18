import { useState, useEffect } from 'react';
import TodoList from './components/TodoList.jsx';
import AddTodo from './components/AddTodo.jsx';

function App() {
  const [todos, setTodos] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    try {
      setLoading(true);
      const res = await fetch('/api/todos');
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setTodos(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function addTodo(title) {
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      await fetchTodos();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleTodo(id) {
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      await fetchTodos();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteTodo(id) {
    try {
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      await fetchTodos();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function addSubtask(parentId, title) {
    try {
      const res = await fetch(`/api/todos/${parentId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      await fetchTodos();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>TASKS</h1>
        <p className="app-subtitle">— stay on track —</p>
      </header>
      {error && <p className="error">{error}</p>}
      <AddTodo onAdd={addTodo} />
      {loading ? (
        <p className="loading">loading...</p>
      ) : (
        <TodoList todos={todos} onToggle={toggleTodo} onDelete={deleteTodo} onAddSubtask={addSubtask} />
      )}
    </div>
  );
}

export default App;
