const store = require('../store');

beforeEach(() => store.reset());

describe('create', () => {
  test('returns item with id, title, completed=false, parentId=null by default', () => {
    const item = store.create({ title: 'Buy milk' });
    expect(item).toEqual({ id: expect.any(Number), title: 'Buy milk', completed: false, parentId: null });
  });
});

describe('getById', () => {
  test('returns item by id', () => {
    const item = store.create({ title: 'Test' });
    expect(store.getById(item.id)).toBe(item);
  });

  test('returns null for unknown id', () => {
    expect(store.getById(999)).toBeNull();
  });
});

describe('getDescendants', () => {
  test('returns empty array for item with no children', () => {
    const item = store.create({ title: 'Solo' });
    expect(store.getDescendants(item.id)).toEqual([]);
  });

  test('returns direct children', () => {
    const parent = store.create({ title: 'Parent' });
    const child = store.create({ title: 'Child', parentId: parent.id });
    expect(store.getDescendants(parent.id)).toEqual([child]);
  });

  test('returns all descendants across multiple levels', () => {
    const grandparent = store.create({ title: 'Grandparent' });
    const parent = store.create({ title: 'Parent', parentId: grandparent.id });
    const child = store.create({ title: 'Child', parentId: parent.id });
    const descendants = store.getDescendants(grandparent.id);
    expect(descendants).toContain(parent);
    expect(descendants).toContain(child);
    expect(descendants).toHaveLength(2);
  });
});
