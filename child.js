/* ===========================
   EARN & LEARN — child.js  (Enhanced)
   Features: task descriptions, deadlines + countdown timers,
   recurring task view, achievements, stats, family leaderboard
   =========================== */

const sessionRole    = sessionStorage.getItem('role');
const sessionChildId = sessionStorage.getItem('childId');
if (sessionRole !== 'kid' || !sessionChildId) window.location.href = 'login.html';

// ===========================
// STATE  (mirrors parent.js — in production, fetch from API)
// ===========================
const state = {
  parent: { exchangeRate: 0.5, interestRate: 5 },

  children: [
    { id: 'ARIA01', name: 'Aria',   avatar: '🐱', currentPoints: 320, savingsBalance: 150, history: [] },
    { id: 'VIK02',  name: 'Vikram', avatar: '🐶', currentPoints: 180, savingsBalance: 60,  history: [] }
  ],

  tasks: [
    { id:'t1', name:'Wash Dishes',    desc:'Use soap and wipe the counter dry.',       points:40, assignedTo:'ARIA01', status:'Completed',          deadline: todayPlus(0),  createdAt: daysAgo(5)  },
    { id:'t2', name:'Take Out Trash', desc:'Replace the bag after taking it out.',     points:30, assignedTo:'VIK02',  status:'Awaiting Approval',  deadline: todayPlus(1),  createdAt: daysAgo(1)  },
    { id:'t3', name:'Mop the Floor',  desc:'Use the blue mop and the floor cleaner.',  points:60, assignedTo:'ARIA01', status:'Awaiting Approval',  deadline: todayPlus(0),  createdAt: daysAgo(2)  },
    { id:'t4', name:'Water Plants',   desc:'Half a watering can per plant.',            points:20, assignedTo:'VIK02',  status:'Pending',            deadline: todayPlus(2),  createdAt: daysAgo(0)  },
    { id:'t5', name:'Make Bed',       desc:'Straighten sheets and fluff pillows.',     points:15, assignedTo:'ARIA01', status:'Pending',            deadline: todayPlus(-1), createdAt: daysAgo(0)  },
    { id:'t6', name:'Clean Bathroom', desc:'Scrub the sink, mirror and toilet.',       points:80, assignedTo:'VIK02',  status:'Pending',            deadline: todayPlus(3),  createdAt: daysAgo(0)  }
  ],

  recurringTemplates: [
    { id:'r1', name:'Make Bed',      desc:'Every morning before school.',         points:15, assignedTo:'ARIA01', frequency:'daily',   dueTime:'07:30', active:true, lastSpawned: daysAgo(1)  },
    { id:'r2', name:'Vacuum Lounge', desc:'Use the Dyson on all carpeted areas.',  points:50, assignedTo:'VIK02',  frequency:'weekly',  dueTime:'18:00', active:true, lastSpawned: daysAgo(7)  },
    { id:'r3', name:'Clean Fridge',  desc:'Wipe shelves and toss expired items.',  points:80, assignedTo:'ARIA01', frequency:'monthly', dueTime:'16:00', active:true, lastSpawned: daysAgo(30) }
  ],

  recurringInstances: [],
  currentKidId: sessionChildId,
  detailTaskId:  null,
  detailPool:    null
};

// ===========================
// DATE HELPERS
// ===========================
function daysAgo(n)  { const d=new Date(); d.setDate(d.getDate()-n); return d.toISOString(); }
function todayPlus(n){ const d=new Date(); d.setDate(d.getDate()+n); return d.toISOString().split('T')[0]; }
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
}
function isOverdue(task) {
  if (!task.deadline || task.status === 'Completed') return false;
  return new Date(task.deadline) < new Date(new Date().toDateString());
}
function deadlineCountdown(task) {
  if (!task.deadline) return null;
  const diff = Math.ceil((new Date(task.deadline) - new Date(new Date().toDateString())) / 86400000);
  if (diff < 0)  return { label: `${Math.abs(diff)}d overdue`, cls: 'dl-overdue' };
  if (diff === 0) return { label: 'Due today!',  cls: 'dl-today'  };
  if (diff === 1) return { label: 'Due tomorrow', cls: 'dl-soon'   };
  return         { label: `${diff} days left`,  cls: 'dl-ok'     };
}

// ===========================
// SPAWN RECURRING INSTANCES
// ===========================
function spawnRecurringInstances() {
  const now = new Date();
  state.recurringTemplates.forEach(tmpl => {
    if (!tmpl.active) return;
    const last = new Date(tmpl.lastSpawned);
    const diff = Math.floor((now - last) / 86400000);
    const thresholds = { daily:1, weekly:7, monthly:28 };
    if (diff < thresholds[tmpl.frequency]) return;
    const exists = state.recurringInstances.find(i => i.templateId===tmpl.id && i.status!=='Completed');
    if (exists) return;
    state.recurringInstances.push({
      id: 'ri_'+tmpl.id+'_'+Date.now(),
      templateId: tmpl.id,
      name: tmpl.name, desc: tmpl.desc, points: tmpl.points,
      assignedTo: tmpl.assignedTo, status: 'Pending',
      deadline: todayPlus(tmpl.frequency==='daily'?0:tmpl.frequency==='weekly'?6:29),
      dueTime: tmpl.dueTime, createdAt: now.toISOString()
    });
    tmpl.lastSpawned = now.toISOString();
  });
}

// ===========================
// ACHIEVEMENT ENGINE
// ===========================
const ACHIEVEMENTS = [
  { id:'first_task',  icon:'🌱', label:'First Step',       desc:'Complete your very first task',            check: (c,t) => t.filter(x=>x.status==='Completed').length >= 1  },
  { id:'five_tasks',  icon:'⭐', label:'Task Star',         desc:'Complete 5 tasks',                         check: (c,t) => t.filter(x=>x.status==='Completed').length >= 5  },
  { id:'saver',       icon:'🏦', label:'Little Saver',      desc:'Save at least 50 points to the bank',      check: (c)   => c.savingsBalance >= 50 },
  { id:'big_saver',   icon:'💰', label:'Money Mogul',       desc:'Accumulate 200+ points in savings',        check: (c)   => c.savingsBalance >= 200 },
  { id:'point_club',  icon:'🎯', label:'Point Club',        desc:'Earn 100 points in a single session',      check: (c)   => c.currentPoints >= 100 },
  { id:'speed_demon', icon:'⚡', label:'Speed Demon',       desc:'Submit a task before its deadline',        check: (c,t) => t.some(x=>x.status!=='Pending' && x.deadline && !isOverdue(x)) },
  { id:'on_time',     icon:'⏰', label:'Always On Time',    desc:'Have zero overdue tasks',                  check: (c,t) => t.length > 0 && t.every(x=>!isOverdue(x)) },
  { id:'clean_sweep', icon:'🏆', label:'Clean Sweep',       desc:'Complete every assigned task',             check: (c,t) => t.length >= 3 && t.every(x=>x.status==='Completed') }
];

function getUnlockedAchievements(child, tasks) {
  return ACHIEVEMENTS.map(a => ({ ...a, unlocked: a.check(child, tasks) }));
}

// ===========================
// INIT
// ===========================
window.addEventListener('DOMContentLoaded', () => {
  spawnRecurringInstances();
  renderAll();
  if (sessionStorage.getItem('paydayPending') === 'true') setTimeout(openKidPayday, 900);

  // Live deadline countdown ticker — refreshes every minute
  setInterval(() => {
    const activeTab = document.querySelector('.kid-tab-panel.active');
    if (activeTab && activeTab.id === 'tab-tasks') renderTaskTab();
    if (activeTab && activeTab.id === 'tab-recurring') renderRecurringTab();
  }, 60000);
});

function logout() { sessionStorage.clear(); window.location.href = 'login.html'; }

function renderAll() {
  const child = state.children.find(c => c.id === state.currentKidId);
  if (!child) {
    document.body.innerHTML = '<p style="padding:40px;font-size:18px;">Child not found. <a href="login.html">Log in again</a></p>';
    return;
  }
  // Header
  document.getElementById('kid-hero-title').textContent     = 'Hey ' + child.name + '! ' + child.avatar;
  document.getElementById('kid-id-display').textContent     = child.id;
  document.getElementById('kid-points-display').textContent = child.currentPoints;
  document.getElementById('kid-savings-display').textContent = '₹' + (child.savingsBalance * state.parent.exchangeRate).toFixed(2);
  document.getElementById('kid-rate-display').textContent   = '+' + state.parent.interestRate + '% Monthly Interest';
  document.getElementById('modal-interest-rate').textContent = state.parent.interestRate;

  renderTaskTab();
  renderRecurringTab();
  renderStatsTab();
}

// ===========================
// TAB SWITCHER
// ===========================
function switchTab(name, el) {
  document.querySelectorAll('.kid-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.kid-tab-panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
}

// ===========================
// TASKS TAB
// ===========================
function renderTaskTab() {
  const child   = state.children.find(c => c.id === state.currentKidId);
  const myTasks = state.tasks.filter(t => t.assignedTo === child.id);
  const el      = document.getElementById('kid-tasks-list');

  if (!myTasks.length) {
    el.innerHTML = '<div style="color:#aaa;text-align:center;padding:24px;">No tasks assigned yet 🎉</div>';
  } else {
    // Sort: Pending first, then Awaiting, then Completed
    const sorted = [...myTasks].sort((a,b) => {
      const order = { 'Pending':0,'Awaiting Approval':1,'Completed':2 };
      return (order[a.status]||0) - (order[b.status]||0);
    });
    el.innerHTML = sorted.map(task => {
      const isDone    = task.status === 'Awaiting Approval' || task.status === 'Completed';
      const overdue   = isOverdue(task);
      const cd        = deadlineCountdown(task);
      const statusNote = isDone
        ? (task.status === 'Awaiting Approval' ? '⏳ Waiting for parent approval' : '✅ Completed!')
        : overdue ? '⚠️ Overdue — submit now!' : 'Tap to view & mark done';

      return `
        <div class="kid-task ${isDone?'done':''} ${overdue&&!isDone?'overdue-task':''}" onclick="openTaskDetail('${task.id}','oneoff')">
          <div class="kid-task-check">${isDone?'✓':overdue?'!':''}</div>
          <div style="flex:1;min-width:0;">
            <div class="kid-task-name">${task.name}</div>
            <div class="kid-task-note">${statusNote}</div>
            ${task.desc ? `<div class="kid-task-desc">${task.desc.substring(0,60)}${task.desc.length>60?'…':''}</div>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;">
            <div class="kid-task-pts">+${task.points} ⭐</div>
            ${cd ? `<div class="deadline-pill ${cd.cls}">${cd.label}</div>` : ''}
          </div>
        </div>`;
    }).join('');
  }

  // Progress circle
  const total = myTasks.length;
  const done  = myTasks.filter(t => t.status === 'Completed').length;
  const pct   = total > 0 ? Math.round(done/total*100) : 0;
  document.getElementById('kid-progress-circle').style.setProperty('--pct', pct + '%');
  document.getElementById('kid-progress-num').textContent = done + '/' + total;
  document.getElementById('kid-streak-label').textContent =
    pct === 100 ? '🏆 All done! Legend!' : pct > 50 ? '🔥 More than halfway!' : 'Keep going! 💪';
}

// ===========================
// RECURRING TAB
// ===========================
function renderRecurringTab() {
  const child  = state.children.find(c => c.id === state.currentKidId);
  const myInst = state.recurringInstances.filter(i => i.assignedTo === child.id);
  const myTmpl = state.recurringTemplates.filter(t => t.assignedTo === child.id);
  const el     = document.getElementById('kid-recurring-list');

  if (!myTmpl.length && !myInst.length) {
    el.innerHTML = '<div style="color:#aaa;text-align:center;padding:24px;">No recurring tasks set yet 🎉</div>';
    return;
  }

  const freqIcon = { daily:'🌅', weekly:'📆', monthly:'📅' };
  el.innerHTML = myTmpl.map(tmpl => {
    const instance  = myInst.find(i => i.templateId === tmpl.id && i.status !== 'Completed');
    const cd        = instance ? deadlineCountdown(instance) : null;
    const isDone    = instance?.status === 'Awaiting Approval' || instance?.status === 'Completed';
    const statusLabel = !instance ? '✅ Up to date!'
      : instance.status === 'Awaiting Approval' ? '⏳ Submitted — awaiting approval'
      : isOverdue(instance) ? '⚠️ Overdue — do it now!'
      : '📌 Due soon — tap to submit';

    return `
      <div class="kid-task ${isDone?'done':''} ${instance&&isOverdue(instance)&&!isDone?'overdue-task':''}"
           onclick="${instance&&!isDone?`openTaskDetail('${instance.id}','recurring')`:'void(0)'}">
        <div class="rec-freq-badge">${freqIcon[tmpl.frequency]||'🔁'}</div>
        <div style="flex:1;min-width:0;">
          <div class="kid-task-name">${tmpl.name}
            <span style="font-size:11px;font-weight:500;color:#aaa;margin-left:6px;">${tmpl.frequency}</span>
          </div>
          <div class="kid-task-note">${statusLabel}</div>
          ${tmpl.desc ? `<div class="kid-task-desc">${tmpl.desc}</div>` : ''}
          ${tmpl.dueTime ? `<div style="font-size:11px;color:#aaa;margin-top:3px;">⏰ Due by ${tmpl.dueTime}</div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;">
          <div class="kid-task-pts">+${tmpl.points} ⭐</div>
          ${cd ? `<div class="deadline-pill ${cd.cls}">${cd.label}</div>` : ''}
        </div>
      </div>`;
  }).join('');
}

// ===========================
// STATS TAB
// ===========================
function renderStatsTab() {
  const child    = state.children.find(c => c.id === state.currentKidId);
  const allTasks = [...state.tasks, ...state.recurringInstances].filter(t => t.assignedTo === child.id);
  const done     = allTasks.filter(t => t.status === 'Completed').length;
  const total    = allTasks.length;
  const rate     = total > 0 ? Math.round(done/total*100) : 0;
  const overdue  = allTasks.filter(t => isOverdue(t)).length;
  const earned   = allTasks.filter(t => t.status==='Completed').reduce((s,t)=>s+t.points,0);

  // Stat numbers
  document.getElementById('kid-stat-numbers').innerHTML = [
    { icon:'✅', label:'Tasks Completed', val: done,                  color:'var(--kid-green)' },
    { icon:'🎯', label:'Completion Rate', val: rate+'%',              color:'var(--kid-orange)' },
    { icon:'⭐', label:'Total Pts Earned', val: earned+' pts',        color:'var(--gold)' },
    { icon:'💰', label:'Savings (₹)',     val: '₹'+(child.savingsBalance*state.parent.exchangeRate).toFixed(2), color:'var(--kid-green)' },
    { icon:'⚠️', label:'Overdue Tasks',   val: overdue,               color: overdue>0?'#FF6B6B':'var(--kid-green)' },
    { icon:'🏦', label:'Interest Rate',   val: state.parent.interestRate+'% /mo', color:'#aaa' }
  ].map(s => `
    <div class="kid-stat-row">
      <span>${s.icon} ${s.label}</span>
      <strong style="color:${s.color}">${s.val}</strong>
    </div>`).join('');

  // Achievements
  const achievements = getUnlockedAchievements(child, allTasks);
  document.getElementById('kid-achievements').innerHTML = achievements.map(a => `
    <div class="achievement ${a.unlocked?'unlocked':'locked'}">
      <div class="ach-icon">${a.icon}</div>
      <div class="ach-info">
        <div class="ach-label">${a.label}</div>
        <div class="ach-desc">${a.desc}</div>
      </div>
      ${a.unlocked ? '<div class="ach-check">✓</div>' : '<div class="ach-lock">🔒</div>'}
    </div>`).join('');

  // History
  const hist = child.history.slice(-8).reverse();
  const histEl = document.getElementById('kid-history-list');
  histEl.innerHTML = hist.length
    ? hist.map(h => {
        const icon  = h.type==='earned'?'✅':h.type==='interest'?'💰':'🏦';
        const isNeg = h.type==='cashout';
        return `<div class="history-item">
          <span>${icon} ${h.desc} <span style="color:#bbb;font-size:11px;">${h.date}</span></span>
          <span class="history-amount ${isNeg?'negative':'positive'}">${isNeg?'−':'+'}${h.pts} ${h.type==='earned'?'pts':'₹'}</span>
        </div>`;
      }).join('')
    : '<div style="text-align:center;padding:14px;color:#aaa;">No history yet</div>';

  // Family leaderboard
  const ranked = [...state.children].map(c => {
    const ct = [...state.tasks,...state.recurringInstances].filter(t=>t.assignedTo===c.id);
    return { ...c, totalEarned: ct.filter(t=>t.status==='Completed').reduce((s,t)=>s+t.points,0) };
  }).sort((a,b)=>b.totalEarned-a.totalEarned);
  const medals = ['🥇','🥈','🥉'];
  document.getElementById('kid-leaderboard').innerHTML = ranked.map((c,i) => `
    <div class="kid-lb-row ${c.id===child.id?'kid-lb-me':''}">
      <div style="font-size:20px;">${medals[i]||i+1}</div>
      <div style="font-size:22px;">${c.avatar}</div>
      <div style="flex:1;font-weight:${c.id===child.id?'700':'500'}">${c.name}${c.id===child.id?' (You)':''}</div>
      <div style="font-weight:800;color:${c.id===child.id?'var(--kid-orange)':'var(--navy)'};">${c.totalEarned} pts</div>
    </div>`).join('');
}

// ===========================
// TASK DETAIL MODAL
// ===========================
function openTaskDetail(taskId, pool) {
  const list = pool==='recurring' ? state.recurringInstances : state.tasks;
  const task = list.find(t => t.id === taskId);
  if (!task) return;

  state.detailTaskId = taskId;
  state.detailPool   = pool;

  const cd      = deadlineCountdown(task);
  const overdue = isOverdue(task);
  const canSubmit = task.status === 'Pending';

  document.getElementById('kid-detail-title').textContent = task.name;
  document.getElementById('kid-detail-body').innerHTML = `
    ${task.desc ? `<div class="detail-desc-box">${task.desc}</div>` : ''}
    <div class="detail-meta-grid">
      <div class="detail-meta-item">
        <div class="detail-meta-label">Points</div>
        <div class="detail-meta-val" style="color:var(--kid-orange);font-size:22px;">+${task.points} ⭐</div>
      </div>
      <div class="detail-meta-item">
        <div class="detail-meta-label">Status</div>
        <div class="detail-meta-val">${task.status}</div>
      </div>
      <div class="detail-meta-item">
        <div class="detail-meta-label">Deadline</div>
        <div class="detail-meta-val">${formatDate(task.deadline)}</div>
      </div>
      <div class="detail-meta-item">
        <div class="detail-meta-label">Time Left</div>
        <div class="detail-meta-val ${cd?cd.cls:''}">${cd ? cd.label : '—'}</div>
      </div>
    </div>
    ${overdue && canSubmit ? `<div class="overdue-warning">⚠️ This task is overdue! Submit it now to still get credit.</div>` : ''}
    ${task.status==='Awaiting Approval' ? `<div class="pending-notice">⏳ You've already submitted this task. Waiting for your parent to review it.</div>` : ''}
    ${task.status==='Completed'         ? `<div class="completed-notice">✅ This task is fully completed and points have been awarded!</div>` : ''}
  `;

  const submitBtn = document.getElementById('kid-detail-submit-btn');
  submitBtn.style.display = canSubmit ? 'block' : 'none';

  openModal('kid-task-detail-modal');
}

function submitFromDetail() {
  if (!state.detailTaskId) return;
  const list = state.detailPool==='recurring' ? state.recurringInstances : state.tasks;
  const task = list.find(t => t.id === state.detailTaskId);
  if (!task || task.status !== 'Pending') return;

  task.status = 'Awaiting Approval';
  closeModal('kid-task-detail-modal');
  renderAll();
  showToast('⏳ Submitted! Waiting for parent approval.');
}

// ===========================
// PAYDAY MODAL
// ===========================
function openKidPayday() {
  const child = state.children.find(c => c.id === state.currentKidId);
  if (!child || child.currentPoints === 0) return;
  document.getElementById('kid-payday-points').textContent = child.currentPoints + ' pts';
  document.getElementById('kid-payday-value').textContent  = '= ₹' + (child.currentPoints * state.parent.exchangeRate).toFixed(2);
  document.getElementById('modal-interest-rate').textContent = state.parent.interestRate;
  openModal('kid-payday-overlay');
}

function kidPaydayChoice(choice) {
  const child  = state.children.find(c => c.id === state.currentKidId);
  if (!child) return;
  const earned = child.currentPoints * state.parent.exchangeRate;

  if (choice === 'cashout') {
    child.history.push({ type:'cashout', desc:'Cashed Out',   pts:earned.toFixed(2), date:new Date().toLocaleDateString() });
    child.currentPoints = 0;
    showToast('💵 Cashed out ₹' + earned.toFixed(2) + '! Ask your parents for it!');
  } else {
    child.savingsBalance += child.currentPoints;
    child.history.push({ type:'saved',   desc:'Sent to Bank', pts:earned.toFixed(2), date:new Date().toLocaleDateString() });
    child.currentPoints = 0;
    showToast('🏦 Saved! Earning ' + state.parent.interestRate + '% interest next month!');
  }

  sessionStorage.removeItem('paydayPending');
  closeModal('kid-payday-overlay');
  renderAll();
}

// ===========================
// MODAL / TOAST
// ===========================
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target===o) o.classList.remove('open'); });
});

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}