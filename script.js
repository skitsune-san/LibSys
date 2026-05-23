// SESSION HELPERS
function getSession() {
  const s = localStorage.getItem("libsys_user");
  return s ? JSON.parse(s) : null;
}

function setSession(user) {
  localStorage.setItem("libsys_user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("libsys_user");
}

// USER DB HELPERS (localStorage acts as the writable user database)
function getRegisteredUsers() {
  const u = localStorage.getItem("libsys_registered_users");
  return u ? JSON.parse(u) : [];
}

function saveRegisteredUsers(users) {
  localStorage.setItem("libsys_registered_users", JSON.stringify(users));
}

// LOGIN PAGE
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

if (loginForm) {

  // LOG IN
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const loginMessage = document.getElementById("loginMessage");

    // Check users registered via sign up (localStorage)
    const registeredUsers = getRegisteredUsers();
    const localMatch = registeredUsers.find(
      (u) => u.username === username && u.password === password
    );

    if (localMatch) {
      setSession(localMatch);
      window.location.href = "dashboard.html";
      return;
    }

    // Check default users from JSON file
    try {
      const res = await fetch("data/users.json");
      const defaultUsers = await res.json();
      const jsonMatch = defaultUsers.find(
        (u) => u.username === username && u.password === password
      );

      if (jsonMatch) {
        setSession(jsonMatch);
        window.location.href = "dashboard.html";
      } else {
        loginMessage.textContent = "Invalid username or password.";
        loginMessage.style.color = "#f87171";
      }
    } catch (err) {
      console.error("Could not load users.json:", err);
      loginMessage.textContent = "Error: run the project through Live Server, not by opening the file directly.";
      loginMessage.style.color = "#f87171";
    }
  });

  // Toggle to Sign Up form
  const signUpBtn = document.getElementById("sign-up");
  if (signUpBtn) {
    signUpBtn.addEventListener("click", function () {
      document.getElementById("login-section").style.display = "none";
      document.getElementById("signup-section").style.display = "block";
    });
  }
}

// SIGN UP
if (signupForm) {
  signupForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name        = document.getElementById("su-name").value.trim();
    const username    = document.getElementById("su-username").value.trim();
    const password    = document.getElementById("su-password").value;
    const role        = document.getElementById("su-role").value;
    const institution = document.getElementById("su-institution").value.trim();
    const email       = document.getElementById("su-email").value.trim();
    const signupMessage = document.getElementById("signupMessage");

    if (!name || !username || !password) {
      signupMessage.textContent = "Please fill in all fields.";
      signupMessage.style.color = "#f87171";
      return;
    }

    // Check if username already exists in localStorage users
    const registeredUsers = getRegisteredUsers();
    const alreadyExists = registeredUsers.find((u) => u.username === username);

    if (alreadyExists) {
      signupMessage.textContent = "Username is already taken. Choose another.";
      signupMessage.style.color = "#f87171";
      return;
    }

    // Also check against the default JSON users
    try {
      const res = await fetch("data/users.json");
      const defaultUsers = await res.json();
      const takenInJson = defaultUsers.find((u) => u.username === username);

      if (takenInJson) {
        signupMessage.textContent = "Username is already taken. Choose another.";
        signupMessage.style.color = "#f87171";
        return;
      }
    } catch (err) {
      // If fetch fails, just continue — don't block sign up
    }

    // All good — save the new user
    const newUser = {
      id: Date.now(),
      username,
      password,
      name,
      role,
      email,
      institution: institution || "Not specified"
    };

    registeredUsers.push(newUser);
    saveRegisteredUsers(registeredUsers);

    // Auto log in after sign up
    setSession(newUser);
    window.location.href = "dashboard.html";
  });

  // Back to Login button
  const backBtn = document.getElementById("back-to-login");
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      document.getElementById("signup-section").style.display = "none";
      document.getElementById("login-section").style.display = "block";
      document.getElementById("signupMessage").textContent = "";
    });
  }
}

// DASHBOARD PAGE
const welcomeSection = document.getElementById("welcome-name");
if (welcomeSection) {
  const session = getSession();
  if (!session) {
    window.location.href = "login_page.html";
  } else {
    welcomeSection.textContent = session.name;
    const roleEl = document.getElementById("welcome-role");
    if (roleEl) roleEl.textContent = session.role;
  }
}

// Live clock on dashboard
const clockEl = document.getElementById("live-clock");
if (clockEl) {
  function updateClock() {
    const now = new Date();
    let h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    clockEl.textContent = `${String(h).padStart(2, "0")} ${m}`;
    document.getElementById("clock-ampm").textContent = ampm;

    const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    const dateEl = document.getElementById("live-date");
    if (dateEl) {
      dateEl.textContent = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    }
  }
  updateClock();
  setInterval(updateClock, 1000);
}

// Recent materials on dashboard — shows the 4 most recently added books
async function loadRecentBooks() {
  const container = document.getElementById("recent-books-list");
  if (!container) return;
  try {
    // Always read from books.json for "recently added" — not localStorage which tracks borrow status
    const res = await fetch("data/books.json");
    const books = await res.json();
    // Highest IDs = added most recently
    const recent = [...books].sort((a, b) => b.id - a.id).slice(0, 4);
    // But reflect current availability from localStorage if available
    const stored = localStorage.getItem("libsys_books");
    const liveBooks = stored ? JSON.parse(stored) : books;
    container.innerHTML = recent.map(b => {
      const live = liveBooks.find(lb => lb.id === b.id) || b;
      return '<div class="recent-book-card">' +
        '<strong>' + b.title + '</strong>' +
        '<span>' + b.author + '</span>' +
        '<span class="book-badge ' + (live.available ? 'available' : 'borrowed') + '">' +
        (live.available ? 'Available' : 'Borrowed') + '</span>' +
        '</div>';
    }).join("");
  } catch (e) {
    if (container) container.innerHTML = "<p>Could not load books.</p>";
  }
}
loadRecentBooks();

// Notifications — show user's pending requests
function buildDashboardNotifications() {
  const content = document.getElementById("notif-content");
  if (!content) return;
  const session = getSession();
  if (!session) return;
  const reqs = JSON.parse(localStorage.getItem("libsys_requests") || "[]");
  // Admin sees all, others see only their own
  const mine = session.role === "Admin"
    ? reqs
    : reqs.filter(r => r.submittedBy === session.username);
  if (!mine.length) {
    content.innerHTML = '<p class="notif-empty">No notifications.</p>';
    return;
  }
  content.innerHTML = mine.map(r =>
    '<div class="notif-item"><strong>' + r.title + '</strong>' +
    (session.role === "Admin" ? 'From: ' + r.submittedBy + ' — ' : '') +
    'Status: ' + r.status + '</div>'
  ).join("");
}
buildDashboardNotifications();

// LOGOUT
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", function () {
    clearSession();
    window.location.href = "login_page.html";
  });
}

// NOTIFICATION TOGGLE
const notifBtn = document.getElementById("notifications");
const notifBar = document.getElementById("notifBar");
if (notifBtn && notifBar) {
  notifBtn.addEventListener("click", function () {
    const isHidden = notifBar.classList.contains("hidden");
    if (isHidden) {
      notifBar.classList.remove("hidden");
      notifBar.classList.add("show");
    } else {
      notifBar.classList.add("hidden");
      notifBar.classList.remove("show");
    }
  });
}
