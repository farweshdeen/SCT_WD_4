const taskForm = document.getElementById('taskForm');
const taskTitleInput = document.getElementById('taskTitle');
const taskDateInput = document.getElementById('taskDate');
const taskTimeInput = document.getElementById('taskTime');
const taskList = document.getElementById('taskList');
const submitButton = document.getElementById('submitButton');
const cancelEditButton = document.getElementById('cancelEditButton');
const formMessage = document.getElementById('formMessage');
const taskCount = document.getElementById('taskCount');

let tasks = [];
let editingTaskId = null;
let highlightTaskId = null;

// Load tasks from localStorage when the page opens.
function loadTasks() {
  try {
    const stored = localStorage.getItem('todoTasks');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Unable to load tasks:', error);
    return [];
  }
}

// Save tasks to localStorage.
function saveTasks() {
  localStorage.setItem('todoTasks', JSON.stringify(tasks));
}

// Format date to a friendly display like 15 June 2026.
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Format time to a friendly display like 6:00 PM.
function formatTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Update the task count badge.
function updateTaskCount() {
  const completedCount = tasks.filter((task) => task.completed).length;
  taskCount.textContent = `${tasks.length} task${tasks.length === 1 ? '' : 's'}${completedCount ? ` • ${completedCount} done` : ''}`;
}

// Reset the form and exit edit mode.
function resetForm() {
  taskForm.reset();
  editingTaskId = null;
  submitButton.textContent = 'Add Task';
  cancelEditButton.classList.add('hidden');
  formMessage.textContent = '';
}

// Show a user-friendly message in the form.
function setFormMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.style.color = isError ? 'var(--danger)' : 'var(--success)';
}

// Render all tasks to the UI.
function renderTasks() {
  if (!tasks.length) {
    taskList.innerHTML = '<li class="empty-state">No tasks yet. Add your first task above.</li>';
    updateTaskCount();
    return;
  }

  taskList.innerHTML = tasks
    .map((task) => {
      const isCompleted = task.completed ? 'completed' : '';
      const isHighlighted = highlightTaskId === task.id ? 'new' : '';
      return `
        <li class="task-card ${isCompleted} ${isHighlighted}" data-id="${task.id}">
          <div class="task-main">
            <input
              class="checkbox"
              type="checkbox"
              aria-label="Mark task as completed"
              ${task.completed ? 'checked' : ''}
              data-action="toggle-complete"
              data-id="${task.id}"
            />
            <div class="task-content">
              <h3 class="task-title">${task.title}</h3>
              <div class="task-meta">
                <div>📅 ${formatDate(task.date)}</div>
                <div>🕒 ${formatTime(task.time)}</div>
              </div>
            </div>
          </div>
          <div class="task-actions">
            <button class="action-btn edit-btn" data-action="edit" data-id="${task.id}">✏️ Edit</button>
            <button class="action-btn delete-btn" data-action="delete" data-id="${task.id}">🗑 Delete</button>
          </div>
        </li>
      `;
    })
    .join('');

  updateTaskCount();
}

// Add a new task.
function addTask(event) {
  if (event) event.preventDefault();

  const title = taskTitleInput.value.trim();
  const date = taskDateInput.value;
  const time = taskTimeInput.value;

  if (!title || !date || !time) {
    setFormMessage('Please fill in the task title, date, and time.', true);
    return;
  }

  if (editingTaskId !== null) {
    editTask();
    return;
  }

  const newTask = {
    id: Date.now(),
    title,
    date,
    time,
    completed: false,
  };

  tasks.unshift(newTask);
  saveTasks();
  highlightTaskId = newTask.id;
  renderTasks();
  resetForm();
  setFormMessage('Task added successfully!');
  window.setTimeout(() => {
    highlightTaskId = null;
    renderTasks();
  }, 300);
}

// Edit an existing task.
function editTask() {
  const title = taskTitleInput.value.trim();
  const date = taskDateInput.value;
  const time = taskTimeInput.value;

  if (!title || !date || !time) {
    setFormMessage('Please fill in the task title, date, and time.', true);
    return;
  }

  const taskToEdit = tasks.find((task) => task.id === editingTaskId);
  if (!taskToEdit) {
    setFormMessage('Task could not be found.', true);
    return;
  }

  taskToEdit.title = title;
  taskToEdit.date = date;
  taskToEdit.time = time;

  saveTasks();
  renderTasks();
  resetForm();
  setFormMessage('Task updated successfully!');
}

// Delete a task with a small animation.
function deleteTask(id) {
  const taskElement = taskList.querySelector(`[data-id="${id}"]`);
  if (taskElement) {
    taskElement.classList.add('removing');
    setTimeout(() => {
      tasks = tasks.filter((task) => task.id !== id);
      saveTasks();
      renderTasks();
    }, 180);
  } else {
    tasks = tasks.filter((task) => task.id !== id);
    saveTasks();
    renderTasks();
  }
}

// Toggle completion status of a task.
function toggleComplete(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderTasks();
}

// Handle button clicks and checkbox changes.
function handleTaskAction(event) {
  const target = event.target;
  const action = target.dataset.action;
  const id = Number(target.dataset.id);

  if (!action || Number.isNaN(id)) return;

  if (action === 'toggle-complete') {
    toggleComplete(id);
    return;
  }

  if (action === 'edit') {
    const taskToEdit = tasks.find((task) => task.id === id);
    if (!taskToEdit) return;

    editingTaskId = taskToEdit.id;
    taskTitleInput.value = taskToEdit.title;
    taskDateInput.value = taskToEdit.date;
    taskTimeInput.value = taskToEdit.time;
    submitButton.textContent = 'Update Task';
    cancelEditButton.classList.remove('hidden');
    taskTitleInput.focus();
    setFormMessage('Editing task...');
    return;
  }

  if (action === 'delete') {
    deleteTask(id);
  }
}

// Set up event listeners.
taskForm.addEventListener('submit', addTask);
cancelEditButton.addEventListener('click', resetForm);
taskList.addEventListener('click', handleTaskAction);
taskList.addEventListener('change', handleTaskAction);

tasks = loadTasks();
renderTasks();
updateTaskCount();
