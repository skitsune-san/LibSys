// LIBRARY PAGE

// Guard: redirect if not logged in
const session = localStorage.getItem("libsys_user")
  ? JSON.parse(localStorage.getItem("libsys_user"))
  : null;

if (!session) window.location.href = "login_page.html";

let allBooks = [];

// Load books from JSON into localStorage (simulates a writable DB for prototype)
async function loadBooks() {
  // Use localStorage copy if it exists (so borrow/return actions persist)
  const stored = localStorage.getItem("libsys_books");
  if (stored) {
    allBooks = JSON.parse(stored);
  } else {
    const res = await fetch("data/books.json");
    allBooks = await res.json();
    localStorage.setItem("libsys_books", JSON.stringify(allBooks));
  }
  renderBooks(allBooks);
  renderStats();
}

function saveBooks() {
  localStorage.setItem("libsys_books", JSON.stringify(allBooks));
}

function renderStats() {
  const total = allBooks.length;
  const available = allBooks.filter(b => b.available).length;
  const borrowed = total - available;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-available").textContent = available;
  document.getElementById("stat-borrowed").textContent = borrowed;
}

function renderBooks(books) {
  const grid = document.getElementById("books-grid");
  if (!books.length) {
    grid.innerHTML = `<p class="no-results">No books found.</p>`;
    return;
  }

  grid.innerHTML = books.map(book => `
    <div class="book-card" data-id="${book.id}">
      <div class="book-genre-tag">${book.genre}</div>
      <h3 class="book-title">${book.title}</h3>
      <p class="book-author">by ${book.author}</p>
      <p class="book-year">${book.year} · ISBN: ${book.isbn}</p>
      <div class="book-footer">
        <span class="status-badge ${book.available ? 'status-available' : 'status-borrowed'}">
          ${book.available ? "✓ Available" : "✗ Borrowed"}
        </span>
        ${book.available
          ? `<button class="borrow-btn" onclick="borrowBook(${book.id})">Borrow</button>`
          : book.borrowedBy === session.username
            ? `<button class="return-btn" onclick="returnBook(${book.id})">Return</button>`
            : `<button class="borrow-btn disabled" disabled>Unavailable</button>`
        }
      </div>
    </div>
  `).join("");
}

function borrowBook(id) {
  const book = allBooks.find(b => b.id === id);
  if (!book || !book.available) return;
  book.available  = false;
  book.borrowedBy = session.username;
  book.borrowedOn = new Date().toLocaleDateString("en-PH", { year:"numeric", month:"short", day:"numeric" });
  saveBooks();
  applyFilters();
  renderStats();
  showToast('"' + book.title + '" borrowed successfully!');
}

function returnBook(id) {
  const book = allBooks.find(b => b.id === id);
  if (!book) return;

  // Save to borrow history before clearing
  const history = JSON.parse(localStorage.getItem("libsys_borrow_history") || "[]");
  history.push({
    username:   book.borrowedBy,
    title:      book.title,
    author:     book.author,
    borrowedOn: book.borrowedOn || "Unknown",
    returnedOn: new Date().toLocaleDateString("en-PH", { year:"numeric", month:"short", day:"numeric" })
  });
  localStorage.setItem("libsys_borrow_history", JSON.stringify(history));

  book.available  = true;
  book.borrowedBy = null;
  book.borrowedOn = null;
  saveBooks();
  applyFilters();
  renderStats();
  showToast('"' + book.title + '" returned successfully!');
}

function applyFilters() {
  const search = document.getElementById("search-input").value.toLowerCase();
  const genre = document.getElementById("genre-filter").value;
  const status = document.getElementById("status-filter").value;

  let filtered = allBooks.filter(book => {
    const matchSearch =
      book.title.toLowerCase().includes(search) ||
      book.author.toLowerCase().includes(search) ||
      book.isbn.includes(search);
    const matchGenre = genre === "all" || book.genre === genre;
    const matchStatus =
      status === "all" ||
      (status === "available" && book.available) ||
      (status === "borrowed" && !book.available);
    return matchSearch && matchGenre && matchStatus;
  });

  renderBooks(filtered);
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// Populate genre dropdown from data
function buildGenreFilter() {
  const select = document.getElementById("genre-filter");
  const genres = [...new Set(allBooks.map(b => b.genre))].sort();
  genres.forEach(g => {
    const opt = document.createElement("option");
    opt.value = g;
    opt.textContent = g;
    select.appendChild(opt);
  });
}

// Event listeners
document.getElementById("search-input").addEventListener("input", applyFilters);
document.getElementById("genre-filter").addEventListener("change", applyFilters);
document.getElementById("status-filter").addEventListener("change", applyFilters);

// Notification toggle
const notifBtn = document.getElementById("notifications");
const notifBar = document.getElementById("notifBar");
if (notifBtn && notifBar) {
  notifBtn.addEventListener("click", () => {
    notifBar.classList.toggle("show");
    notifBar.classList.toggle("hidden");
  });
}

// Init
loadBooks().then(buildGenreFilter);
