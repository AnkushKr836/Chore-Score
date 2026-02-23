/* ===========================
   EARN & LEARN — parent.js
   Parent dashboard logic.

   BACKEND INTEGRATION NOTE:
   All state mutations (approveTask, triggerPayday, etc.) should become
   API calls. See backend-api-guide.txt for full endpoint reference.
   =========================== */

// ===========================
// GUARD: redirect if not logged in as parent
// ===========================
if (sessionStorage.getItem('role') !== 'parent') {
  window.location.href = 'login.html';
}

// ===========================
// SHARED STATE
// In production this data comes from your backend API.
// See backend-api-guide.txt §3 for fetch() patterns.
// ===========================
const state = {
  parent: {
    exchangeRate: 0.5,   // ₹ per point
    interestRate: 5      // % monthly interest on savings
  },

  children: [
    { id: 'ARIA01', name: 'Aria',   avatar: '🐱', currentPoints: 320, savingsBalance: 150, history: [] },
    { id: 'VIK02',  name: 'Vikram', avatar: '🐶', currentPoints: 180, savingsBalance: 60,  history: [] }
  ],

  tasks: [
    { id: 't1', name: 'Wash Dishes',    points: 40, assignedTo: 'ARIA01', status: 'Completed' },
    { id: 't2', name: 'Take Out Trash', points: 30, assignedTo: 'VIK02',  status: 'Awaiting Approval' },
    { id: 't3', name: 'Mop the Floor',  points: 60, assignedTo: 'ARIA01', status: 'Awaiting Approval' },
    { id: 't4', name: 'Water Plants',   points: 20, assignedTo: 'VIK02',  status: 'Pending' },
    { id: 't5', name: 'Make Bed',       points: 15, assignedTo: 'ARIA01', status: 'Pending' },
    { id: 't6', name: 'Clean Bathroom', points: 80, assignedTo: 'VIK02',  status: 'Pending' }
  ]
};

// ===========================
// INIT
// ===========================
window.addEventListener('DOMContentLoaded', () => {
  renderOverview();
  renderTasks();
  renderApprovals();
  renderPayday();
});

// ===========================
// LOGOUT
// ===========================
function logout() {
  sessionStorage.clear();
  window.location.href = 'login.html';
}

// ===========================
// SECTION NAVIGATION
// ===========================

/**
 * Switch the visible content section and update the active sidebar link.
 * @param {string} name - 'overview' | 'tasks' | 'approvals' | 'payday' | 'settings'
 * @param {HTMLElement} el - the clicked sidebar link element
 */
function showSection(name, el) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  el.classList.add('active');

  if (name === 'overview')  renderOverview();
  if (name === 'tasks')     renderTasks();
  if (name === 'approvals') renderApprovals();
  if (name === 'payday')    renderPayday();
}

// ===========================
// RENDER: OVERVIEW
// ===========================
function renderOverview() {
  const totalPts         = state.children.reduce((a, c) => a + c.currentPoints, 0);
  const totalSavings     = state.children.reduce((a, c) => a + c.savingsBalance, 0);
  const pendingApprovals = state.tasks.filter(t => t.status === 'Awaiting Approval').length;

  // Stat cards
  document.getElementById('family-stats').innerHTML = `
    <div class="stat-card" style="--accent:var(--green)">
      <div class="stat-label">Children</div>
      <div class="stat-value">${state.children.length}</div>
      <div class="stat-change">Active members</div>
    </div>
    <div class="stat-card" style="--accent:var(--gold)">
      <div class="stat-label">Total Points in Circulation</div>
      <div class="stat-value">${totalPts}</div>
      <div class="stat-change">≈ ₹${(totalPts * state.parent.exchangeRate).toFixed(0)}</div>
    </div>
    <div class="stat-card" style="--accent:#4FC3F7">
      <div class="stat-label">Pending Approvals</div>
      <div class="stat-value">${pendingApprovals}</div>
      <div class="stat-change">Needs your review</div>
    </div>
    <div class="stat-card" style="--accent:var(--coral)">
      <div class="stat-label">Total Savings (₹)</div>
      <div class="stat-value">₹${(totalSavings * state.parent.exchangeRate).toFixed(0)}</div>
      <div class="stat-change">Earning ${state.parent.interestRate}% interest</div>
    </div>
  `;

  // Per-child summary cards
  document.getElementById('children-cards').innerHTML = state.children.map(child => {
    const pct  = Math.min(100, Math.round((child.currentPoints / 500) * 100));
    const done = state.tasks.filter(t => t.assignedTo === child.id && t.status === 'Completed').length;
    return `
      <div class="child-card">
        <div class="child-info">
          <div class="child-avatar" style="background:linear-gradient(135deg,#7B5EA7,#4FC3F7)">
            ${child.avatar}
          </div>
          <div>
            <div class="child-name">${child.name}</div>
            <div class="child-id">ID: ${child.id}</div>
          </div>
        </div>
        <div class="points-row">
          <div>
            <div class="points-label">Current Points</div>
            <div class="points-val">${child.currentPoints} pts</div>
          </div>
          <div style="text-align:right">
            <div class="points-label">Tasks Done</div>
            <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:700;">${done}</div>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="savings-badge">
          <span>🏦</span>
          <span>Savings:</span>
          <strong>₹${(child.savingsBalance * state.parent.exchangeRate).toFixed(2)}</strong>
        </div>
      </div>`;
  }).join('');

  // Notification dot visibility
  const hasApprovals = state.tasks.some(t => t.status === 'Awaiting Approval');
  document.getElementById('notif-dot').style.display = hasApprovals ? 'block' : 'none';
}

// ===========================
// RENDER: TASKS TABLE
// ===========================
function renderTasks() {
  document.getElementById('tasks-tbody').innerHTML = state.tasks.map(task => {
    const child = state.children.find(c => c.id === task.assignedTo);
    const statusClass = {
      'Awaiting Approval': 'awaiting',
      'Completed':         'completed',
      'Pending':           'pending'
    }[task.status] || 'pending';

    return `
      <tr>
        <td><strong>${task.name}</strong></td>
        <td>${child ? child.avatar + ' ' + child.name : '—'}</td>
        <td><span style="color:var(--gold);font-weight:700;">${task.points} pts</span></td>
        <td><span class="badge badge-${statusClass}">${task.status}</span></td>
        <td>
          ${task.status === 'Awaiting Approval'
            ? `<button class="btn-sm btn-green" onclick="approveTask('${task.id}')">✓ Approve</button>`
            : ''}
          ${task.status === 'Pending'
            ? `<button class="btn-sm btn-outline" style="font-size:12px;" onclick="deleteTask('${task.id}')">✕</button>`
            : ''}
          ${task.status === 'Completed'
            ? `<span style="color:var(--green);font-size:13px;">✓ Done</span>`
            : ''}
        </td>
      </tr>`;
  }).join('');
}

// ===========================
// RENDER: APPROVALS
// ===========================
function renderApprovals() {
  const pending = state.tasks.filter(t => t.status === 'Awaiting Approval');
  const body    = document.getElementById('approvals-body');

  if (!pending.length) {
    body.innerHTML = '<div style="color:var(--slate);font-size:14px;padding:16px 0;">🎉 No pending approvals. All caught up!</div>';
    return;
  }

  body.innerHTML = pending.map(task => {
    const child = state.children.find(c => c.id === task.assignedTo);
    return `
      <div class="approval-item">
        <div class="approval-info">
          <div style="font-size:28px;">${child ? child.avatar : '👤'}</div>
          <div>
            <div class="approval-task">${task.name}</div>
            <div class="approval-child">${child ? child.name : 'Unknown'} • ${task.points} pts</div>
          </div>
        </div>
        <div class="approval-actions">
          <span class="approval-pts">+${task.points}</span>
          <button class="btn-sm btn-green" onclick="approveTask('${task.id}')">✓ Approve</button>
          <button class="btn-sm btn-coral-soft" onclick="rejectTask('${task.id}')">✕ Reject</button>
        </div>
      </div>`;
  }).join('');
}

// ===========================
// RENDER: PAYDAY SUMMARY
// ===========================
function renderPayday() {
  document.getElementById('payday-tbody').innerHTML = state.children.map(child => {
    const earned = (child.currentPoints * state.parent.exchangeRate).toFixed(2);
    return `
      <tr>
        <td>${child.avatar} <strong>${child.name}</strong></td>
        <td><span style="color:var(--gold);font-weight:700;">${child.currentPoints} pts</span></td>
        <td><span style="color:var(--green);font-weight:700;">₹${(child.savingsBalance * state.parent.exchangeRate).toFixed(2)}</span></td>
        <td style="font-weight:600;">₹${earned}</td>
      </tr>`;
  }).join('');
}

// ===========================
// TASK ACTIONS
// ===========================

/** Open the Add Task modal and populate the child select dropdown */
function openAddTask() {
  document.getElementById('task-assign-input').innerHTML =
    state.children.map(c => `<option value="${c.id}">${c.avatar} ${c.name}</option>`).join('');
  openModal('add-task-modal');
}

/**
 * Create a new task from the modal form inputs.
 * BACKEND: POST /api/tasks with { name, points, assignedTo, familyId }
 */
function addTask() {
  const name       = document.getElementById('task-name-input').value.trim();
  const pts        = parseInt(document.getElementById('task-points-input').value);
  const assignedTo = document.getElementById('task-assign-input').value;

  if (!name || !pts) return showToast('Fill in all fields!');

  state.tasks.push({ id: 't' + Date.now(), name, points: pts, assignedTo, status: 'Pending' });
  closeModal('add-task-modal');
  document.getElementById('task-name-input').value   = '';
  document.getElementById('task-points-input').value = '';
  renderTasks();
  renderOverview();
  showToast('✅ Task "' + name + '" added!');
}

/**
 * Delete a Pending task.
 * BACKEND: DELETE /api/tasks/:id
 * @param {string} id
 */
function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  renderTasks();
  renderOverview();
}

/**
 * Approve a task: mark Completed and credit points to child.
 * BACKEND: PATCH /api/tasks/:id/approve
 * @param {string} id
 */
function approveTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  task.status = 'Completed';

  const child = state.children.find(c => c.id === task.assignedTo);
  if (child) {
    child.currentPoints += task.points;
    child.history.push({
      type: 'earned', desc: task.name,
      pts: task.points, date: new Date().toLocaleDateString()
    });
  }
  renderApprovals();
  renderTasks();
  renderOverview();
  showToast('🎉 Approved! ' + (child ? child.name : '') + ' earned ' + task.points + ' pts');
}

/**
 * Reject a task: revert to Pending.
 * BACKEND: PATCH /api/tasks/:id/reject
 * @param {string} id
 */
function rejectTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (task) task.status = 'Pending';
  renderApprovals();
  renderTasks();
  showToast('❌ Task sent back to Pending');
}

// ===========================
// PAYDAY
// ===========================

/**
 * Trigger end-of-month payday:
 * - Applies compound interest to existing savings
 * - Flags paydayPending in sessionStorage so child.js picks it up on next login
 *
 * BACKEND: POST /api/payday/trigger — backend handles interest calculation,
 * resets points, and pushes a notification to the child's device.
 */
function triggerPayday() {
  state.children.forEach(child => {
    if (child.currentPoints > 0) {
      const interest = child.savingsBalance * (state.parent.interestRate / 100);
      child.savingsBalance += interest;
      child.history.push({
        type: 'interest', desc: 'Monthly Interest',
        pts: interest.toFixed(1), date: new Date().toLocaleDateString()
      });
    }
  });

  // Flag for child dashboard to pick up
  sessionStorage.setItem('paydayPending', 'true');
  renderPayday();
  renderOverview();
  showToast('💸 Payday triggered! Kids will see their settlement on login.');
}

// ===========================
// SETTINGS
// ===========================

/**
 * Update the monthly interest rate.
 * BACKEND: PATCH /api/family/settings { interestRate }
 * @param {string|number} val
 */
function updateInterestRate(val) {
  state.parent.interestRate = parseFloat(val);
  showToast('✅ Interest rate set to ' + val + '%');
}

/**
 * Add a new child account.
 * BACKEND: POST /api/children { name, id, familyId }
 */
function addChild() {
  const name = document.getElementById('new-child-name').value.trim();
  const id   = document.getElementById('new-child-id').value.trim().toUpperCase();
  if (!name || !id) return showToast('Enter both name and ID!');

  const avatars = ['🐱', '🐶', '🐸', '🦊', '🐻', '🐼'];
  state.children.push({
    id, name,
    avatar: avatars[state.children.length % avatars.length],
    currentPoints: 0, savingsBalance: 0, history: []
  });

  document.getElementById('new-child-name').value = '';
  document.getElementById('new-child-id').value   = '';
  renderOverview();
  showToast('✅ ' + name + ' added to the family!');
}

// ===========================
// MODAL HELPERS
// ===========================

function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ===========================
// TOAST
// ===========================
let toastTimer;

/**
 * Show a temporary notification toast.
 * @param {string} msg
 */
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}