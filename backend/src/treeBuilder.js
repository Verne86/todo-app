function buildTree(items) {
  const map = {};
  items.forEach((item) => {
    map[item.id] = { ...item, subtasks: [] };
  });

  const roots = [];
  items.forEach((item) => {
    if (item.parentId === null) {
      roots.push(map[item.id]);
    } else if (map[item.parentId]) {
      map[item.parentId].subtasks.push(map[item.id]);
    }
  });

  return roots;
}

module.exports = { buildTree };
