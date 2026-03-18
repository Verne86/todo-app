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

// PATCH /api/todos/:id — toggle completed with cascade
router.patch('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const item = store.getById(id);
  if (!item) return res.status(404).json({ error: 'Todo not found' });

  const newCompleted = !item.completed;

  // Cascade down to all descendants
  store.update(id, { completed: newCompleted });
  store.getDescendants(id).forEach((d) => store.update(d.id, { completed: newCompleted }));

  // Walk up the ancestor chain
  let currentId = id;
  while (true) {
    const current = store.getById(currentId);
    if (!current || current.parentId === null) break;

    const parent = store.getById(current.parentId);
    if (!parent) break;

    if (newCompleted) {
      // Auto-complete parent only when every sibling is completed
      const siblings = store.getAll().filter((i) => i.parentId === current.parentId);
      if (siblings.every((s) => s.completed)) {
        store.update(parent.id, { completed: true });
        currentId = parent.id;
      } else {
        break;
      }
    } else {
      // Auto-incomplete parent if it was marked complete
      if (parent.completed) {
        store.update(parent.id, { completed: false });
        currentId = parent.id;
      } else {
        break;
      }
    }
  }

  res.json(store.getById(id));
});

// POST /api/todos/:id/subtasks — create a subtask under an existing item
router.post('/:id/subtasks', (req, res) => {
  const parentId = parseInt(req.params.id, 10);
  const parent = store.getById(parentId);
  if (!parent) return res.status(404).json({ error: 'Todo not found' });
  const { title } = req.body;
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required' });
  }
  const item = store.create({ title: title.trim(), parentId });
  res.status(201).json(item);
});

// DELETE /api/todos/:id — delete todo and all descendants
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const item = store.getById(id);
  if (!item) return res.status(404).json({ error: 'Todo not found' });
  store.getDescendants(id).forEach((d) => store.remove(d.id));
  store.remove(id);
  res.status(204).send();
});

module.exports = router;
