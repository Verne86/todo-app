import { useState, useRef, useEffect } from 'react';

function TodoItem({ todo, onToggle, onDelete, onAddSubtask, depth = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const inputRef = useRef(null);

  const hasSubtasks = todo.subtasks && todo.subtasks.length > 0;
  const completedCount = hasSubtasks
    ? todo.subtasks.filter((s) => s.completed).length
    : 0;
  const totalCount = hasSubtasks ? todo.subtasks.length : 0;

  useEffect(() => {
    if (showAddForm && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showAddForm]);

  async function handleAddSubtask(e) {
    e.preventDefault();
    const trimmed = subtaskTitle.trim();
    if (!trimmed) return;
    await onAddSubtask(todo.id, trimmed);
    setSubtaskTitle('');
    setShowAddForm(false);
    setExpanded(true);
  }

  function handleDismiss() {
    setSubtaskTitle('');
    setShowAddForm(false);
  }

  return (
    <li className={`todo-item${todo.completed ? ' completed' : ''}`}>
      <div className="todo-row">
        <button
          className={`expand-btn${!hasSubtasks ? ' invisible' : ''}${expanded ? ' expanded' : ''}`}
          onClick={() => hasSubtasks && setExpanded((e) => !e)}
          aria-label={expanded ? 'Collapse subtasks' : 'Expand subtasks'}
          tabIndex={hasSubtasks ? 0 : -1}
        >
          ▶
        </button>

        <label className="check-wrap">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo.id)}
            aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
          />
          <span className="checkmark" />
        </label>

        <span className="todo-title">{todo.title}</span>

        {hasSubtasks && (
          <span className={`progress-badge${completedCount === totalCount ? ' all-done' : ''}`}>
            {completedCount}/{totalCount}
          </span>
        )}

        <button
          className="add-subtask-btn"
          onClick={() => setShowAddForm((v) => !v)}
          aria-label={`Add subtask to "${todo.title}"`}
          aria-expanded={showAddForm}
        >
          +
        </button>

        <button
          className="delete-btn"
          onClick={() => onDelete(todo.id)}
          aria-label={`Delete "${todo.title}"`}
        >
          ×
        </button>
      </div>

      {showAddForm && (
        <form className="add-subtask-form" onSubmit={handleAddSubtask}>
          <input
            ref={inputRef}
            type="text"
            placeholder="subtask title..."
            value={subtaskTitle}
            onChange={(e) => setSubtaskTitle(e.target.value)}
            aria-label="New subtask title"
          />
          <button type="submit" disabled={!subtaskTitle.trim()}>ADD</button>
          <button type="button" className="cancel-btn" onClick={handleDismiss} aria-label="Cancel">✕</button>
        </form>
      )}

      {hasSubtasks && expanded && (
        <ul className="subtask-list">
          {todo.subtasks.map((subtask) => (
            <TodoItem
              key={subtask.id}
              todo={subtask}
              onToggle={onToggle}
              onDelete={onDelete}
              onAddSubtask={onAddSubtask}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default TodoItem;
