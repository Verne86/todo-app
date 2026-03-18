const express = require('express');
const router = express.Router();

let todos = [];
let nextId = 1;

// GET /api/todos — list all todos
router.get('/', (req, res) => {
  res.json(todos);
});

// POST /api/todos — create a todo
router.post('/', (req, res) => {
  const { title } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required' });
  }

  const todo = {
    id: nextId++,
    title: title.trim(),
    completed: false,
  };

  todos.push(todo);
  res.status(201).json(todo);
});

// PATCH /api/todos/:id — toggle completed
router.patch('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const todo = todos.find((t) => t.id === id);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  todo.completed = !todo.completed;
  res.json(todo);
});

// DELETE /api/todos/:id — delete a todo
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = todos.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  todos.splice(index, 1);
  res.status(204).send();
});

module.exports = router;
