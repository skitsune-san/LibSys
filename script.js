// Simple hardcoded credentials (for demo only)
const validUser = {
  username: "student",
  password: "library123"
};

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const dashboard = document.getElementById("dashboard");
const loginSection = document.getElementById("login-section");
const logoutBtn = document.getElementById("logoutBtn");
const contain = document.getElementById("contain");

loginForm.addEventListener("submit", function(event) {
  event.preventDefault();
  
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  
  if (username === validUser.username && password === validUser.password) {
    loginMessage.textContent = "";
    window.location.href = "dashboard.html";
    
  } else {
    loginMessage.textContent = "Invalid username or password!";
  }
});

logoutBtn.addEventListener("click", function() {
  dashboard.classList.add("hidden");
  loginSection.classList.remove("hidden");
  loginForm.reset();
});

// toggle notifications
const notifBtn = document.getElementById("notifications");
const notifBar = document.getElementById("notifBar");

notifBtn.addEventListener("click", function() {
  notifBar.classList.toggle("show");
  notifBar.classList.toggle("hidden");
});