# PRD: Subtasks for Todo Items

## Problem Statement

Users often need to break a task down into smaller, manageable steps. The current todo app only supports flat, single-level tasks — there is no way to represent that a task is made up of multiple sub-steps. This forces users to either create unrelated top-level todos for what are logically parts of one task, or keep that detail in their head.

## Solution

Allow any todo item (and any subtask) to have its own list of subtasks, forming an arbitrarily nested tree of tasks. Subtasks behave like regular todos: they can be added, toggled complete, and deleted. The UI presents subtasks collapsed under their parent by default, expandable on demand. Completion cascades both ways: completing a parent completes all its descendants; when all subtasks of a parent are completed, the parent auto-completes. A progress indicator on each parent shows how many subtasks are done. The frontend should have a distinctive, non-generic visual design.

## User Stories

1. As a user, I want to add a subtask to any existing todo, so that I can break a big task into smaller steps.
2. As a user, I want to add a subtask to any existing subtask, so that I can model deeply nested work.
3. As a user, I want subtasks to be collapsed by default under their parent, so that my list stays clean and readable.
4. As a user, I want to expand a todo to reveal its subtasks by clicking a toggle, so that I can focus on what matters.
5. As a user, I want to collapse an expanded todo's subtasks, so that I can hide detail I don't need right now.
6. As a user, I want to toggle a subtask complete or incomplete, so that I can track my progress through a task.
7. As a user, I want a parent todo to automatically mark itself complete when all its subtasks are completed, so that I don't have to manually complete the parent.
8. As a user, I want marking a parent todo complete to cascade to all its subtasks, so that I can complete a whole task and its sub-steps in one action.
9. As a user, I want marking a parent todo incomplete to cascade to all its subtasks, so that I can reopen a whole task uniformly.
10. As a user, I want to delete a subtask, so that I can remove steps that are no longer needed.
11. As a user, I want deleting a parent todo to also delete all its subtasks, so that orphaned subtasks don't accumulate.
12. As a user, I want to see a progress indicator on each parent todo (e.g. "2/4"), so that I can gauge how close I am to finishing without expanding.
13. As a user, I want the progress indicator to update in real time as I toggle subtasks, so that my progress is always accurate.
14. As a user, I want subtasks to have their own expand/collapse toggle if they have children, so that deep nesting is navigable.
15. As a user, I want the indentation of nested subtasks to make the hierarchy visually clear, so that I understand the structure at a glance.
16. As a user, I want the UI to feel distinctive and not generic, so that the app is pleasant to use.
17. As a user, I want to add a subtask using a compact inline form beneath a todo, so that adding steps is fast and stays in context.
18. As a user, I want the inline add-subtask form to appear when I click an "add subtask" control, so that the interface stays uncluttered by default.

## Implementation Decisions

### Data Model

- The backend will use a **flat in-memory store** where every item (top-level todo or subtask) is stored in the same collection with the fields: `id`, `title`, `completed`, `parentId` (null for top-level todos).
- The flat store makes recursive mutations (cascade complete, cascade delete) straightforward — just filter by parentId recursively.
- The API will return items as a **nested tree** (subtasks embedded under their parent's `subtasks` array) so the frontend receives a ready-to-render structure.

### Backend Modules

- **Item store**: A single in-memory collection with a `nextId` counter. Exposes: `getAll`, `getById`, `create`, `update`, `delete`, `getDescendants`. This module encapsulates all mutation and cascade logic and is independently testable.
- **Tree builder**: A pure function that takes the flat store and returns a nested tree. No side effects — easy to unit test.
- **Todos router**: Extends the existing router with new subtask routes. Delegates all data operations to the item store.

### API Contracts

All routes remain under `/api/todos`.

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/api/todos` | — | Returns all top-level todos with their full subtask tree nested |
| POST | `/api/todos` | `{ title }` | Create a top-level todo |
| PATCH | `/api/todos/:id` | — | Toggle completed on item; cascade to descendants if completing; auto-complete ancestors if all siblings complete |
| DELETE | `/api/todos/:id` | — | Delete item and all descendants |
| POST | `/api/todos/:id/subtasks` | `{ title }` | Create a subtask under the given item |

- No separate PATCH/DELETE routes for subtasks — the same `/api/todos/:id` routes work for any item regardless of depth, since every item has a unique id.

### Cascade Logic (backend)

- **Complete cascade (down)**: When an item is toggled to `completed: true`, all descendants are also set to `completed: true`.
- **Incomplete cascade (down)**: When an item is toggled to `completed: false`, all descendants are also set to `completed: false`.
- **Auto-complete (up)**: After any toggle, check if all siblings (items sharing the same `parentId`) are completed. If so, mark the parent complete and recurse upward.
- **Delete cascade**: Deleting an item removes it and all items whose id appears in its descendant set.

### Frontend Modules

- **TodoItem**: Extended to render a subtask toggle button, inline-add-subtask form, progress indicator, and expand/collapse control. Recursively renders its own subtasks.
- **AddSubtask**: A compact inline form (input + submit) that appears beneath a todo when the user clicks "add subtask". Reuses the same shape as AddTodo but is scoped to a parent id.
- **Progress indicator**: A small badge derived from the subtask tree showing `completed / total` at direct-child level.
- **Frontend design**: The frontend should be implemented using the `frontend-design` skill to ensure a distinctive, non-generic visual style.

### State Management

- App state remains centralized in `App.jsx`. The todos array returned from the API is already a nested tree.
- Toggling or deleting any item (at any depth) calls the existing PATCH/DELETE endpoint by item id and then re-fetches the full tree, keeping state sync simple.

## Testing Decisions

- **What makes a good test**: Tests should assert on external behavior (API response shapes, HTTP status codes, final state of the store) — not on internal implementation details like how the flat array is structured in memory.
- **Item store module**: Test `getDescendants`, cascade complete/incomplete, auto-complete-parent, and cascade delete in isolation, passing in known fixture data.
- **Tree builder**: Test that a flat array of items is correctly assembled into a nested tree for various depth configurations.
- **API routes (integration)**: Test each endpoint end-to-end using a real Express app with an in-memory store reset between tests. Verify correct HTTP status codes and response bodies.

## Out of Scope

- Persistent storage (database) — in-memory only.
- Reordering or drag-and-drop of todos or subtasks.
- Editing the title of an existing todo or subtask.
- Due dates, priorities, labels, or any other metadata.
- User authentication or multi-user support.
- Search or filtering.

## Further Notes

- The recursive tree rendering in React should be driven by the nested `subtasks` array in the API response, not reconstructed on the client.
- The progress indicator should count only **direct children**, not all descendants, to avoid confusing numbers on deeply nested items.
- The cascade-complete-upward logic must handle the edge case where a parent has no subtasks — in that case no auto-complete should trigger.
