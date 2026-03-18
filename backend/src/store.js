let items = [];
let nextId = 1;

function reset() {
  items = [];
  nextId = 1;
}

function create({ title, parentId = null }) {
  const item = { id: nextId++, title, completed: false, parentId };
  items.push(item);
  return item;
}

function getAll() {
  return items;
}

function getById(id) {
  return items.find((i) => i.id === id) || null;
}

function update(id, fields) {
  const item = getById(id);
  if (!item) return null;
  Object.assign(item, fields);
  return item;
}

function remove(id) {
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return false;
  items.splice(index, 1);
  return true;
}

function getDescendants(id) {
  const result = [];
  const queue = items.filter((i) => i.parentId === id);
  while (queue.length) {
    const item = queue.shift();
    result.push(item);
    queue.push(...items.filter((i) => i.parentId === item.id));
  }
  return result;
}

module.exports = { reset, create, getAll, getById, update, remove, getDescendants };
