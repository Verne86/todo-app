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
