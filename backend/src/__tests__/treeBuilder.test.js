const { buildTree } = require('../treeBuilder');

test('returns empty array for empty input', () => {
  expect(buildTree([])).toEqual([]);
});

test('top-level items have an empty subtasks array', () => {
  const items = [{ id: 1, title: 'A', completed: false, parentId: null }];
  expect(buildTree(items)).toEqual([{ id: 1, title: 'A', completed: false, parentId: null, subtasks: [] }]);
});

test('subtasks are nested under their parent', () => {
  const items = [
    { id: 1, title: 'Parent', completed: false, parentId: null },
    { id: 2, title: 'Child', completed: false, parentId: 1 },
  ];
  const tree = buildTree(items);
  expect(tree).toHaveLength(1);
  expect(tree[0].subtasks).toHaveLength(1);
  expect(tree[0].subtasks[0].title).toBe('Child');
});

test('multi-level nesting works correctly', () => {
  const items = [
    { id: 1, title: 'Grandparent', completed: false, parentId: null },
    { id: 2, title: 'Parent', completed: false, parentId: 1 },
    { id: 3, title: 'Child', completed: false, parentId: 2 },
  ];
  const tree = buildTree(items);
  expect(tree).toHaveLength(1);
  expect(tree[0].subtasks[0].subtasks[0].title).toBe('Child');
});
