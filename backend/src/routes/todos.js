const express = require('express');
const router = express.Router();
const store = require('../store');
const { buildTree } = require('../treeBuilder');

// GET /api/todos — return full nested tree
router.get('/', (req, res) => {
  res.json(buildTree(store.getAll()));
});

// POST /api/todos — create a top-level todo
router.post('/', (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required' });
  }
  const item = store.create({ title: title.trim() });
  res.status(201).json(item);
});

// PATCH /api/todos/:id — toggle completed
router.patch('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const item = store.getById(id);
  if (!item) return res.status(404).json({ error: 'Todo not found' });
  const updated = store.update(id, { completed: !item.completed });
  res.json(updated);
});

// DELETE /api/todos/:id — delete todo
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const item = store.getById(id);
  if (!item) return res.status(404).json({ error: 'Todo not found' });
  store.remove(id);
  res.status(204).send();
});

module.exports = router;
