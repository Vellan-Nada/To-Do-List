// app.js
const STORAGE_KEY = "todoItems";

const listBox = document.getElementById("listBox");
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const yearEl = document.getElementById("year");

yearEl.textContent = new Date().getFullYear();

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function makeId() {
  if (crypto && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return String(Date.now()) + "-" + String(Math.floor(Math.random() * 1e9));
}

function startEdit(row, item) {
  const titleP = row.querySelector(".title");
  const input = row.querySelector(".editInput");
  const editBtn = row.querySelector(".editBtn");
  const editIcon = row.querySelector(".editIcon");

  row.classList.add("is-editing");

  titleP.hidden = true;
  input.hidden = false;
  input.value = item.title;

  // pencil -> check
  editIcon.src = "check-solid.svg";
  editBtn.setAttribute("aria-label", "Save");

  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}

function finishEdit(row, itemId, shouldSave) {
  const items = loadItems();
  const target = items.find((x) => x.id === itemId);
  if (!target) return;

  const titleP = row.querySelector(".title");
  const input = row.querySelector(".editInput");
  const editBtn = row.querySelector(".editBtn");
  const editIcon = row.querySelector(".editIcon");

  if (shouldSave) {
    const newTitle = input.value.trim();
    if (newTitle) {
      target.title = newTitle;
      saveItems(items);
    } else {
      // don't allow empty
      input.value = target.title;
    }
  } else {
    // cancel -> revert input
    input.value = target.title;
  }

  // restore view mode
  row.classList.remove("is-editing");
  input.hidden = true;
  titleP.hidden = false;
  titleP.textContent = target.title;

  // check -> pencil
  editIcon.src = "pencil-solid.svg";
  editBtn.setAttribute("aria-label", "Edit");

  // ensure completed styling stays correct
  titleP.classList.toggle("completed", !!target.completed);
}

function render() {
  const addRow = document.getElementById("addRow");

  listBox.innerHTML = "";
  listBox.appendChild(addRow);

  const items = loadItems();

  for (const item of items) {
    const row = document.createElement("div");
    row.className = "item";
    row.dataset.id = item.id;

    row.innerHTML = `
      <input type="checkbox" class="completeCheck" ${item.completed ? "checked" : ""} />

      <p class="title ${item.completed ? "completed" : ""}"></p>

      <input type="text" class="editInput" hidden />

      <button class="edit editBtn" type="button" aria-label="Edit">
        <img class="editIcon" src="pencil-solid.svg" alt="" />
      </button>

      <button type="button" class="deleteBtn" title="Delete" aria-label="Delete">🗑️</button>
    `;

    const titleP = row.querySelector(".title");
    const input = row.querySelector(".editInput");
    const completeCheck = row.querySelector(".completeCheck");
    const editBtn = row.querySelector(".editBtn");
    const deleteBtn = row.querySelector(".deleteBtn");

    titleP.textContent = item.title;
    input.value = item.title;

    // checkbox = mark complete (strike)
    completeCheck.addEventListener("change", () => {
      const updated = loadItems().map((x) =>
        x.id === item.id ? { ...x, completed: completeCheck.checked } : x
      );
      saveItems(updated);
      render();
    });

    // delete
    deleteBtn.addEventListener("click", () => {
      const updated = loadItems().filter((x) => x.id !== item.id);
      saveItems(updated);
      render();
    });

    // pencil/check toggle behavior
    editBtn.addEventListener("click", () => {
      const isEditing = row.classList.contains("is-editing");
      if (!isEditing) {
        startEdit(row, item);
      } else {
        finishEdit(row, item.id, true);
        // re-render to keep UI consistent
        render();
      }
    });

    // Enter saves, Escape cancels (and returns icon to pencil)
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        finishEdit(row, item.id, true);
        render();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        finishEdit(row, item.id, false);
        render();
      }
    });

    listBox.insertBefore(row, addRow);
  }
}

function addTask() {
  const title = taskInput.value.trim();
  if (!title) return;

  const items = loadItems();
  items.push({ id: makeId(), title, completed: false });
  saveItems(items);

  taskInput.value = "";
  render();
}

addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addTask();
  }
});

render();
