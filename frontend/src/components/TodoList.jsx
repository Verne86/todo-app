import TodoItem from './TodoItem.jsx';

function TodoList({ todos, onToggle, onDelete, onAddSubtask }) {
  if (todos.length === 0) {
    return <p className="empty">No todos yet. Add one above.</p>;
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
          onAddSubtask={onAddSubtask}
        />
      ))}
    </ul>
  );
}

export default TodoList;
