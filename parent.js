/* ===========================
   EARN & LEARN — parent.js  (Enhanced)
   New features: task descriptions, deadlines/time limits,
   recurring tasks (daily/weekly/monthly), statistics, leaderboard
   =========================== */

if (sessionStorage.getItem('role') !== 'parent') {
  window.location.href = 'login.html';
}

// ===========================
// STATE
// ===========================
const state = {
  parent: { exchangeRate: 0.5, interestRate: 5 },

  children: [
    { id: 'ARIA01', name: 'Aria',   avatar: '🐱', currentPoints: 320, savingsBalance: 150, history: [] },
    { id: 'VIK02',  name: 'Vikram', avatar: '🐶', currentPoints: 180, savingsBalance: 60,  history: [] }
  ],

  // One-off tasks (with optional deadline + description)
  tasks: [
    { id: 't1', name: 'Wash Dishes',    desc: 'Use soap and wipe the counter dry.',      points: 40, assignedTo: 'ARIA01', status: 'Completed',         deadline: null,        createdAt: daysAgo(5) },
    { id: 't2', name: 'Take Out Trash', desc: 'Replace the bag after taking it out.',    points: 30, assignedTo: 'VIK02',  status: 'Awaiting Approval', deadline: todayPlus(1), createdAt: daysAgo(1) },
    { id: 't3', name: 'Mop the Floor',  desc: 'Use the blue mop and the floor cleaner.', points: 60, assignedTo: 'ARIA01', status: 'Awaiting Approval', deadline: todayPlus(0), createdAt: daysAgo(2) },
    { id: 't4', name: 'Water Plants',   desc: 'Half a can each plant.',                  points: 20, assignedTo: 'VIK02',  status: 'Pending',           deadline: todayPlus(2), createdAt: daysAgo(0) },
    { id: 't5', name: 'Make Bed',       desc: 'Straighten sheets and fluff pillows.',    points: 15, assignedTo: 'ARIA01', status: 'Pending',           deadline: todayPlus(-1),createdAt: daysAgo(0) },
    { id: 't6', name: 'Clean Bathroom', desc: 'Scrub the sink and toilet.',              points: 80, assignedTo: 'VIK02',  status: 'Pending',           deadline: todayPlus(3), createdAt: daysAgo(0) }
  ],

  // Recurring task templates
  recurringTemplates: [
    { id: 'r1', name: 'Make Bed',      desc: 'Every morning before school.',          points: 15, assignedTo: 'ARIA01', frequency: 'daily',   dueTime: '07:30', active: true, lastSpawned: daysAgo(1) },
    { id: 'r2', name: 'Vacuum Lounge', desc: 'Use the Dyson on all carpeted areas.',  points: 50, assignedTo: 'VIK02',  frequency: 'weekly',  dueTime: '18:00', active: true, lastSpawned: daysAgo(7) },
    { id: 'r3', name: 'Clean Fridge',  desc: 'Wipe shelves and throw expired items.', points: 80, assignedTo: 'ARIA01', frequency: 'monthly', dueTime: '16:00', active: true, lastSpawned: daysAgo(30) }
  ],

  // Spawned recurring instances (live copies)
  recurringInstances: []
};

// ===========================
// DATE HELPERS
// ===========================
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function todayPlus(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function isOverdue(task) {
  if (!task.deadline) return false;
  if (task.status === 'Completed') return false;
  return new Date(task.deadline) < new Date(new Date().toDateString());
}
function deadlineLabel(task) {
  if (!task.deadline) return '<span style="color:var(--slate);font-size:12px;">No deadline</span>';
  const overdue = isOverdue(task);
  const color   = overdue ? 'var(--coral)' : 'var(--green)';
  const icon    = overdue ? '⚠️' : '📅';
  return `<span style="color:${color};font-size:12px;">${icon} ${formatDate(task.deadline)}</span>`;
}
function frequencyBadge(f) {
  const map = { daily: ['🌅','#4FC3F7'], weekly: ['📆','var(--gold)'], monthly: ['📅','var(--green)'] };
  const [icon, color] = map[f] || ['?','#aaa'];
  return `<span style="background:rgba(255,255,255,0.07);border-radius:20px;padding:3px 10px;font-size:12px;color:${color};">${icon} ${f.charAt(0).toUpperCase()+f.slice(1)}</span>`;
}

// ===========================
// SPAWN RECURRING INSTANCES
// Called on init — creates Pending instances for due recurring templates
// ===========================
function spawnRecurringInstances() {
  const now = new Date();
  state.recurringTemplates.forEach(tmpl => {
    if (!tmpl.active) return;
    const last    = new Date(tmpl.lastSpawned);
    let shouldSpawn = false;

    if (tmpl.frequency === 'daily'   && diffDays(now, last) >= 1) shouldSpawn = true;
    if (tmpl.frequency === 'weekly'  && diffDays(now, last) >= 7) shouldSpawn = true;
    if (tmpl.frequency === 'monthly' && diffDays(now, last) >= 28) shouldSpawn = true;

    // Don't spawn if an active instance already exists for this template
    const existing = state.recurringInstances.find(
      i => i.templateId === tmpl.id && i.status !== 'Completed'
    );

    if (shouldSpawn && !existing) {
      state.recurringInstances.push({
        id:         'ri_' + tmpl.id + '_' + Date.now(),
        templateId: tmpl.id,
        name:       tmpl.name,
        desc:       tmpl.desc,
        points:     tmpl.points,
        assignedTo: tmpl.assignedTo,
        status:     'Pending',
        deadline:   todayPlus(tmpl.frequency === 'daily' ? 0 : tmpl.frequency === 'weekly' ? 6 : 29),
        dueTime:    tmpl.dueTime,
        createdAt:  new Date().toISOString()
      });
      tmpl.lastSpawned = new Date().toISOString();
    }
  });
}

function diffDays(a, b) {
  return Math.floor((a - b) / (1000 * 60 * 60 * 24));
}

// ===========================
// INIT
// ===========================
window.addEventListener('DOMContentLoaded', () => {
  spawnRecurringInstances();
  renderOverview();
  renderTasks();
  renderRecurring();
  renderApprovals();
  renderStatistics();
  renderPayday();
});

function logout() {
  sessionStorage.clear();
  window.location.href = 'login.html';
}

// ===========================
// SECTION NAVIGATION
// ===========================
function showSection(name, el) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  el.classList.add('active');
  const renders = {
    overview: renderOverview, tasks: renderTasks, recurring: renderRecurring,
    approvals: renderApprovals, statistics: renderStatistics, payday: renderPayday
  };
  if (renders[name]) renders[name]();
}

// ===========================
// RENDER: OVERVIEW
// ===========================
function renderOverview() {
  const allTasks     = [...state.tasks, ...state.recurringInstances];
  const totalPts     = state.children.reduce((a, c) => a + c.currentPoints, 0);
  const totalSavings = state.children.reduce((a, c) => a + c.savingsBalance, 0);
  const pending      = allTasks.filter(t => t.status === 'Awaiting Approval').length;
  const overdue      = allTasks.filter(t => isOverdue(t)).length;

  document.getElementById('family-stats').innerHTML = `
    <div class="stat-card" style="--accent:var(--green)">
      <div class="stat-label">Children</div>
      <div class="stat-value">${state.children.length}</div>
      <div class="stat-change">Active members</div>
    </div>
    <div class="stat-card" style="--accent:var(--gold)">
      <div class="stat-label">Total Points</div>
      <div class="stat-value">${totalPts}</div>
      <div class="stat-change">≈ ₹${(totalPts * state.parent.exchangeRate).toFixed(0)}</div>
    </div>
    <div class="stat-card" style="--accent:#4FC3F7">
      <div class="stat-label">Pending Approvals</div>
      <div class="stat-value">${pending}</div>
      <div class="stat-change">Needs your review</div>
    </div>
    <div class="stat-card" style="--accent:var(--coral)">
      <div class="stat-label">Overdue Tasks</div>
      <div class="stat-value" style="color:${overdue>0?'var(--coral)':'inherit'}">${overdue}</div>
      <div class="stat-change" style="color:${overdue>0?'var(--coral)':'var(--green)'};">${overdue>0?'Needs attention':'All on track'}</div>
    </div>
  `;

  document.getElementById('children-cards').innerHTML = state.children.map(child => {
    const pct       = Math.min(100, Math.round((child.currentPoints / 500) * 100));
    const myTasks   = [...state.tasks, ...state.recurringInstances].filter(t => t.assignedTo === child.id);
    const done      = myTasks.filter(t => t.status === 'Completed').length;
    const overdueCt = myTasks.filter(t => isOverdue(t)).length;
    return `
      <div class="child-card">
        <div class="child-info">
          <div class="child-avatar" style="background:linear-gradient(135deg,#7B5EA7,#4FC3F7)">${child.avatar}</div>
          <div>
            <div class="child-name">${child.name}</div>
            <div class="child-id">ID: ${child.id}</div>
          </div>
          ${overdueCt > 0 ? `<span style="margin-left:auto;background:rgba(255,107,107,0.15);color:var(--coral);font-size:11px;padding:3px 8px;border-radius:10px;">⚠️ ${overdueCt} overdue</span>` : ''}
        </div>
        <div class="points-row">
          <div><div class="points-label">Current Points</div><div class="points-val">${child.currentPoints} pts</div></div>
          <div style="text-align:right"><div class="points-label">Tasks Done</div><div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:700;">${done}</div></div>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="savings-badge"><span>🏦</span><span>Savings:</span><strong>₹${(child.savingsBalance * state.parent.exchangeRate).toFixed(2)}</strong></div>
      </div>`;
  }).join('');

  const hasApprovals = [...state.tasks, ...state.recurringInstances].some(t => t.status === 'Awaiting Approval');
  document.getElementById('notif-dot').style.display = hasApprovals ? 'block' : 'none';
}

// ===========================
// RENDER: TASK TABLE
// ===========================
function renderTasks() {
  const filter = document.getElementById('task-filter')?.value || 'all';
  let tasks = state.tasks;
  if (filter === 'Overdue') tasks = tasks.filter(t => isOverdue(t));
  else if (filter !== 'all') tasks = tasks.filter(t => t.status === filter);

  document.getElementById('tasks-tbody').innerHTML = tasks.map(task => {
    const child       = state.children.find(c => c.id === task.assignedTo);
    const statusClass = { 'Awaiting Approval':'awaiting','Completed':'completed','Pending': isOverdue(task)?'overdue':'pending' }[task.status] || 'pending';
    const statusLabel = isOverdue(task) && task.status === 'Pending' ? 'Overdue' : task.status;
    return `
      <tr>
        <td>
          <strong>${task.name}</strong>
          ${task.desc ? `<div style="font-size:11px;color:var(--slate);margin-top:2px;">${task.desc.substring(0,50)}${task.desc.length>50?'…':''}</div>` : ''}
        </td>
        <td>${child ? child.avatar + ' ' + child.name : '—'}</td>
        <td><span style="color:var(--gold);font-weight:700;">${task.points} pts</span></td>
        <td>${deadlineLabel(task)}</td>
        <td><span class="badge badge-${statusClass}">${statusLabel}</span></td>
        <td style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          <button class="btn-sm btn-outline" style="font-size:11px;padding:5px 10px;" onclick="openTaskDetail('${task.id}','oneoff')">👁</button>
          ${task.status==='Awaiting Approval' ? `<button class="btn-sm btn-green" onclick="approveTask('${task.id}','oneoff')">✓</button>` : ''}
          ${task.status==='Pending' ? `<button class="btn-sm btn-coral-soft" onclick="deleteTask('${task.id}','oneoff')">✕</button>` : ''}
          ${task.status==='Completed' ? `<span style="color:var(--green);font-size:12px;">✓ Done</span>` : ''}
        </td>
      </tr>`;
  }).join('') || `<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--slate);">No tasks found</td></tr>`;
}

// ===========================
// RENDER: RECURRING
// ===========================
function renderRecurring() {
  document.getElementById('recurring-tbody').innerHTML = state.recurringTemplates.map(tmpl => {
    const child = state.children.find(c => c.id === tmpl.assignedTo);
    return `
      <tr>
        <td>
          <strong>${tmpl.name}</strong>
          ${tmpl.desc ? `<div style="font-size:11px;color:var(--slate);margin-top:2px;">${tmpl.desc.substring(0,50)}…</div>` : ''}
        </td>
        <td>${child ? child.avatar + ' ' + child.name : '—'}</td>
        <td><span style="color:var(--gold);font-weight:700;">${tmpl.points} pts</span></td>
        <td>${frequencyBadge(tmpl.frequency)}</td>
        <td><span style="color:var(--slate);font-size:13px;">⏰ ${tmpl.dueTime || 'Anytime'}</span></td>
        <td style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn-sm ${tmpl.active?'btn-gold':'btn-outline'}" style="font-size:11px;padding:5px 10px;" onclick="toggleRecurring('${tmpl.id}')">${tmpl.active?'⏸ Pause':'▶ Resume'}</button>
          <button class="btn-sm btn-coral-soft" style="font-size:11px;padding:5px 10px;" onclick="deleteRecurringTemplate('${tmpl.id}')">✕</button>
        </td>
      </tr>`;
  }).join('') || `<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--slate);">No recurring templates yet</td></tr>`;

  document.getElementById('recurring-instances-tbody').innerHTML = state.recurringInstances.map(inst => {
    const child       = state.children.find(c => c.id === inst.assignedTo);
    const statusClass = { 'Awaiting Approval':'awaiting','Completed':'completed','Pending': isOverdue(inst)?'overdue':'pending' }[inst.status] || 'pending';
    const statusLabel = isOverdue(inst) && inst.status==='Pending' ? 'Overdue' : inst.status;
    return `
      <tr>
        <td><strong>${inst.name}</strong><div style="font-size:11px;color:#4FC3F7;">🔁 Recurring</div></td>
        <td>${child ? child.avatar + ' ' + child.name : '—'}</td>
        <td><span style="color:var(--gold);font-weight:700;">${inst.points} pts</span></td>
        <td>${deadlineLabel(inst)}</td>
        <td><span class="badge badge-${statusClass}">${statusLabel}</span></td>
        <td style="display:flex;gap:6px;flex-wrap:wrap;">
          ${inst.status==='Awaiting Approval' ? `<button class="btn-sm btn-green" onclick="approveTask('${inst.id}','recurring')">✓ Approve</button>` : ''}
          ${inst.status==='Pending' ? `<button class="btn-sm btn-coral-soft" onclick="deleteTask('${inst.id}','recurring')">✕</button>` : ''}
          ${inst.status==='Completed' ? `<span style="color:var(--green);font-size:12px;">✓ Done</span>` : ''}
        </td>
      </tr>`;
  }).join('') || `<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--slate);">No active instances yet</td></tr>`;
}

// ===========================
// RENDER: APPROVALS
// ===========================
function renderApprovals() {
  const allTasks = [...state.tasks, ...state.recurringInstances];
  const pending  = allTasks.filter(t => t.status === 'Awaiting Approval');
  const body     = document.getElementById('approvals-body');

  if (!pending.length) {
    body.innerHTML = '<div style="color:var(--slate);font-size:14px;padding:16px 0;">🎉 No pending approvals. All caught up!</div>';
    return;
  }

  body.innerHTML = pending.map(task => {
    const child      = state.children.find(c => c.id === task.assignedTo);
    const isRecurring= !!task.templateId;
    return `
      <div class="approval-item">
        <div class="approval-info">
          <div style="font-size:28px;">${child ? child.avatar : '👤'}</div>
          <div>
            <div class="approval-task">${task.name} ${isRecurring ? '<span style="font-size:11px;color:#4FC3F7;">🔁</span>' : ''}</div>
            <div class="approval-child">${child ? child.name : 'Unknown'} • ${task.points} pts${task.desc ? ' — ' + task.desc.substring(0,40) + '…' : ''}</div>
          </div>
        </div>
        <div class="approval-actions">
          <span class="approval-pts">+${task.points}</span>
          <button class="btn-sm btn-green" onclick="approveTask('${task.id}','${isRecurring?'recurring':'oneoff'}')">✓ Approve</button>
          <button class="btn-sm btn-coral-soft" onclick="rejectTask('${task.id}','${isRecurring?'recurring':'oneoff'}')">✕ Reject</button>
        </div>
      </div>`;
  }).join('');
}

// ===========================
// RENDER: STATISTICS
// ===========================
function renderStatistics() {
  const allTasks = [...state.tasks, ...state.recurringInstances];

  // Leaderboard
  const ranked = [...state.children].map(c => ({
    ...c,
    totalEarned: allTasks.filter(t => t.assignedTo === c.id && t.status === 'Completed')
                         .reduce((sum, t) => sum + t.points, 0),
    tasksDone:   allTasks.filter(t => t.assignedTo === c.id && t.status === 'Completed').length,
    overdue:     allTasks.filter(t => t.assignedTo === c.id && isOverdue(t)).length
  })).sort((a, b) => b.totalEarned - a.totalEarned);

  const medals = ['🥇','🥈','🥉'];
  document.getElementById('leaderboard').innerHTML = ranked.map((c, i) => `
    <div class="leaderboard-row" style="animation-delay:${i*0.1}s">
      <div class="lb-rank">${medals[i] || (i+1)}</div>
      <div class="lb-avatar">${c.avatar}</div>
      <div class="lb-info">
        <div class="lb-name">${c.name}</div>
        <div class="lb-sub">${c.tasksDone} tasks completed • ${c.overdue} overdue</div>
      </div>
      <div class="lb-score">
        <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:var(--gold);">${c.totalEarned}</div>
        <div style="font-size:11px;color:var(--slate);">pts earned</div>
      </div>
      <div class="lb-bar-wrap">
        <div class="lb-bar" style="width:${ranked[0].totalEarned>0?Math.round(c.totalEarned/ranked[0].totalEarned*100):0}%"></div>
      </div>
    </div>`).join('');

  // Per-child stat cards
  document.getElementById('stat-cards').innerHTML = state.children.map(child => {
    const myTasks    = allTasks.filter(t => t.assignedTo === child.id);
    const done       = myTasks.filter(t => t.status === 'Completed').length;
    const total      = myTasks.length;
    const rate       = total > 0 ? Math.round(done/total*100) : 0;
    const overdueCt  = myTasks.filter(t => isOverdue(t)).length;
    const earned     = myTasks.filter(t => t.status === 'Completed').reduce((s, t) => s + t.points, 0);
    return `
      <div class="child-card">
        <div class="child-info">
          <div class="child-avatar" style="background:linear-gradient(135deg,#7B5EA7,#4FC3F7)">${child.avatar}</div>
          <div><div class="child-name">${child.name}</div><div class="child-id">ID: ${child.id}</div></div>
        </div>
        <div class="stat-row-sm"><span>✅ Completion Rate</span><strong style="color:var(--green)">${rate}%</strong></div>
        <div class="stat-row-sm"><span>🏆 Points Earned</span><strong style="color:var(--gold)">${earned} pts</strong></div>
        <div class="stat-row-sm"><span>💰 Savings</span><strong style="color:var(--green)">₹${(child.savingsBalance*state.parent.exchangeRate).toFixed(2)}</strong></div>
        <div class="stat-row-sm"><span>⚠️ Overdue</span><strong style="color:${overdueCt>0?'var(--coral)':'var(--green)'}">${overdueCt}</strong></div>
        <div class="progress-bar" style="margin-top:10px;"><div class="progress-fill" style="width:${rate}%"></div></div>
      </div>`;
  }).join('');

  // Task completion breakdown
  const allPending   = allTasks.filter(t => t.status === 'Pending').length;
  const allAwaiting  = allTasks.filter(t => t.status === 'Awaiting Approval').length;
  const allCompleted = allTasks.filter(t => t.status === 'Completed').length;
  const allOverdue   = allTasks.filter(t => isOverdue(t)).length;
  const totalCt      = allTasks.length;

  document.getElementById('task-breakdown').innerHTML = [
    { label: 'Completed', count: allCompleted, color: 'var(--green)',  icon: '✅' },
    { label: 'Pending',   count: allPending,   color: 'var(--gold)',   icon: '⏳' },
    { label: 'Awaiting',  count: allAwaiting,  color: '#4FC3F7',       icon: '🔔' },
    { label: 'Overdue',   count: allOverdue,   color: 'var(--coral)',  icon: '⚠️' }
  ].map(s => {
    const pct = totalCt > 0 ? Math.round(s.count / totalCt * 100) : 0;
    return `
      <div style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px;">
          <span>${s.icon} ${s.label}</span>
          <strong style="color:${s.color}">${s.count} (${pct}%)</strong>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${s.color};"></div></div>
      </div>`;
  }).join('');

  // Overdue list
  const overdueList = allTasks.filter(t => isOverdue(t));
  document.getElementById('overdue-list').innerHTML = overdueList.length
    ? overdueList.map(t => {
        const child = state.children.find(c => c.id === t.assignedTo);
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
          <div>
            <div style="font-size:14px;font-weight:600;">${t.name}</div>
            <div style="font-size:12px;color:var(--slate);">${child?child.name:'?'} • Due ${formatDate(t.deadline)}</div>
          </div>
          <span class="badge badge-overdue">Overdue</span>
        </div>`;
      }).join('')
    : '<div style="color:var(--slate);font-size:14px;padding:12px 0;">🎉 No overdue tasks!</div>';

  // Activity timeline (last 7 days mock)
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today = new Date().getDay();
  const timeline = Array.from({length:7}, (_,i) => {
    const dayIdx = (today - 6 + i + 7) % 7;
    const count  = [1,3,2,4,1,5,allCompleted][i] || 0;
    return { day: days[dayIdx], count };
  });
  const maxCt = Math.max(...timeline.map(t => t.count), 1);
  document.getElementById('activity-timeline').innerHTML = `
    <div style="display:flex;align-items:flex-end;gap:10px;height:100px;padding:10px 0;">
      ${timeline.map(t => `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;">
          <div style="font-size:11px;color:var(--green);font-weight:700;">${t.count}</div>
          <div style="width:100%;background:linear-gradient(180deg,var(--green),var(--gold));border-radius:4px 4px 0 0;height:${Math.round(t.count/maxCt*70)}px;min-height:4px;"></div>
          <div style="font-size:11px;color:var(--slate);">${t.day}</div>
        </div>`).join('')}
    </div>`;
}

// ===========================
// RENDER: PAYDAY
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
// TASK ACTIONS (one-off)
// ===========================
function openAddTask() {
  document.getElementById('task-assign-input').innerHTML =
    state.children.map(c => `<option value="${c.id}">${c.avatar} ${c.name}</option>`).join('');
  // Set default deadline to tomorrow
  const tmr = new Date(); tmr.setDate(tmr.getDate()+1);
  document.getElementById('task-deadline-input').value = tmr.toISOString().split('T')[0];
  openModal('add-task-modal');
}

function addTask() {
  const name     = document.getElementById('task-name-input').value.trim();
  const desc     = document.getElementById('task-desc-input').value.trim();
  const pts      = parseInt(document.getElementById('task-points-input').value);
  const assigned = document.getElementById('task-assign-input').value;
  const deadline = document.getElementById('task-deadline-input').value;
  const time     = document.getElementById('task-time-input').value;

  if (!name || !pts) return showToast('Task name and points are required!');

  let fullDeadline = deadline || null;
  if (deadline && time) fullDeadline = deadline + 'T' + time;

  state.tasks.push({
    id: 't' + Date.now(), name, desc, points: pts, assignedTo: assigned,
    status: 'Pending', deadline: fullDeadline, createdAt: new Date().toISOString()
  });

  closeModal('add-task-modal');
  ['task-name-input','task-desc-input','task-points-input','task-deadline-input','task-time-input']
    .forEach(id => document.getElementById(id).value = '');
  renderTasks(); renderOverview(); renderStatistics();
  showToast('✅ Task "' + name + '" created!');
}

// ===========================
// RECURRING TASK ACTIONS
// ===========================
function openAddRecurring() {
  document.getElementById('rec-assign-input').innerHTML =
    state.children.map(c => `<option value="${c.id}">${c.avatar} ${c.name}</option>`).join('');
  openModal('add-recurring-modal');
}

function addRecurringTask() {
  const name  = document.getElementById('rec-name-input').value.trim();
  const desc  = document.getElementById('rec-desc-input').value.trim();
  const pts   = parseInt(document.getElementById('rec-points-input').value);
  const to    = document.getElementById('rec-assign-input').value;
  const freq  = document.getElementById('rec-frequency-input').value;
  const time  = document.getElementById('rec-time-input').value;

  if (!name || !pts) return showToast('Name and points are required!');

  const tmpl = {
    id: 'r' + Date.now(), name, desc, points: pts, assignedTo: to,
    frequency: freq, dueTime: time, active: true,
    lastSpawned: new Date(0).toISOString() // force spawn immediately
  };
  state.recurringTemplates.push(tmpl);

  closeModal('add-recurring-modal');
  ['rec-name-input','rec-desc-input','rec-points-input'].forEach(id => document.getElementById(id).value = '');

  spawnRecurringInstances();
  renderRecurring(); renderOverview(); renderStatistics();
  showToast('🔁 Recurring task "' + name + '" created!');
}

function toggleRecurring(id) {
  const tmpl = state.recurringTemplates.find(r => r.id === id);
  if (tmpl) { tmpl.active = !tmpl.active; renderRecurring(); showToast(tmpl.active ? '▶ Resumed' : '⏸ Paused'); }
}

function deleteRecurringTemplate(id) {
  state.recurringTemplates = state.recurringTemplates.filter(r => r.id !== id);
  state.recurringInstances = state.recurringInstances.filter(i => i.templateId !== id);
  renderRecurring(); renderOverview(); renderStatistics();
  showToast('🗑 Recurring task deleted');
}

// ===========================
// APPROVE / REJECT / DELETE
// ===========================
function approveTask(id, pool) {
  const list = pool === 'recurring' ? state.recurringInstances : state.tasks;
  const task = list.find(t => t.id === id);
  if (!task) return;
  task.status = 'Completed';

  const child = state.children.find(c => c.id === task.assignedTo);
  if (child) {
    child.currentPoints += task.points;
    child.history.push({ type:'earned', desc: task.name, pts: task.points, date: new Date().toLocaleDateString() });
  }

  // If it's a recurring instance, spawn the next one
  if (pool === 'recurring') {
    const tmpl = state.recurringTemplates.find(r => r.id === task.templateId);
    if (tmpl) { tmpl.lastSpawned = new Date().toISOString(); spawnRecurringInstances(); }
  }

  renderApprovals(); renderTasks(); renderRecurring(); renderOverview(); renderStatistics();
  showToast('🎉 Approved! ' + (child?child.name:'') + ' earned ' + task.points + ' pts');
}

function rejectTask(id, pool) {
  const list = pool === 'recurring' ? state.recurringInstances : state.tasks;
  const task = list.find(t => t.id === id);
  if (task) task.status = 'Pending';
  renderApprovals(); renderTasks(); renderRecurring();
  showToast('❌ Task sent back to Pending');
}

function deleteTask(id, pool) {
  if (pool === 'recurring') state.recurringInstances = state.recurringInstances.filter(t => t.id !== id);
  else                      state.tasks = state.tasks.filter(t => t.id !== id);
  renderTasks(); renderRecurring(); renderOverview(); renderStatistics();
}

// ===========================
// TASK DETAIL MODAL
// ===========================
function openTaskDetail(id, pool) {
  const list = pool === 'recurring' ? state.recurringInstances : state.tasks;
  const task = list.find(t => t.id === id);
  if (!task) return;
  const child = state.children.find(c => c.id === task.assignedTo);
  document.getElementById('detail-title').textContent = task.name;
  document.getElementById('detail-body').innerHTML = `
    ${task.desc ? `<div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:14px;margin-bottom:16px;font-size:14px;color:var(--slate);line-height:1.6;">${task.desc}</div>` : ''}
    <div class="detail-grid">
      <div class="detail-item"><div class="detail-label">Assigned To</div><div class="detail-val">${child?child.avatar+' '+child.name:'—'}</div></div>
      <div class="detail-item"><div class="detail-label">Points</div><div class="detail-val" style="color:var(--gold)">${task.points} pts</div></div>
      <div class="detail-item"><div class="detail-label">Status</div><div class="detail-val">${task.status}</div></div>
      <div class="detail-item"><div class="detail-label">Deadline</div><div class="detail-val">${formatDate(task.deadline)}</div></div>
      <div class="detail-item"><div class="detail-label">Created</div><div class="detail-val">${formatDate(task.createdAt)}</div></div>
      ${task.templateId ? `<div class="detail-item"><div class="detail-label">Type</div><div class="detail-val" style="color:#4FC3F7">🔁 Recurring</div></div>` : ''}
    </div>`;
  openModal('task-detail-modal');
}

// ===========================
// PAYDAY
// ===========================
function triggerPayday() {
  state.children.forEach(child => {
    if (child.currentPoints > 0) {
      const interest = child.savingsBalance * (state.parent.interestRate / 100);
      child.savingsBalance += interest;
      child.history.push({ type:'interest', desc:'Monthly Interest', pts:interest.toFixed(1), date:new Date().toLocaleDateString() });
    }
  });
  sessionStorage.setItem('paydayPending','true');
  renderPayday(); renderOverview();
  showToast('💸 Payday triggered! Kids will see their settlement on next login.');
}

// ===========================
// SETTINGS
// ===========================
function updateInterestRate(val) { state.parent.interestRate = parseFloat(val); showToast('✅ Interest rate set to '+val+'%'); }

function addChild() {
  const name = document.getElementById('new-child-name').value.trim();
  const id   = document.getElementById('new-child-id').value.trim().toUpperCase();
  if (!name || !id) return showToast('Enter both name and ID!');
  const avatars = ['🐱','🐶','🐸','🦊','🐻','🐼'];
  state.children.push({ id, name, avatar: avatars[state.children.length%avatars.length], currentPoints:0, savingsBalance:0, history:[] });
  document.getElementById('new-child-name').value = '';
  document.getElementById('new-child-id').value   = '';
  renderOverview(); renderStatistics();
  showToast('✅ '+name+' added!');
}

// ===========================
// MODAL / TOAST HELPERS
// ===========================
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
});

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}