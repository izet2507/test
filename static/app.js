// ── State ─────────────────────────────────────────────────────────────────────
let currentView = "dashboard";
let currentCatId = null;

const TYPE_ICONS = {
  vaccine: "💉",
  flea:    "🦟",
  worm:    "🪱",
  vet:     "🏥",
  other:   "📋",
};

const TYPE_LABELS = {
  vaccine: "Прививка",
  flea:    "От блох/клещей",
  worm:    "От глистов",
  vet:     "Ветеринар",
  other:   "Другое",
};

// ── Routing ───────────────────────────────────────────────────────────────────
function showView(view, catId) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("view-" + view).classList.add("active");

  const btn = document.querySelector(`[data-view="${view}"]`);
  if (btn) btn.classList.add("active");

  currentView = view;

  if (view === "dashboard") loadReminders();
  if (view === "cats") loadCats();
  if (view === "cat-detail" && catId) {
    currentCatId = catId;
    loadCatDetail(catId);
  }
}

// ── API helpers ───────────────────────────────────────────────────────────────
async function api(method, url, body) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  return res.json();
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
async function loadReminders() {
  const reminders = await api("GET", "/api/reminders");
  const container = document.getElementById("reminders-list");
  const countEl = document.getElementById("reminder-count");

  const overdueCount = reminders.filter(r => r.status === "overdue").length;
  const upcomingCount = reminders.filter(r => r.status === "upcoming").length;

  if (overdueCount > 0) {
    countEl.textContent = `${overdueCount} просрочено · ${upcomingCount} скоро`;
    countEl.style.color = "var(--danger)";
  } else if (upcomingCount > 0) {
    countEl.textContent = `${upcomingCount} в ближайшие 30 дней`;
    countEl.style.color = "var(--warning)";
  } else {
    countEl.textContent = "Всё в порядке!";
    countEl.style.color = "var(--ok)";
  }

  if (reminders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">✅</span>
        <div class="empty-state-title">Напоминаний нет</div>
        <div>Все процедуры в срок. Так держать!</div>
      </div>`;
    return;
  }

  container.innerHTML = reminders.map(r => {
    const daysLeft = daysDiff(r.next_date);
    const daysText = r.status === "overdue"
      ? `Просрочено на ${Math.abs(daysLeft)} дн.`
      : daysLeft === 0 ? "Сегодня!" : `Через ${daysLeft} дн.`;

    return `
    <div class="reminder-card ${r.status}" onclick="showView('cat-detail', ${r.cat_id})">
      <div class="reminder-cat">${r.photo_emoji}</div>
      <div class="reminder-body">
        <div class="reminder-title">${TYPE_ICONS[r.type] || "📋"} ${escHtml(r.name)}</div>
        <div class="reminder-sub">${escHtml(r.cat_name)} · ${TYPE_LABELS[r.type] || r.type}</div>
      </div>
      <div class="reminder-date">
        <div class="reminder-date-val ${r.status}">${formatDate(r.next_date)}</div>
        <div class="reminder-days">${daysText}</div>
      </div>
    </div>`;
  }).join("");
}

// ── Cats ──────────────────────────────────────────────────────────────────────
async function loadCats() {
  const cats = await api("GET", "/api/cats");
  const grid = document.getElementById("cats-grid");

  if (cats.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <span class="empty-state-icon">🐱</span>
        <div class="empty-state-title">Котов пока нет</div>
        <div>Нажмите «+ Добавить кота» чтобы начать</div>
      </div>`;
    return;
  }

  grid.innerHTML = cats.map(cat => {
    let badgeHtml = "";
    if (cat.overdue > 0)   badgeHtml += `<span class="badge badge-overdue">⚠ ${cat.overdue} просрочено</span>`;
    if (cat.upcoming > 0 && cat.upcoming > cat.overdue) badgeHtml += `<span class="badge badge-upcoming">🔔 ${cat.upcoming - cat.overdue} скоро</span>`;
    if (cat.overdue === 0 && cat.upcoming === 0 && cat.records_count > 0)
      badgeHtml += `<span class="badge badge-ok">✓ В порядке</span>`;
    if (cat.records_count === 0)
      badgeHtml += `<span class="badge badge-muted">Нет записей</span>`;

    const age = cat.birthdate ? ` · ${calcAge(cat.birthdate)}` : "";

    return `
    <div class="cat-card" onclick="showView('cat-detail', ${cat.id})">
      <div class="cat-card-actions" onclick="event.stopPropagation()">
        <button class="btn-icon" title="Редактировать" onclick="openCatModal(${cat.id})">✏️</button>
        <button class="btn-icon" title="Удалить" onclick="confirmDeleteCat(${cat.id}, '${escAttr(cat.name)}')">🗑️</button>
      </div>
      <span class="cat-card-emoji">${cat.photo_emoji}</span>
      <div class="cat-card-name">${escHtml(cat.name)}</div>
      <div class="cat-card-breed">${escHtml(cat.breed || "")}${age}</div>
      <div class="cat-card-badges">${badgeHtml}</div>
    </div>`;
  }).join("");
}

// ── Cat detail ────────────────────────────────────────────────────────────────
async function loadCatDetail(catId) {
  const [cats, records] = await Promise.all([
    api("GET", "/api/cats"),
    api("GET", `/api/cats/${catId}/records`),
  ]);

  const cat = cats.find(c => c.id === catId);
  if (!cat) { showView("cats"); return; }

  document.getElementById("detail-emoji").textContent = cat.photo_emoji;
  document.getElementById("detail-name").textContent = cat.name;

  // Info bar
  const infoBar = document.getElementById("cat-info");
  const age = cat.birthdate ? calcAge(cat.birthdate) : "—";
  infoBar.innerHTML = `
    <div class="cat-info-item">
      <span class="cat-info-label">Порода</span>
      <span class="cat-info-value">${escHtml(cat.breed || "—")}</span>
    </div>
    <div class="cat-info-item">
      <span class="cat-info-label">Возраст</span>
      <span class="cat-info-value">${age}</span>
    </div>
    <div class="cat-info-item">
      <span class="cat-info-label">Записей</span>
      <span class="cat-info-value">${records.length}</span>
    </div>`;

  // Records
  const container = document.getElementById("records-list");
  if (records.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">📋</span>
        <div class="empty-state-title">Записей нет</div>
        <div>Добавьте первую прививку или обработку</div>
      </div>`;
    return;
  }

  container.innerHTML = records.map(r => {
    const nextHtml = r.next_date ? `
      <div class="record-next">
        <div class="record-next-label">Следующий раз</div>
        <div class="record-next-date ${r.status}">${formatDate(r.next_date)}</div>
      </div>` : "";

    return `
    <div class="record-card ${r.status}">
      <div class="record-type-icon">${TYPE_ICONS[r.type] || "📋"}</div>
      <div class="record-body">
        <div class="record-name">${escHtml(r.name)}</div>
        <div class="record-meta">
          <span>${TYPE_LABELS[r.type] || r.type}</span>
          <span>Проведено: ${formatDate(r.done_date)}</span>
        </div>
        ${r.notes ? `<div class="record-notes">${escHtml(r.notes)}</div>` : ""}
      </div>
      ${nextHtml}
      <div class="record-actions">
        <button class="btn-icon" title="Редактировать" onclick="openRecordModal(${r.id})">✏️</button>
        <button class="btn-icon" title="Удалить" onclick="confirmDeleteRecord(${r.id}, '${escAttr(r.name)}')">🗑️</button>
      </div>
    </div>`;
  }).join("");
}

// ── Cat modal ─────────────────────────────────────────────────────────────────
async function openCatModal(catId) {
  const form = document.getElementById("cat-form");
  form.reset();
  document.getElementById("cat-id").value = "";
  selectEmoji("🐱");

  if (catId) {
    document.getElementById("cat-modal-title").textContent = "Редактировать кота";
    const cats = await api("GET", "/api/cats");
    const cat = cats.find(c => c.id === catId);
    if (cat) {
      document.getElementById("cat-id").value = cat.id;
      document.getElementById("cat-name").value = cat.name;
      document.getElementById("cat-breed").value = cat.breed || "";
      document.getElementById("cat-birthdate").value = cat.birthdate || "";
      selectEmoji(cat.photo_emoji || "🐱");
    }
  } else {
    document.getElementById("cat-modal-title").textContent = "Добавить кота";
  }

  document.getElementById("modal-cat").style.display = "flex";
}

async function saveCat(e) {
  e.preventDefault();
  const id = document.getElementById("cat-id").value;
  const data = {
    name:        document.getElementById("cat-name").value.trim(),
    breed:       document.getElementById("cat-breed").value.trim(),
    birthdate:   document.getElementById("cat-birthdate").value,
    photo_emoji: document.getElementById("cat-emoji").value,
  };

  if (id) {
    await api("PUT", `/api/cats/${id}`, data);
  } else {
    await api("POST", "/api/cats", data);
  }

  closeModal("modal-cat");
  loadCats();
}

function selectEmoji(emoji) {
  document.getElementById("cat-emoji").value = emoji;
  document.getElementById("emoji-preview").textContent = emoji;
  document.querySelectorAll(".emoji-opt").forEach(el => {
    el.classList.toggle("selected", el.textContent.trim() === emoji);
  });
}

// ── Record modal ──────────────────────────────────────────────────────────────
async function openRecordModal(recordId) {
  const form = document.getElementById("record-form");
  form.reset();
  document.getElementById("record-id").value = "";
  document.getElementById("record-cat-id").value = currentCatId;
  document.getElementById("record-done-date").value = todayIso();

  if (recordId) {
    document.getElementById("record-modal-title").textContent = "Редактировать запись";
    const records = await api("GET", `/api/cats/${currentCatId}/records`);
    const rec = records.find(r => r.id === recordId);
    if (rec) {
      document.getElementById("record-id").value = rec.id;
      document.getElementById("record-type").value = rec.type;
      document.getElementById("record-name").value = rec.name;
      document.getElementById("record-done-date").value = rec.done_date;
      document.getElementById("record-next-date").value = rec.next_date || "";
      document.getElementById("record-notes").value = rec.notes || "";
    }
  } else {
    document.getElementById("record-modal-title").textContent = "Добавить запись";
  }

  document.getElementById("modal-record").style.display = "flex";
}

async function saveRecord(e) {
  e.preventDefault();
  const id = document.getElementById("record-id").value;
  const data = {
    cat_id:    parseInt(document.getElementById("record-cat-id").value),
    type:      document.getElementById("record-type").value,
    name:      document.getElementById("record-name").value.trim(),
    done_date: document.getElementById("record-done-date").value,
    next_date: document.getElementById("record-next-date").value || null,
    notes:     document.getElementById("record-notes").value.trim(),
  };

  if (id) {
    await api("PUT", `/api/records/${id}`, data);
  } else {
    await api("POST", "/api/records", data);
  }

  closeModal("modal-record");
  loadCatDetail(currentCatId);
}

// ── Delete confirmations ──────────────────────────────────────────────────────
function confirmDeleteCat(id, name) {
  document.getElementById("confirm-text").textContent =
    `Удалить кота «${name}»? Все записи также будут удалены.`;
  document.getElementById("confirm-ok-btn").onclick = async () => {
    await api("DELETE", `/api/cats/${id}`);
    closeModal("modal-confirm");
    loadCats();
  };
  document.getElementById("modal-confirm").style.display = "flex";
}

function confirmDeleteRecord(id, name) {
  document.getElementById("confirm-text").textContent =
    `Удалить запись «${name}»?`;
  document.getElementById("confirm-ok-btn").onclick = async () => {
    await api("DELETE", `/api/records/${id}`);
    closeModal("modal-confirm");
    loadCatDetail(currentCatId);
  };
  document.getElementById("modal-confirm").style.display = "flex";
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

// Close on overlay click
document.querySelectorAll(".modal-overlay").forEach(overlay => {
  overlay.addEventListener("click", e => {
    if (e.target === overlay) overlay.style.display = "none";
  });
});

// ── Utils ─────────────────────────────────────────────────────────────────────
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function daysDiff(iso) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(iso); target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function calcAge(birthdate) {
  if (!birthdate) return "—";
  const birth = new Date(birthdate);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 12) return `${months} мес.`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years} г. ${rem} мес.` : `${years} г.`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escAttr(str) {
  return String(str).replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

// ── Init ──────────────────────────────────────────────────────────────────────
showView("dashboard");
