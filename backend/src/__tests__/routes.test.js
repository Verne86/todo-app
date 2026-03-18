const request = require('supertest');
const app = require('../../src/app');
const store = require('../store');

beforeEach(() => store.reset());

test('GET /api/todos returns a nested tree', async () => {
  await request(app).post('/api/todos').send({ title: 'Top level' });
  const res = await request(app).get('/api/todos');
  expect(res.status).toBe(200);
  expect(res.body[0]).toHaveProperty('subtasks');
  expect(Array.isArray(res.body[0].subtasks)).toBe(true);
});

test('POST /api/todos creates a top-level todo', async () => {
  const res = await request(app).post('/api/todos').send({ title: 'New task' });
  expect(res.status).toBe(201);
  expect(res.body.title).toBe('New task');
  expect(res.body.completed).toBe(false);
  expect(res.body.parentId).toBeNull();
});

test('POST /api/todos returns 400 for missing title', async () => {
  const res = await request(app).post('/api/todos').send({});
  expect(res.status).toBe(400);
});

test('PATCH /api/todos/:id toggles completed', async () => {
  const { body: todo } = await request(app).post('/api/todos').send({ title: 'Toggle me' });
  const res = await request(app).patch(`/api/todos/${todo.id}`);
  expect(res.status).toBe(200);
  expect(res.body.completed).toBe(true);
});

test('PATCH /api/todos/:id returns 404 for unknown id', async () => {
  const res = await request(app).patch('/api/todos/999');
  expect(res.status).toBe(404);
});

test('DELETE /api/todos/:id removes the todo', async () => {
  const { body: todo } = await request(app).post('/api/todos').send({ title: 'Delete me' });
  const del = await request(app).delete(`/api/todos/${todo.id}`);
  expect(del.status).toBe(204);
  const list = await request(app).get('/api/todos');
  expect(list.body.find((t) => t.id === todo.id)).toBeUndefined();
});

test('DELETE /api/todos/:id returns 404 for unknown id', async () => {
  const res = await request(app).delete('/api/todos/999');
  expect(res.status).toBe(404);
});

test('POST /api/todos/:id/subtasks creates a subtask under a parent', async () => {
  const { body: parent } = await request(app).post('/api/todos').send({ title: 'Parent' });
  const res = await request(app).post(`/api/todos/${parent.id}/subtasks`).send({ title: 'Child' });
  expect(res.status).toBe(201);
  expect(res.body.title).toBe('Child');
  expect(res.body.parentId).toBe(parent.id);
  expect(res.body.completed).toBe(false);
});

test('POST /api/todos/:id/subtasks returns 404 for unknown parent', async () => {
  const res = await request(app).post('/api/todos/999/subtasks').send({ title: 'Child' });
  expect(res.status).toBe(404);
});

test('POST /api/todos/:id/subtasks returns 400 for missing or empty title', async () => {
  const { body: parent } = await request(app).post('/api/todos').send({ title: 'Parent' });
  const missingTitle = await request(app).post(`/api/todos/${parent.id}/subtasks`).send({});
  expect(missingTitle.status).toBe(400);
  const emptyTitle = await request(app).post(`/api/todos/${parent.id}/subtasks`).send({ title: '   ' });
  expect(emptyTitle.status).toBe(400);
});

test('DELETE /api/todos/:id removes item and all its descendants', async () => {
  const { body: parent } = await request(app).post('/api/todos').send({ title: 'Parent' });
  const { body: child } = await request(app).post(`/api/todos/${parent.id}/subtasks`).send({ title: 'Child' });
  await request(app).post(`/api/todos/${child.id}/subtasks`).send({ title: 'Grandchild' });

  await request(app).delete(`/api/todos/${parent.id}`);

  // If cascade worked, child no longer exists — PATCH should return 404
  const patchChild = await request(app).patch(`/api/todos/${child.id}`);
  expect(patchChild.status).toBe(404);
});

// --- Cascade completion tests ---

test('PATCH completing a parent cascades completion to its direct child', async () => {
  const { body: parent } = await request(app).post('/api/todos').send({ title: 'Parent' });
  await request(app).post(`/api/todos/${parent.id}/subtasks`).send({ title: 'Child' });

  await request(app).patch(`/api/todos/${parent.id}`);

  const { body: tree } = await request(app).get('/api/todos');
  expect(tree[0].completed).toBe(true);
  expect(tree[0].subtasks[0].completed).toBe(true);
});

test('PATCH completing a grandparent cascades completion to grandchild', async () => {
  const { body: gp } = await request(app).post('/api/todos').send({ title: 'Grandparent' });
  const { body: parent } = await request(app).post(`/api/todos/${gp.id}/subtasks`).send({ title: 'Parent' });
  await request(app).post(`/api/todos/${parent.id}/subtasks`).send({ title: 'Child' });

  await request(app).patch(`/api/todos/${gp.id}`);

  const { body: tree } = await request(app).get('/api/todos');
  const child = tree[0].subtasks[0].subtasks[0];
  expect(child.completed).toBe(true);
});

test('PATCH completing the last incomplete child auto-completes the parent', async () => {
  const { body: parent } = await request(app).post('/api/todos').send({ title: 'Parent' });
  const { body: child1 } = await request(app).post(`/api/todos/${parent.id}/subtasks`).send({ title: 'Child 1' });
  const { body: child2 } = await request(app).post(`/api/todos/${parent.id}/subtasks`).send({ title: 'Child 2' });

  // Complete child1 first — parent should NOT auto-complete yet
  await request(app).patch(`/api/todos/${child1.id}`);
  const mid = await request(app).get('/api/todos');
  expect(mid.body[0].completed).toBe(false);

  // Complete child2 — now all siblings done, parent should auto-complete
  await request(app).patch(`/api/todos/${child2.id}`);
  const { body: tree } = await request(app).get('/api/todos');
  expect(tree[0].completed).toBe(true);
});

test('PATCH auto-complete propagates up multiple levels', async () => {
  const { body: gp } = await request(app).post('/api/todos').send({ title: 'Grandparent' });
  const { body: parent } = await request(app).post(`/api/todos/${gp.id}/subtasks`).send({ title: 'Parent' });
  const { body: child } = await request(app).post(`/api/todos/${parent.id}/subtasks`).send({ title: 'Child' });

  // Child is the only grandchild, parent is the only child — completing child should bubble all the way up
  await request(app).patch(`/api/todos/${child.id}`);

  const { body: tree } = await request(app).get('/api/todos');
  expect(tree[0].completed).toBe(true);                        // grandparent
  expect(tree[0].subtasks[0].completed).toBe(true);            // parent
  expect(tree[0].subtasks[0].subtasks[0].completed).toBe(true); // child
});

test('PATCH marking a completed parent incomplete cascades to all descendants', async () => {
  const { body: parent } = await request(app).post('/api/todos').send({ title: 'Parent' });
  const { body: child } = await request(app).post(`/api/todos/${parent.id}/subtasks`).send({ title: 'Child' });
  await request(app).post(`/api/todos/${child.id}/subtasks`).send({ title: 'Grandchild' });

  // Complete whole tree by completing parent
  await request(app).patch(`/api/todos/${parent.id}`);

  // Now mark parent incomplete
  await request(app).patch(`/api/todos/${parent.id}`);

  const { body: tree } = await request(app).get('/api/todos');
  const flatItems = (items) => items.flatMap((t) => [t, ...flatItems(t.subtasks || [])]);
  const allCompleted = flatItems(tree).map((t) => t.completed);
  expect(allCompleted.every((c) => c === false)).toBe(true);
});

test('PATCH marking a child incomplete auto-marks its completed parent as incomplete', async () => {
  const { body: parent } = await request(app).post('/api/todos').send({ title: 'Parent' });
  const { body: child1 } = await request(app).post(`/api/todos/${parent.id}/subtasks`).send({ title: 'Child 1' });
  const { body: child2 } = await request(app).post(`/api/todos/${parent.id}/subtasks`).send({ title: 'Child 2' });

  // Complete both children to auto-complete parent
  await request(app).patch(`/api/todos/${child1.id}`);
  await request(app).patch(`/api/todos/${child2.id}`);
  const mid = await request(app).get('/api/todos');
  expect(mid.body[0].completed).toBe(true); // parent was auto-completed

  // Marking child1 incomplete should make parent incomplete too
  await request(app).patch(`/api/todos/${child1.id}`);
  const { body: tree } = await request(app).get('/api/todos');
  expect(tree[0].completed).toBe(false);
});

test('PATCH completing one child does not auto-complete parent when siblings remain incomplete', async () => {
  const { body: parent } = await request(app).post('/api/todos').send({ title: 'Parent' });
  const { body: child1 } = await request(app).post(`/api/todos/${parent.id}/subtasks`).send({ title: 'Child 1' });
  await request(app).post(`/api/todos/${parent.id}/subtasks`).send({ title: 'Child 2' });

  await request(app).patch(`/api/todos/${child1.id}`);

  const { body: tree } = await request(app).get('/api/todos');
  expect(tree[0].completed).toBe(false);
});

test('GET /api/todos after cascade delete contains no trace of deleted item or descendants', async () => {
  const { body: parent } = await request(app).post('/api/todos').send({ title: 'Parent' });
  const { body: child } = await request(app).post(`/api/todos/${parent.id}/subtasks`).send({ title: 'Child' });
  const { body: grandchild } = await request(app).post(`/api/todos/${child.id}/subtasks`).send({ title: 'Grandchild' });
  await request(app).post('/api/todos').send({ title: 'Unrelated' });

  await request(app).delete(`/api/todos/${parent.id}`);

  const { body: tree } = await request(app).get('/api/todos');
  const flatten = (items) => items.flatMap((t) => [t, ...flatten(t.subtasks || [])]);
  const allIds = flatten(tree).map((t) => t.id);
  expect(allIds).not.toContain(parent.id);
  expect(allIds).not.toContain(child.id);
  expect(allIds).not.toContain(grandchild.id);
  expect(tree).toHaveLength(1); // only 'Unrelated' remains
});
