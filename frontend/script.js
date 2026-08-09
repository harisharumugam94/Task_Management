// Change this if your backend runs on a different port
const API_BASE = 'http://localhost:5000/api';

// ---- Element references ----
const authScreen = document.getElementById('authScreen');
const dashboard = document.getElementById('dashboard');

const showLoginBtn = document.getElementById('showLogin');
const showRegisterBtn = document.getElementById('showRegister');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');

const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const userNameLabel = document.getElementById('userNameLabel');
const logoutBtn = document.getElementById('logoutBtn');

// ---- Small helpers for saving/reading the logged-in session ----
function saveSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}
function getToken() {
  return localStorage.getItem('token');
}
function getUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}
function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// ---- Switch between login/register tabs ----
showLoginBtn.addEventListener('click', () => {
  showLoginBtn.classList.add('active');
  showRegisterBtn.classList.remove('active');
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
});
showRegisterBtn.addEventListener('click', () => {
  showRegisterBtn.classList.add('active');
  showLoginBtn.classList.remove('active');
  registerForm.classList.remove('hidden');
  loginForm.classList.add('hidden');
});

// ---- Register ----
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  registerError.textContent = '';

  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      registerError.textContent = data.message || 'Registration failed';
      return;
    }

    saveSession(data.token, data.user);
    enterDashboard();
  } catch (err) {
    registerError.textContent = 'Could not reach the server';
  }
});

// ---- Login ----
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      loginError.textContent = data.message || 'Login failed';
      return;
    }

    saveSession(data.token, data.user);
    enterDashboard();
  } catch (err) {
    loginError.textContent = 'Could not reach the server';
  }
});

// ---- Logout ----
logoutBtn.addEventListener('click', () => {
  clearSession();
  dashboard.classList.add('hidden');
  authScreen.classList.remove('hidden');
});

// ---- Switch UI into the dashboard and load tasks ----
function enterDashboard() {
  const user = getUser();
  userNameLabel.textContent = user ? `Hi, ${user.name}` : '';
  authScreen.classList.add('hidden');
  dashboard.classList.remove('hidden');
  loadTasks();
}

// ---- Fetch and render all tasks for the logged-in user ----
async function loadTasks() {
  try {
    const res = await fetch(`${API_BASE}/tasks`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });

    if (res.status === 401) {
      // token missing/expired -> send back to login
      clearSession();
      dashboard.classList.add('hidden');
      authScreen.classList.remove('hidden');
      return;
    }

    const tasks = await res.json();
    renderTasks(tasks);
  } catch (err) {
    taskList.innerHTML = '<p>Could not load tasks. Is the backend running?</p>';
  }
}

// Status cycles in this order each time the badge is clicked
const STATUS_CYCLE = ['pending', 'in-progress', 'completed'];

const statsBar = document.getElementById('statsBar');
const statTotal = document.getElementById('statTotal');
const statPending = document.getElementById('statPending');
const statProgress = document.getElementById('statProgress');
const statDone = document.getElementById('statDone');
const progressFill = document.getElementById('progressFill');

// ---- Update the stats bar counts + progress fill ----
function updateStats(tasks) {
  if (tasks.length === 0) {
    statsBar.classList.add('hidden');
    return;
  }
  statsBar.classList.remove('hidden');

  const pending = tasks.filter(t => t.status === 'pending').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const done = tasks.filter(t => t.status === 'completed').length;

  statTotal.textContent = tasks.length;
  statPending.textContent = pending;
  statProgress.textContent = inProgress;
  statDone.textContent = done;

  const percent = Math.round((done / tasks.length) * 100);
  progressFill.style.width = `${percent}%`;
}

// ---- Build the task cards in the DOM ----
function renderTasks(tasks) {
  updateStats(tasks);

  if (tasks.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        <span class="emoji">📝</span>
        No tasks yet — add one above to get started.
      </div>`;
    return;
  }

  taskList.innerHTML = tasks.map(task => `
    <div class="task-card status-${task.status}" data-id="${task._id}">
      <div class="task-info">
        <h3>${escapeHtml(task.title)}</h3>
        ${task.description ? `<p>${escapeHtml(task.description)}</p>` : ''}
        <div class="task-meta">
          <button class="status-badge status-${task.status}" data-action="cycle-status" title="Click to change status">
            ${task.status.replace('-', ' ')}
          </button>
          ${task.dueDate ? `<span>Due: ${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="delete-btn" data-action="delete">Delete</button>
      </div>
    </div>
  `).join('');
}

// Basic escaping so task text can't break the page layout
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---- Add a new task ----
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('taskTitle').value;
  const description = document.getElementById('taskDescription').value;
  const dueDate = document.getElementById('taskDueDate').value;
  const status = document.getElementById('taskStatus').value;

  try {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ title, description, dueDate, status })
    });

    if (res.ok) {
      taskForm.reset();
      loadTasks();
    }
  } catch (err) {
    console.error('Failed to add task', err);
  }
});

// ---- Handle status-badge clicks and delete clicks (event delegation) ----
taskList.addEventListener('click', async (e) => {
  const button = e.target.closest('button');
  if (!button) return;

  const card = button.closest('.task-card');
  const taskId = card.dataset.id;
  const action = button.dataset.action;

  if (action === 'delete') {
    // Play the fade/slide-out animation, then actually delete once it finishes
    card.classList.add('removing');
    card.addEventListener('animationend', async () => {
      await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      loadTasks();
    }, { once: true });
    return;
  }

  if (action === 'cycle-status') {
    // Move to the next status in the cycle: pending -> in-progress -> completed -> pending
    const currentStatus = STATUS_CYCLE.find(s => card.classList.contains(`status-${s}`));
    const nextStatus = STATUS_CYCLE[(STATUS_CYCLE.indexOf(currentStatus) + 1) % STATUS_CYCLE.length];

    await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ status: nextStatus })
    });
    loadTasks();
  }
});

// ---- On page load, jump straight to dashboard if already logged in ----
if (getToken()) {
  enterDashboard();
}
