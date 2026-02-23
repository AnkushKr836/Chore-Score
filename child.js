/* ===========================
   EARN & LEARN — child.js
   Child dashboard logic.

   BACKEND INTEGRATION NOTE:
   Data is currently hardcoded. Replace with API fetch() calls.
   See backend-api-guide.txt for full endpoint reference.
   =========================== */

// ===========================
// GUARD: redirect if not logged in as kid
// ===========================
const sessionRole    = sessionStorage.getItem('role');
const sessionChildId = sessionStorage.getItem('childId');

if (sessionRole !== 'kid' || !sessionChildId) {
  window.location.href = 'login.html';
}

// ===========================
// SHARED STATE
// In production this data is fetched from the backend API.
// See backend-api-guide.txt §3.
// ===========================
const state = {
  parent: {
    exchangeRate: 0.5,  // ₹ per point — fetch from GET /api/family/settings
    interestRate: 5     // % per month
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
  ],

  // The logged-in child's ID (set from session)
  currentKidId: sessionChildId
};

// ===========================
// INIT
// ===========================
window.addEventListener('DOMContentLoaded', () => {
  renderKidDashboard();

  // Show payday modal if parent triggered payday
  if (sessionStorage.getItem('paydayPending') === 'true') {
    setTimeout(openKidPayday, 900);
  }
});

// ===========================
// LOGOUT
// ===========================
function logout() {
  sessionStorage.clear();
  window.location.href = 'login.html';
}

// ===========================
// RENDER DASHBOARD
// ===========================

/**
 * Render the full child dashboard for the logged-in child.
 * BACKEND: Replace state lookup with GET /api/children/:id and
 * GET /api/tasks?assignedTo=:id — see backend-api-guide.txt §3.
 */
function renderKidDashboard() {
  const child = state.children.find(c => c.id === state.currentKidId);
  if (!child) {
    document.body.innerHTML = '<p style="padding:40px;font-size:18px;">Child not found. <a href="login.html">Log in again</a></p>';
    return;
  }

  // Topbar & hero
  document.getElementById('kid-hero-title').textContent     = 'Hey ' + child.name + '! ' + child.avatar;
  document.getElementById('kid-id-display').textContent     = child.id;
  document.getElementById('kid-points-display').textContent = child.currentPoints;

  // Bank widget
  document.getElementById('kid-savings-display').textContent =
    '₹' + (child.savingsBalance * state.parent.exchangeRate).toFixed(2);
  document.getElementById('kid-rate-display').textContent =
    '+' + state.parent.interestRate + '% Monthly Interest';
  document.getElementById('modal-interest-rate').textContent = state.parent.interestRate;

  // Task list
  const myTasks       = state.tasks.filter(t => t.assignedTo === child.id);
  const taskContainer = document.getElementById('kid-tasks-list');

  if (!myTasks.length) {
    taskContainer.innerHTML =
      '<div style="color:#aaa;text-align:center;padding:20px;font-size:15px;">No tasks assigned yet! 🎉</div>';
  } else {
    taskContainer.innerHTML = myTasks.map(task => {
      const isDone = task.status === 'Awaiting Approval' || task.status === 'Completed';
      const note   = isDone
        ? (task.status === 'Awaiting Approval' ? '⏳ Waiting for parent approval' : '✅ Completed!')
        : 'Tap to mark done';

      return `
        <div class="kid-task ${isDone ? 'done' : ''}" onclick="kidCompleteTask('${task.id}')">
          <div class="kid-task-check">${isDone ? '✓' : ''}</div>
          <div style="flex:1">
            <div class="kid-task-name">${task.name}</div>
            <div class="kid-task-note">${note}</div>
          </div>
          <div class="kid-task-pts">+${task.points} ⭐</div>
        </div>`;
    }).join('');
  }

  // Progress circle
  const total = myTasks.length;
  const done  = myTasks.filter(t => t.status === 'Completed').length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  document.getElementById('kid-progress-circle').style.setProperty('--pct', pct + '%');
  document.getElementById('kid-progress-num').textContent = done + '/' + total;
  document.getElementById('kid-streak-label').textContent =
    pct === 100 ? '🏆 All done! You\'re a legend!' :
    pct > 50    ? '🔥 More than halfway there!'    : 'Keep going — you got this!';

  // History (last 5, newest first)
  const hist   = child.history.slice(-5).reverse();
  const histEl = document.getElementById('kid-history-list');

  if (!hist.length) {
    histEl.innerHTML = '<div style="text-align:center;padding:12px;color:#aaa;">No history yet</div>';
  } else {
    histEl.innerHTML = hist.map(h => {
      const icon      = h.type === 'earned' ? '✅' : h.type === 'interest' ? '💰' : '🏦';
      const isNeg     = h.type === 'cashout';
      const amtClass  = isNeg ? 'negative' : 'positive';
      const sign      = isNeg ? '−' : '+';
      const unit      = h.type === 'earned' ? 'pts' : '₹';

      return `
        <div class="history-item">
          <span>${icon} ${h.desc} <span style="color:#bbb;font-size:11px;">${h.date}</span></span>
          <span class="history-amount ${amtClass}">${sign}${h.pts} ${unit}</span>
        </div>`;
    }).join('');
  }
}

// ===========================
// TASK INTERACTION
// ===========================

/**
 * Mark a task as "Awaiting Approval" when the kid taps it.
 * BACKEND: PATCH /api/tasks/:id { status: 'Awaiting Approval' }
 * @param {string} taskId
 */
function kidCompleteTask(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task || task.status !== 'Pending') return;

  task.status = 'Awaiting Approval';
  renderKidDashboard();
  showToast('⏳ Submitted! Waiting for parent approval.');
}

// ===========================
// PAYDAY MODAL
// ===========================

/**
 * Open the payday settlement modal for the logged-in child.
 * Called automatically on login if sessionStorage.paydayPending === 'true'.
 */
function openKidPayday() {
  const child = state.children.find(c => c.id === state.currentKidId);
  if (!child || child.currentPoints === 0) return;

  document.getElementById('kid-payday-points').textContent =
    child.currentPoints + ' pts';
  document.getElementById('kid-payday-value').textContent  =
    '= ₹' + (child.currentPoints * state.parent.exchangeRate).toFixed(2);
  document.getElementById('modal-interest-rate').textContent =
    state.parent.interestRate;

  openModal('kid-payday-overlay');
}

/**
 * Handle the kid's payday choice (cash out or save to bank).
 * BACKEND: POST /api/payday/settle { childId, choice: 'cashout'|'save' }
 * @param {'cashout'|'save'} choice
 */
function kidPaydayChoice(choice) {
  const child = state.children.find(c => c.id === state.currentKidId);
  if (!child) return;

  const earned = child.currentPoints * state.parent.exchangeRate;

  if (choice === 'cashout') {
    child.history.push({
      type: 'cashout',
      desc: 'Cashed Out',
      pts:  earned.toFixed(2),
      date: new Date().toLocaleDateString()
    });
    child.currentPoints = 0;
    closeModal('kid-payday-overlay');
    showToast('💵 Cashed out ₹' + earned.toFixed(2) + '! Ask your parents for it!');

  } else {
    child.savingsBalance += child.currentPoints;
    child.history.push({
      type: 'saved',
      desc: 'Sent to Bank',
      pts:  earned.toFixed(2),
      date: new Date().toLocaleDateString()
    });
    child.currentPoints = 0;
    closeModal('kid-payday-overlay');
    showToast('🏦 Saved! Your money will earn ' + state.parent.interestRate + '% interest!');
  }

  // Clear the payday flag
  sessionStorage.removeItem('paydayPending');
  renderKidDashboard();
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