/* ===========================
   EARN & LEARN — login.js
   Handles authentication and routing to parent/child dashboards.

   BACKEND INTEGRATION NOTE:
   Replace the ACCOUNTS array and doLogin() function with real API calls.
   See backend-api-guide.txt for full details.
   =========================== */

// ===========================
// HARDCODED CREDENTIALS
// (Replace with API call in production — see backend-api-guide.txt)
// ===========================
const ACCOUNTS = [
  { username: 'parent@home', password: 'pass123',    role: 'parent', childId: null     },
  { username: 'vikram@home', password: 'vikpass123', role: 'kid',    childId: 'VIK02'  },
  { username: 'aria@home',   password: 'aria@123',   role: 'kid',    childId: 'ARIA01' }
];

// ===========================
// ROLE TAB TOGGLE
// ===========================

/** Currently highlighted role tab ('parent' or 'kid') */
let selectedRole = 'parent';

/**
 * Toggle the visual login tab between Parent and Kid.
 * @param {string} role - 'parent' | 'kid'
 */
function selectRole(role) {
  selectedRole = role;
  document.querySelectorAll('.login-tab').forEach((tab, i) => {
    tab.classList.toggle(
      'active',
      (i === 0 && role === 'parent') || (i === 1 && role === 'kid')
    );
  });
}

// ===========================
// LOGIN HANDLER
// ===========================

/**
 * Validate credentials AND role tab, then redirect to the correct dashboard.
 *
 * Rules:
 *  - If the Parent tab is selected, only parent@home credentials are accepted.
 *  - If the Kid tab is selected, only kid credentials are accepted.
 *  - Entering a kid's credentials in the Parent tab (or vice versa) shows an error.
 *
 * BACKEND: Replace the local ACCOUNTS lookup with a fetch() call to your
 * POST /api/auth/login endpoint. On success, store the JWT token in
 * sessionStorage and redirect. See backend-api-guide.txt §2.
 */
function doLogin() {
  const username = document.getElementById('login-username').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;

  // 1. Find a matching account by credentials only
  const account = ACCOUNTS.find(
    a => a.username === username && a.password === password
  );

  // 2. No match at all
  if (!account) {
    showLoginError('Invalid username or password. Please try again.');
    return;
  }

  // 3. Credentials are correct but the wrong role tab is selected
  if (account.role !== selectedRole) {
    if (selectedRole === 'parent') {
      showLoginError('These are child credentials. Please use the 🧒 Kid tab to log in.');
    } else {
      showLoginError('These are parent credentials. Please use the 👨‍👩‍👧 Parent tab to log in.');
    }
    return;
  }

  clearLoginError();

  // 4. All checks passed — store session and redirect
  sessionStorage.setItem('role',     account.role);
  sessionStorage.setItem('childId',  account.childId || '');
  sessionStorage.setItem('username', account.username);

  if (account.role === 'parent') {
    window.location.href = 'parent.html';
  } else {
    window.location.href = 'child.html';
  }
}

// ===========================
// ERROR HELPERS
// ===========================

/**
 * Display an error message inside the login card.
 * @param {string} msg
 */
function showLoginError(msg) {
  let err = document.getElementById('login-error');
  if (!err) {
    err = document.createElement('div');
    err.id = 'login-error';
    err.className = 'login-error';
    document.querySelector('.btn-primary').insertAdjacentElement('afterend', err);
  }
  err.textContent = '⚠️ ' + msg;
}

/** Remove the login error message */
function clearLoginError() {
  const err = document.getElementById('login-error');
  if (err) err.remove();
}

// ===========================
// ALLOW ENTER KEY TO LOGIN
// ===========================
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});