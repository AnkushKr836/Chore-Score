import { auth, signInWithEmailAndPassword } from "./firebase.js";

let selectedRole = "parent";

// ===========================
// ROLE TAB TOGGLE
// ===========================
function selectRole(role) {
  selectedRole = role;
  document.querySelectorAll(".login-tab").forEach((tab, i) => {
    tab.classList.toggle(
      "active",
      (i === 0 && role === "parent") ||
        (i === 1 && role === "kid")
    );
  });
}

// ===========================
// LOGIN WITH FIREBASE
// ===========================
async function doLogin() {
  const username = document
    .getElementById("login-username")
    .value.trim()
    .toLowerCase();

  const password = document.getElementById("login-password").value;

  try {
    await signInWithEmailAndPassword(auth, username, password);

    // store session
    sessionStorage.setItem("username", username);
    sessionStorage.setItem("role", selectedRole);

    // redirect
    if (selectedRole === "parent") {
      window.location.href = "parent.html";
    } else {
      window.location.href = "child.html";
    }
  } catch (err) {
    showLoginError("Invalid email or password");
  }
}

// ===========================
// ERROR HELPERS
// ===========================
function showLoginError(msg) {
  let err = document.getElementById("login-error");
  if (!err) {
    err = document.createElement("div");
    err.id = "login-error";
    err.className = "login-error";
    document
      .querySelector(".btn-primary")
      .insertAdjacentElement("afterend", err);
  }
  err.textContent = "⚠️ " + msg;
}

function clearLoginError() {
  const err = document.getElementById("login-error");
  if (err) err.remove();
}

// ===========================
// ENTER KEY SUPPORT
// ===========================
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") doLogin();
});

window.selectRole = selectRole;
window.doLogin = doLogin;