console.log('APP BUILD', 'marker-2025-09-11-01');

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Supabase client ---
const supabase = createClient(
  window.__ENV__.SUPABASE_URL,
  window.__ENV__.SUPABASE_ANON_KEY,
);

// --- Elements ---
const authView = qs("#authView");
const homeView = qs("#homeView");
const personView = qs("#personView");
const dashboardView = qs("#dashboardView");

const themeToggle = qs("#themeToggle");
const userMenu = qs("#userMenu");
const userAvatarBtn = qs("#userAvatarBtn");
const userAvatarInitials = qs("#userAvatarInitials");
const userDropdown = qs("#userDropdown");
const userMenuMobile = qs("#userMenuMobile");
const mobileCloseBtn = qs(".mobile-close-btn");

const signOutBtn = qs("#signOutBtn");

const searchInput = qs("#searchInput");
const cardsGrid = qs("#cardsGrid");
const emptyState = qs("#emptyState");
const newPersonBtn = qs("#newPersonBtn");
const emptyNewPerson = qs("#emptyNewPerson");

const personModal = qs("#personModal");
const personForm = qs("#personForm");

const txnModal = qs("#txnModal");
const txnForm = qs("#txnForm");
const profileModal = qs("#profileModal");
const profileForm = qs("#profileForm");
const txnKindEl = qs("#txnKind");
const txnCategoryEl = qs("#txnCategory");

const backHome = qs("#backHome");
const personHeader = qs("#personHeader");
const periodSelect = qs("#periodSelect");
const dateFrom = qs("#dateFrom");
const dateTo = qs("#dateTo");
const txnList = qs("#txnList");
const txnEmpty = qs("#txnEmpty");

const sumIncomeEl = qs("#sumIncome");
const sumExpenseEl = qs("#sumExpense");
const sumBalanceEl = qs("#sumBalance");

const signInBtn = qs("#signInBtn");
const signUpBtn = qs("#signUpBtn");
const authForm = qs("#authForm");

let CURRENT_USER = null;
let CURRENT_PROFILE = null; // Profilo utente dalla tabella profiles
let CURRENT_PERSON = null;
let CATEGORIES = [];
let EDITING_PERSON = null; // Per gestire la modifica
let EDITING_TRANSACTION = null; // Per gestire la modifica delle transazioni

// --- Init ---
document.addEventListener("DOMContentLoaded", async () => {
  // inizializza icone
  try {
    lucide.createIcons();
  } catch {}

  // Tema: dark di default
  applyTheme(localStorage.getItem("theme") || "dark");
  themeToggle.addEventListener("click", () => {
    const next =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "light"
        : "dark";
    applyTheme(next);
  });

  // Gestisci callback di verifica e magic link (#access_token=...)
  await handleAuthHashCallback();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  CURRENT_USER = session?.user || null;
  
  if (CURRENT_USER) {
    // Carica il profilo utente se già autenticato
    CURRENT_PROFILE = await loadUserProfile();
  }
  
  await bindAuthUI();

  supabase.auth.onAuthStateChange(async (_ev, s) => {
    CURRENT_USER = s?.user || null;
    
    if (CURRENT_USER) {
      // Carica il profilo utente quando si autentica
      CURRENT_PROFILE = await loadUserProfile();
    } else {
      CURRENT_PROFILE = null;
    }
    
    await bindAuthUI();
  });

  // UI handlers
  [newPersonBtn, emptyNewPerson].forEach((b) =>
    b?.addEventListener("click", () => openPersonModal()),
  );
  backHome?.addEventListener("click", () => showView("home"));
  periodSelect?.addEventListener("change", onPeriodChanged);
  [dateFrom, dateTo].forEach((i) =>
    i?.addEventListener("change", refreshTransactions),
  );
  txnKindEl?.addEventListener("change", refreshCategoriesInModal);
  qs("#addTxnBtn")?.addEventListener("click", () => openTxnModal());
  qs("#quickAddTxn")?.addEventListener("click", () => openTxnModal());
  
  // Profile modal handlers
  qs("#changePasswordBtn")?.addEventListener("click", onChangePassword);
  qs("#resetPasswordBtn")?.addEventListener("click", onResetPassword);

  // Modal close handlers - gestisce i bottoni di chiusura (X e Annulla)
  document.addEventListener("click", (e) => {
    const closeBtn = e.target.closest('button[value="close"]');
    if (closeBtn) {
      e.preventDefault();
      if (closeBtn.closest("#personModal")) {
        personModal.close();
        EDITING_PERSON = null; // Reset stato modifica
        // Fix viewport dopo chiusura modale su mobile
        if (window.innerWidth <= 768) {
          setTimeout(() => {
            document.body.style.minHeight = window.innerHeight + 'px';
            window.scrollTo(0, 0);
          }, 100);
        }
      } else if (closeBtn.closest("#txnModal")) {
        txnModal.close();
        EDITING_TRANSACTION = null; // Reset stato modifica
        // Fix viewport dopo chiusura modale su mobile
        if (window.innerWidth <= 768) {
          setTimeout(() => {
            document.body.style.minHeight = window.innerHeight + 'px';
            window.scrollTo(0, 0);
          }, 100);
        }
      } else if (closeBtn.closest("#profileModal")) {
        profileModal.close();
        // Fix viewport dopo chiusura modale su mobile
        if (window.innerWidth <= 768) {
          setTimeout(() => {
            document.body.style.minHeight = window.innerHeight + 'px';
            window.scrollTo(0, 0);
          }, 100);
        }
      }
    }
  });
  
  // Gestione focus input per prevenire problemi viewport mobile
  document.addEventListener("focusin", (e) => {
    if (window.innerWidth <= 768 && (e.target.matches('input, select, textarea'))) {
      // Previene scroll automatico problematico su mobile
      setTimeout(() => {
        if (e.target.closest('.modal')) {
          // Se l'input è in una modale, assicura che sia visibile
          e.target.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 300);
    }
  });
  
  document.addEventListener("focusout", (e) => {
    if (window.innerWidth <= 768 && (e.target.matches('input, select, textarea'))) {
      // Ripristina viewport dopo focus out da input
      setTimeout(() => {
        document.body.style.minHeight = window.innerHeight + 'px';
      }, 100);
    }
  });

  let debTimer;
  searchInput?.addEventListener("input", () => {
    clearTimeout(debTimer);
    debTimer = setTimeout(loadPeople, 200);
  });

  // Auth
  authForm?.addEventListener("submit", onSignIn);
  signUpBtn?.addEventListener("click", onSignUp);
  // Gestione delle voci del dropdown utente
  userDropdown?.addEventListener("click", async (e) => {
    const button = e.target.closest(".dropdown__item");
    if (!button) return;
    
    const action = button.getAttribute("data-action");
    
    switch(action) {
      case "profile":
        await openProfileModal();
        break;
      case "dashboard":
        showView("dashboard");
        break;
      case "categories":
        toast("Funzione Categorie in arrivo!");
        break;
      case "settings":
        toast("Funzione Impostazioni in arrivo!");
        break;
      case "signout":
        await onSignOut();
        break;
    }
    
    setUserMenu(false);
  });

  // Menu utente (desktop e mobile)
  userAvatarBtn?.addEventListener("click", () => {
    const open = userAvatarBtn.getAttribute("aria-expanded") === "true";
    setUserMenu(!open);
  });
  
  // Chiudi menu quando si clicca fuori (solo desktop)
  document.addEventListener("click", (e) => {
    if (!userMenu?.contains(e.target) && !userMenuMobile?.contains(e.target)) {
      setUserMenu(false);
    }
  });
  
  // Gestione bottone chiusura menu mobile
  mobileCloseBtn?.addEventListener("click", () => {
    setUserMenu(false);
  });
  
  // Gestione click sul backdrop mobile
  userMenuMobile?.addEventListener("click", (e) => {
    if (e.target === userMenuMobile) {
      setUserMenu(false);
    }
  });
  
  // Gestione ridimensionamento finestra e orientamento
  window.addEventListener("resize", handleResize);
  window.addEventListener("orientationchange", handleOrientationChange);
  
  // Fix iniziale per mobile viewport
  if (window.innerWidth <= 768) {
    document.body.style.minHeight = window.innerHeight + 'px';
  }
  
  // Menu mobile items
  userMenuMobile?.addEventListener("click", async (e) => {
    const button = e.target.closest(".mobile-menu-item");
    if (!button) return;
    
    const action = button.getAttribute("data-action");
    
    switch(action) {
      case "profile":
        await openProfileModal();
        break;
      case "dashboard":
        showView("dashboard");
        break;
      case "categories":
        toast("Funzione Categorie in arrivo!");
        break;
      case "settings":
        toast("Funzione Impostazioni in arrivo!");
        break;
      case "signout":
        await onSignOut();
        break;
    }
    
    setUserMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setUserMenu(false);
  });

  // Event delegation for transaction buttons
  txnList?.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-edit');
    const deleteBtn = e.target.closest('.btn-delete');
    if (editBtn) {
      const txId = editBtn.getAttribute('data-txid');
      if (txId) editTransaction(txId);
    } else if (deleteBtn) {
      const txId = deleteBtn.getAttribute('data-txid');
      if (txId) deleteTransaction(txId);
    }
  });
});

// --- Theme ---
function applyTheme(mode) {
  document.documentElement.setAttribute("data-theme", mode);
  localStorage.setItem("theme", mode);
  const moon = document.querySelector(".theme-moon");
  const sun = document.querySelector(".theme-sun");
  if (moon && sun) {
    if (mode === "dark") {
      moon.classList.remove("hidden");
      sun.classList.add("hidden");
    } else {
      sun.classList.remove("hidden");
      moon.classList.add("hidden");
    }
  }
}

// --- Auth helpers ---
async function handleAuthHashCallback() {
  if (location.hash && location.hash.includes("access_token=")) {
    const p = new URLSearchParams(location.hash.slice(1));
    const access_token = p.get("access_token");
    const refresh_token = p.get("refresh_token");
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
      history.replaceState(null, "", location.pathname + location.search);
    }
  }
}

async function bindAuthUI() {
  if (!CURRENT_USER) {
    showView("auth");
    userMenu?.classList.add("hidden");
    setUserMenu(false);
  } else {
    userMenu?.classList.remove("hidden");
    
    // Aggiorna l'interfaccia avatar utilizzando il profilo
    await updateAvatarUI();
    updateNicknameInDropdown();
    
    ensureDefaultCategories().then(() => {
      loadPeople();
      showView("home");
    });
  }
  try {
    lucide.createIcons();
  } catch {}
}

function showView(name) {
  [authView, homeView, personView, dashboardView].forEach((v) => v?.classList.add("hidden"));
  if (name === "auth") authView?.classList.remove("hidden");
  if (name === "home") homeView?.classList.remove("hidden");
  if (name === "person") personView?.classList.remove("hidden");
  if (name === "dashboard") {
    dashboardView?.classList.remove("hidden");
    // Inizializza il calendario se non esiste
    setTimeout(() => initializeDashboard(), 100);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// --- Auth actions ---
async function onSignIn(e) {
  e.preventDefault();
  const email = qs("#authEmail").value.trim();
  const password = qs("#authPassword").value.trim();
  if (!email || !password) return toast("Inserisci email e password");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return toast(error.message);
  toast("Bentornato!");
}
async function onSignUp() {
  const email = qs("#authEmail").value.trim();
  const password = qs("#authPassword").value.trim();
  if (!email || !password) return toast("Inserisci email e password");
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) return toast(error.message);
  toast("Registrazione completata! Controlla la mail di conferma.");
}
async function onSignOut() {
  await supabase.auth.signOut();
  showView("auth");
  toast("Sei uscito dall’account");
}

// --- User menu (desktop + mobile) ---
function isMobile() {
  return window.innerWidth <= 768;
}

function setUserMenu(open) {
  if (!userAvatarBtn) return;
  
  if (open) {
    if (isMobile()) {
      // Mostra menu mobile
      if (userMenuMobile) {
        userMenuMobile.classList.remove("hidden");
        document.body.style.overflow = 'hidden'; // Previene scroll
      }
    } else {
      // Mostra dropdown desktop
      if (userDropdown) {
        userDropdown.classList.remove("hidden");
      }
    }
    userAvatarBtn.setAttribute("aria-expanded", "true");
  } else {
    // Nascondi entrambi
    if (userDropdown) userDropdown.classList.add("hidden");
    if (userMenuMobile) {
      userMenuMobile.classList.add("hidden");
      document.body.style.overflow = ''; // Ripristina scroll
    }
    userAvatarBtn.setAttribute("aria-expanded", "false");
  }
}

// Gestione resize e orientamento per mobile
let resizeTimeout;
function handleResize() {
  // Chiude il menu se aperto durante resize
  const wasOpen = userAvatarBtn?.getAttribute("aria-expanded") === "true";
  if (wasOpen) {
    setUserMenu(false);
  }
  
  // Debounce per evitare troppi aggiornamenti
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    // Force reflow per sistemare viewport issues
    if (window.innerWidth <= 768) {
      document.body.style.minHeight = window.innerHeight + 'px';
    } else {
      document.body.style.minHeight = '';
    }
  }, 100);
}

// Gestione orientamento specifico per mobile
function handleOrientationChange() {
  // Chiude il menu durante cambio orientamento  
  setUserMenu(false);
  
  // Fix viewport dopo orientamento
  setTimeout(() => {
    if (window.innerWidth <= 768) {
      document.body.style.minHeight = window.innerHeight + 'px';
      // Force reflow
      document.documentElement.style.height = window.innerHeight + 'px';
      setTimeout(() => {
        document.documentElement.style.height = '';
      }, 100);
    }
  }, 500); // Delay per aspettare completamento orientamento
}
function getInitialsFromEmail(email) {
  if (!email) return "U";
  const [local] = email.split("@");
  const clean = local.replace(/\d+/g, "");
  const parts = clean.split(/[.\-_+]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] || email[0]).toUpperCase();
}

// --- Categories default ---
async function ensureDefaultCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,kind")
    .eq("owner_id", CURRENT_USER.id);
  if (error) return console.error(error);
  const have = new Set((data || []).map((c) => `${c.kind}:${c.name}`));
  const toInsert = [];
  DEFAULT_CATEGORIES.expense.forEach(
    (c) => !have.has(`expense:${c.name}`) && toInsert.push(c),
  );
  DEFAULT_CATEGORIES.income.forEach(
    (c) => !have.has(`income:${c.name}`) && toInsert.push(c),
  );
  if (toInsert.length) {
    const rows = toInsert.map((c) => ({
      ...c,
      owner_id: CURRENT_USER.id,
      is_default: true,
    }));
    await supabase.from("categories").insert(rows);
  }
  const { data: all } = await supabase
    .from("categories")
    .select("id,name,kind,color,icon")
    .eq("owner_id", CURRENT_USER.id)
    .order("name", { ascending: true });
  CATEGORIES = all || [];
}

// --- Home: people ---
async function loadPeople() {
  const q = (searchInput?.value || "").trim();
  let query = supabase
    .from("people")
    .select(
      "id, first_name, last_name, university, city, degree_course, course_type, matricola, fuori_corso, enrollment_date",
    )
    .eq("owner_id", CURRENT_USER.id)
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      [
        `first_name.ilike.%${q}%`,
        `last_name.ilike.%${q}%`,
        `degree_course.ilike.%${q}%`,
        `city.ilike.%${q}%`,
        `matricola.ilike.%${q}%`,
        `university.ilike.%${q}%`,
      ].join(","),
    );
  }

  const { data, error } = await query;
  if (error) return toast("Errore caricando le schede");
  renderPeople(data || []);
}

function initials(f, l) {
  return (
    ((f || "")[0] || "").toUpperCase() + ((l || "")[0] || "").toUpperCase()
  );
}

function renderPeople(rows) {
  cardsGrid.innerHTML = "";
  if (!rows.length) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  for (const p of rows) {
    const card = document.createElement("button");
    card.className = "card";
    card.innerHTML = `
      <div class="card__header">
        <div class="card__id">
          <div class="card__avatar">${escapeHtml(initials(p.first_name, p.last_name))}</div>
          <div>
            <div class="card__name">${escapeHtml(p.first_name)} ${escapeHtml(p.last_name)}</div>
            <div class="muted">${escapeHtml(p.degree_course || "—")}</div>
          </div>
        </div>
        <div class="card__actions">
          <button class="btn-edit" data-person-id="${p.id}" title="Modifica scheda">
            <svg data-lucide="edit-3" class="icon"></svg>
          </button>
          ${p.fuori_corso ? `<span class="badge-warn"><svg data-lucide="alert-triangle" class="icon"></svg>Fuori corso</span>` : ""}
        </div>
      </div>
      <div class="card__meta">
        ${p.university ? `<span class="meta"><svg data-lucide="graduation-cap" class="icon"></svg>${escapeHtml(p.university)}</span>` : ""}
        ${p.city ? `<span class="meta"><svg data-lucide="map-pin" class="icon"></svg>${escapeHtml(p.city)}</span>` : ""}
        ${p.matricola ? `<span class="meta"><svg data-lucide="id-card" class="icon"></svg>${escapeHtml(p.matricola)}</span>` : ""}
        ${p.enrollment_date ? `<span class="meta"><svg data-lucide="calendar" class="icon"></svg>${fmtDate(p.enrollment_date)}</span>` : ""}
      </div>
    `;
    card.addEventListener("click", (e) => {
      // Se clicca sull'icona di modifica, non aprire la persona ma la modale di modifica
      if (e.target.closest('.btn-edit')) {
        e.stopPropagation();
        openPersonModal(p.id);
        return;
      }
      openPerson(p.id);
    });
    cardsGrid.appendChild(card);
  }
  try {
    lucide.createIcons();
  } catch {}
}

async function openPerson(personId) {
  const { data: p, error } = await supabase
    .from("people")
    .select("*")
    .eq("id", personId)
    .single();
  if (error) return toast("Errore caricando la scheda");
  CURRENT_PERSON = p;
  renderPersonHeader(p);
  showView("person");
  periodSelect.value = "all";
  dateFrom.value = "";
  dateTo.value = "";
  await refreshTransactions();
}

function renderPersonHeader(p) {
  personHeader.innerHTML = `
    <div class="card__header">
      <div class="card__id">
        <div class="card__avatar">${escapeHtml(initials(p.first_name, p.last_name))}</div>
        <div>
          <div class="card__name">${escapeHtml(p.first_name)} ${escapeHtml(p.last_name)}</div>
          <div class="card__meta">
            ${p.university ? `<span class="meta"><svg data-lucide="graduation-cap" class="icon"></svg>${escapeHtml(p.university)}</span>` : ""}
            ${p.degree_course ? `<span class="meta"><svg data-lucide="book-open" class="icon"></svg>${escapeHtml(p.degree_course)}</span>` : ""}
            ${p.city ? `<span class="meta"><svg data-lucide="map-pin" class="icon"></svg>${escapeHtml(p.city)}</span>` : ""}
            ${p.course_type ? `<span class="meta"><svg data-lucide="library" class="icon"></svg>${escapeHtml(p.course_type)}</span>` : ""}
            ${p.matricola ? `<span class="meta"><svg data-lucide="id-card" class="icon"></svg>${escapeHtml(p.matricola)}</span>` : ""}
            ${p.fuori_corso ? `<span class="badge-warn"><svg data-lucide="alert-triangle" class="icon"></svg>Fuori corso</span>` : ""}
          </div>
        </div>
      </div>
      <div class="card__actions">
        <!--button class="btn-edit" title="Modifica scheda">
          <svg data-lucide="edit-3" class="icon"></svg>
        </button-->
        <button class="btn-delete" title="Elimina scheda">
          <svg data-lucide="trash-2" class="icon"></svg>
        </button>
      </div>
    </div>
  `;
  
  // Add event listeners after innerHTML
  const editBtn = personHeader.querySelector('.btn-edit');
  const deleteBtn = personHeader.querySelector('.btn-delete');
  editBtn?.addEventListener('click', () => openPersonModal(p.id));
  deleteBtn?.addEventListener('click', () => deletePerson(p.id));
  
  try {
    lucide.createIcons();
  } catch {}
}

// --- Filters / Txns ---
function onPeriodChanged() {
  const v = periodSelect.value;
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  if (v === "custom") {
    dateFrom.classList.remove("hidden");
    dateTo.classList.remove("hidden");
  } else {
    dateFrom.classList.add("hidden");
    dateTo.classList.add("hidden");
    if (v === "month") {
      dateFrom.value = toInputDate(new Date(y, m - 1, now.getDate()));
      dateTo.value = toInputDate(now);
    } else if (v === "quarter") {
      dateFrom.value = toInputDate(new Date(y, m - 3, now.getDate()));
      dateTo.value = toInputDate(now);
    } else if (v === "year") {
      dateFrom.value = `${y}-01-01`;
      dateTo.value = `${y}-12-31`;
    } else {
      dateFrom.value = "";
      dateTo.value = "";
    }
  }
  refreshTransactions();
}

async function refreshTransactions() {
  if (!CURRENT_PERSON) return;
  let q = supabase
    .from("transactions")
    .select("id, amount, kind, date, note, category_id")
    .eq("owner_id", CURRENT_USER.id)
    .eq("person_id", CURRENT_PERSON.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (dateFrom.value) q = q.gte("date", dateFrom.value);
  if (dateTo.value) q = q.lte("date", dateTo.value);

  const { data, error } = await q;
  if (error) return toast("Errore caricando le registrazioni");

  const byId = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
  const rows = (data || []).map((tx) => ({
    ...tx,
    category: byId[tx.category_id] || null,
  }));
  renderTransactions(rows);
}

function renderTransactions(rows) {
  txnList.innerHTML = "";
  if (!rows.length) txnEmpty.classList.remove("hidden");
  else txnEmpty.classList.add("hidden");

  let sumInc = 0,
    sumExp = 0;
  for (const tx of rows) {
    const isInc = tx.kind === "income";
    if (isInc) sumInc += Number(tx.amount || 0);
    else sumExp += Number(tx.amount || 0);

    const color = tx.category?.color || "rgba(245,197,24,.15)";
    const icon = tx.category?.icon || (isInc ? "trending-up" : "trending-down");
    const name = tx.category?.name || (isInc ? "Ricavo" : "Spesa");

    const row = document.createElement("div");
    row.className = "txn";
    row.innerHTML = `
      <div class="flex">
        <div class="ico" style="background:${color}; border-color:${color}"><svg data-lucide="${icon}" class="icon"></svg></div>
        <div style="margin-left:10px">
          <div class="bold">${escapeHtml(name)}</div>
          <div class="muted">${fmtDate(tx.date)}${tx.note ? " · " + escapeHtml(tx.note) : ""}</div>
        </div>
      </div>
      <div class="flex-center" style="gap:8px">
        <div class="${isInc ? "pos" : "neg"} bold">${isInc ? "+" : "-"}${formatEUR(tx.amount)}</div>
        <div class="txn-actions">
          <button class="btn-edit btn-edit-small" data-txid="${tx.id}" title="Modifica registrazione">
            <svg data-lucide="edit-3" class="icon icon-small"></svg>
          </button>
          <button class="btn-delete btn-delete-small" data-txid="${tx.id}" title="Elimina registrazione">
            <svg data-lucide="trash-2" class="icon icon-small"></svg>
          </button>
        </div>
      </div>
    `;
    txnList.appendChild(row);
  }
  sumIncomeEl.textContent = formatEUR(sumInc);
  sumExpenseEl.textContent = formatEUR(sumExp);
  sumBalanceEl.textContent = formatEUR(sumInc - sumExp);
  try {
    lucide.createIcons();
  } catch {}
}

// --- Modals ---
async function openPersonModal(personId = null) {
  personForm.reset();
  EDITING_PERSON = null;
  
  // Se è una modifica, carica i dati della persona
  if (personId && typeof personId === 'string') {
    const { data: person, error } = await supabase
      .from("people")
      .select("*")
      .eq("id", personId)
      .single();
    
    if (error) {
      toast("Errore caricando i dati della persona");
      return;
    }
    
    EDITING_PERSON = person;
    
    // Popola il form con i dati esistenti
    const firstNameInput = personForm.querySelector('[name="first_name"]');
    const lastNameInput = personForm.querySelector('[name="last_name"]');
    const birthDateInput = personForm.querySelector('[name="birth_date"]');
    const universityInput = personForm.querySelector('[name="university"]');
    const cityInput = personForm.querySelector('[name="city"]');
    const degreeCourseInput = personForm.querySelector('[name="degree_course"]');
    const courseTypeInput = personForm.querySelector('[name="course_type"]');
    const matricolaInput = personForm.querySelector('[name="matricola"]');
    const enrollmentDateInput = personForm.querySelector('[name="enrollment_date"]');
    const fuoriCorsoCheckbox = personForm.querySelector('.checkbox');

    if (firstNameInput) firstNameInput.value = person.first_name || '';
    if (lastNameInput) lastNameInput.value = person.last_name || '';
    if (birthDateInput) birthDateInput.value = person.birth_date || '';
    if (universityInput) universityInput.value = person.university || '';
    if (cityInput) cityInput.value = person.city || '';
    if (degreeCourseInput) degreeCourseInput.value = person.degree_course || '';
    if (courseTypeInput) courseTypeInput.value = person.course_type || '';
    if (matricolaInput) matricolaInput.value = person.matricola || '';
    if (enrollmentDateInput) enrollmentDateInput.value = person.enrollment_date || '';
    if (fuoriCorsoCheckbox) fuoriCorsoCheckbox.checked = person.fuori_corso || false;
    
    // Cambia il titolo della modale
    const modalTitle = personModal.querySelector('.modal__title h3');
    if (modalTitle) modalTitle.textContent = 'Modifica scheda anagrafica';
  } else {
    // Ripristina il titolo per nuova scheda
    const modalTitle = personModal.querySelector('.modal__title h3');
    if (modalTitle) modalTitle.textContent = 'Nuova scheda anagrafica';
  }
  
  personModal.showModal();
  try {
    lucide.createIcons();
  } catch {}
}

// Funzione per eliminare una persona
async function deletePerson(personId) {
  const confirmed = confirm("Sei sicuro di voler eliminare questa scheda anagrafica? Questa operazione eliminerà anche tutte le registrazioni associate e non può essere annullata.");
  if (!confirmed) return;
  
  try {
    // Prima elimina tutte le transazioni associate
    const { error: txnError } = await supabase
      .from("transactions")
      .delete()
      .eq("person_id", personId)
      .eq("owner_id", CURRENT_USER.id);
    
    if (txnError) {
      console.error("Errore eliminando le transazioni:", txnError);
      toast("Errore durante l'eliminazione delle transazioni");
      return;
    }
    
    // Poi elimina la persona
    const { error: personError } = await supabase
      .from("people")
      .delete()
      .eq("id", personId)
      .eq("owner_id", CURRENT_USER.id);
    
    if (personError) {
      console.error("Errore eliminando la persona:", personError);
      toast("Errore durante l'eliminazione della scheda");
      return;
    }
    
    toast("Scheda eliminata con successo");
    showView("home");
    await loadPeople();
  } catch (error) {
    console.error("Errore durante l'eliminazione:", error);
    toast("Errore imprevisto durante l'eliminazione");
  }
}
personForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(personForm);
  // Leggi il valore del checkbox personalizzato
  const fuoriCorsoCheckbox = personForm.querySelector('.checkbox');
  const isFuoriCorso = fuoriCorsoCheckbox ? fuoriCorsoCheckbox.checked : false;
  
  const row = {
    owner_id: CURRENT_USER.id,
    first_name: fd.get("first_name")?.toString().trim(),
    last_name: fd.get("last_name")?.toString().trim(),
    birth_date: fd.get("birth_date") || null,
    university: fd.get("university") || null,
    city: fd.get("city") || null,
    degree_course: fd.get("degree_course") || null,
    course_type: fd.get("course_type") || null,
    matricola: fd.get("matricola") || null,
    enrollment_date: fd.get("enrollment_date") || null,
    fuori_corso: isFuoriCorso,
  };
  if (!row.first_name || !row.last_name)
    return toast("Nome e cognome sono obbligatori");
  
  let error;
  if (EDITING_PERSON) {
    // Aggiorna la persona esistente
    const result = await supabase
      .from("people")
      .update(row)
      .eq("id", EDITING_PERSON.id);
    error = result.error;
  } else {
    // Crea una nuova persona
    const result = await supabase.from("people").insert(row);
    error = result.error;
  }
  
  if (error) return toast("Errore nel salvataggio");
  personModal.close();
  // Fix viewport dopo chiusura modale su mobile
  if (window.innerWidth <= 768) {
    setTimeout(() => {
      document.body.style.minHeight = window.innerHeight + 'px';
      window.scrollTo(0, 0);
    }, 100);
  }
  toast(EDITING_PERSON ? "Scheda aggiornata!" : "Scheda creata!");
  await loadPeople();
});

async function openTxnModal(transactionId = null) {
  txnForm.reset();
  EDITING_TRANSACTION = null;
  
  // Se è una modifica, carica i dati della transazione
  if (transactionId && typeof transactionId === 'string') {
    const { data: transaction, error } = await supabase
      .from("transactions")
      .select("*, categories(*)")
      .eq("id", transactionId)
      .single();
    
    if (error) {
      toast("Errore caricando i dati della registrazione");
      return;
    }
    
    EDITING_TRANSACTION = transaction;
    
    // Popola il form con i dati esistenti
    txnKindEl.value = transaction.kind || "expense";
    refreshCategoriesInModal();
    
    const amountInput = txnForm.querySelector('[name="amount"]');
    const dateInput = txnForm.querySelector('[name="date"]');
    const noteInput = txnForm.querySelector('[name="note"]');
    const categorySelect = txnForm.querySelector('[name="category_id"]');
    
    if (amountInput) amountInput.value = transaction.amount || '';
    if (dateInput) dateInput.value = transaction.date || '';
    if (noteInput) noteInput.value = transaction.note || '';
    if (categorySelect) categorySelect.value = transaction.category_id || '';
    
    // Cambia il titolo della modale
    const modalTitle = txnModal.querySelector('.modal__title h3');
    if (modalTitle) modalTitle.textContent = 'Modifica registrazione';
  } else {
    txnKindEl.value = "expense";
    refreshCategoriesInModal();
    // Ripristina il titolo per nuova registrazione
    const modalTitle = txnModal.querySelector('.modal__title h3');
    if (modalTitle) modalTitle.textContent = 'Nuova registrazione';
  }
  
  txnModal.showModal();
  try {
    lucide.createIcons();
  } catch {}
}

// Funzione per modificare una transazione
async function editTransaction(transactionId) {
  await openTxnModal(transactionId);
}

// Funzione per eliminare una transazione  
async function deleteTransaction(transactionId) {
  const confirmed = confirm("Sei sicuro di voler eliminare questa registrazione? Questa operazione non può essere annullata.");
  if (!confirmed) return;
  
  try {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transactionId)
      .eq("owner_id", CURRENT_USER.id);
    
    if (error) {
      console.error("Errore eliminando la transazione:", error);
      toast("Errore durante l'eliminazione della registrazione");
      return;
    }
    
    toast("Registrazione eliminata con successo");
    await refreshTransactions();
  } catch (error) {
    console.error("Errore durante l'eliminazione:", error);
    toast("Errore imprevisto durante l'eliminazione");
  }
}

function refreshCategoriesInModal() {
  const kind = txnKindEl.value;
  const opts = (CATEGORIES || []).filter((c) => c.kind === kind);
  txnCategoryEl.innerHTML = opts
    .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
    .join("");
}
txnForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(txnForm);
  const row = {
    owner_id: CURRENT_USER.id,
    person_id: CURRENT_PERSON.id,
    kind: fd.get("kind"),
    category_id: fd.get("category_id"),
    amount: Number(fd.get("amount") || 0),
    date: fd.get("date"),
    note: (fd.get("note") || "").toString().trim() || null,
    currency: "EUR",
  };
  if (!row.category_id) return toast("Seleziona una categoria");
  if (!row.date) return toast("Seleziona una data");
  if (isNaN(row.amount) || row.amount < 0) return toast("Importo non valido");
  
  let error;
  if (EDITING_TRANSACTION) {
    // Aggiorna la transazione esistente
    const result = await supabase
      .from("transactions")
      .update(row)
      .eq("id", EDITING_TRANSACTION.id);
    error = result.error;
  } else {
    // Crea una nuova transazione
    const result = await supabase.from("transactions").insert(row);
    error = result.error;
  }
  
  if (error) return toast("Errore nel salvataggio");
  txnModal.close();
  // Fix viewport dopo chiusura modale su mobile
  if (window.innerWidth <= 768) {
    setTimeout(() => {
      document.body.style.minHeight = window.innerHeight + 'px';
      window.scrollTo(0, 0);
    }, 100);
  }
  toast(EDITING_TRANSACTION ? "Registrazione aggiornata!" : "Registrazione aggiunta!");
  await refreshTransactions();
});

// --- Profile Modal ---
async function openProfileModal() {
  profileForm.reset();
  
  if (!CURRENT_USER) {
    toast("Errore: utente non autenticato");
    return;
  }
  
  // Popola i campi con i dati dell'utente corrente
  const emailInput = profileForm.querySelector('[name="email"]');
  const displayNameInput = profileForm.querySelector('[name="display_name"]');
  const createdAtInput = profileForm.querySelector('[name="created_at"]');
  
  if (emailInput) emailInput.value = CURRENT_USER.email || '';
  if (displayNameInput) displayNameInput.value = CURRENT_PROFILE?.display_name || '';
  if (createdAtInput) {
    const date = new Date(CURRENT_USER.created_at);
    createdAtInput.value = date.toLocaleDateString('it-IT');
  }
  
  // Carica l'avatar preview se presente
  await updateAvatarPreview();
  
  // Resetta i campi password
  const currentPasswordInput = profileForm.querySelector('[name="current_password"]');
  const newPasswordInput = profileForm.querySelector('[name="new_password"]');
  const confirmPasswordInput = profileForm.querySelector('[name="confirm_password"]');
  
  if (currentPasswordInput) currentPasswordInput.value = '';
  if (newPasswordInput) newPasswordInput.value = '';
  if (confirmPasswordInput) confirmPasswordInput.value = '';
  
  profileModal.showModal();
  setUserMenu(false); // Chiude il menu utente
  
  // Inizializza i gestori degli eventi per l'avatar
  initializeAvatarHandlers();
  
  try {
    lucide.createIcons();
  } catch {}
}

// Gestione submit form profilo (solo info personali)
profileForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(profileForm);
  const displayName = fd.get("display_name")?.toString().trim();
  
  if (!displayName) {
    toast("Il nickname è obbligatorio");
    return;
  }
  
  try {
    // Aggiorna il profilo nella tabella profiles
    const updatedProfile = await updateUserProfile({
      display_name: displayName
    });
    
    if (updatedProfile) {
      CURRENT_PROFILE = updatedProfile;
      updateAvatarUI();
      updateNicknameInDropdown();
    }
    
    profileModal.close();
    // Fix viewport dopo chiusura modale su mobile
    if (window.innerWidth <= 768) {
      setTimeout(() => {
        document.body.style.minHeight = window.innerHeight + 'px';
        window.scrollTo(0, 0);
      }, 100);
    }
    toast("Profilo aggiornato con successo!");
  } catch (error) {
    console.error("Errore imprevisto:", error);
    toast("Errore imprevisto durante l'aggiornamento");
  }
});

// Gestione cambio password
async function onChangePassword() {
  const currentPasswordInput = profileForm.querySelector('[name="current_password"]');
  const newPasswordInput = profileForm.querySelector('[name="new_password"]');
  const confirmPasswordInput = profileForm.querySelector('[name="confirm_password"]');
  
  const currentPassword = currentPasswordInput?.value?.trim();
  const newPassword = newPasswordInput?.value?.trim();
  const confirmPassword = confirmPasswordInput?.value?.trim();
  
  if (!currentPassword || !newPassword || !confirmPassword) {
    toast("Compila tutti i campi password");
    return;
  }
  
  if (newPassword !== confirmPassword) {
    toast("Le nuove password non corrispondono");
    return;
  }
  
  if (newPassword.length < 6) {
    toast("La nuova password deve essere di almeno 6 caratteri");
    return;
  }
  
  try {
    // Verifica la password corrente re-autenticando l'utente
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: CURRENT_USER.email,
      password: currentPassword
    });
    
    if (signInError) {
      toast("Password attuale incorretta");
      return;
    }
    
    // Aggiorna la password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (updateError) {
      toast("Errore durante il cambio password");
      console.error(updateError);
      return;
    }
    
    // Resetta i campi password
    if (currentPasswordInput) currentPasswordInput.value = '';
    if (newPasswordInput) newPasswordInput.value = '';
    if (confirmPasswordInput) confirmPasswordInput.value = '';
    
    toast("Password cambiata con successo!");
  } catch (error) {
    console.error("Errore imprevisto:", error);
    toast("Errore imprevisto durante il cambio password");
  }
}

// Gestione recupero password
async function onResetPassword() {
  if (!CURRENT_USER?.email) {
    toast("Errore: email utente non disponibile");
    return;
  }
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(CURRENT_USER.email, {
      redirectTo: window.location.origin
    });
    
    if (error) {
      toast("Errore durante l'invio email di recupero");
      console.error(error);
      return;
    }
    
    toast("Email di recupero inviata! Controlla la tua casella di posta");
  } catch (error) {
    console.error("Errore imprevisto:", error);
    toast("Errore imprevisto durante l'invio email");
  }
}

// === PROFILE MANAGEMENT ===
async function loadUserProfile() {
  if (!CURRENT_USER) return null;
  
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", CURRENT_USER.id)
    .single();
    
  if (error && error.code !== "PGRST116") {
    console.error("Error loading profile:", error);
    return null;
  }
  
  // Se non esiste un profilo, ne creiamo uno di default
  if (!data) {
    return await createUserProfile();
  }
  
  return data;
}

async function createUserProfile() {
  if (!CURRENT_USER) return null;
  
  const defaultDisplayName = CURRENT_USER.email?.split("@")[0] || "User";
  
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: CURRENT_USER.id,
      display_name: defaultDisplayName,
      avatar_url: null
    })
    .select()
    .single();
    
  if (error) {
    console.error("Error creating profile:", error);
    return null;
  }
  
  return data;
}

async function updateUserProfile(updates) {
  if (!CURRENT_USER) return null;
  
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq("id", CURRENT_USER.id)
    .select()
    .single();
    
  if (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
  
  return data;
}

async function uploadAvatar(file) {
  if (!CURRENT_USER || !file) return null;
  
  // Validazione del file
  if (!file.type.includes("image/png")) {
    throw new Error("Solo file PNG sono supportati");
  }
  
  // Ridimensiona l'immagine a 36x36 se necessario
  const resizedFile = await resizeImage(file, 36, 36);
  
  const fileExt = "png";
  const filePath = `${CURRENT_USER.id}/avatar.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from("avatars")
    .upload(filePath, resizedFile, {
      cacheControl: "3600",
      upsert: true,
      contentType: "image/png"
    });
    
  if (error) {
    console.error("Error uploading avatar:", error);
    throw error;
  }
  
  // Genera signed URL per bucket privato (validità: 1 ora)
  const { data: signedUrlData, error: urlError } = await supabase.storage
    .from("avatars")
    .createSignedUrl(filePath, 3600);
    
  if (urlError) {
    console.error("Error creating signed URL:", urlError);
    throw urlError;
  }
  
  return signedUrlData.signedUrl;
}

async function resizeImage(file, maxWidth, maxHeight) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      // Calcola le nuove dimensioni mantenendo l'aspect ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = maxWidth;
      canvas.height = maxHeight;
      
      // Centra l'immagine nel canvas 36x36
      const offsetX = (maxWidth - width) / 2;
      const offsetY = (maxHeight - height) / 2;
      
      // Sfondo trasparente
      ctx.clearRect(0, 0, maxWidth, maxHeight);
      
      // Disegna l'immagine ridimensionata
      ctx.drawImage(img, offsetX, offsetY, width, height);
      
      canvas.toBlob(resolve, "image/png");
    };
    
    img.src = URL.createObjectURL(file);
  });
}

async function updateAvatarUI() {
  const avatar = qs("#userAvatarBtn");
  const initials = qs("#userAvatarInitials");
  
  if (!avatar || !initials) return;
  
  if (CURRENT_PROFILE?.avatar_url) {
    try {
      // Genera nuovo signed URL per l'avatar
      const avatarPath = `${CURRENT_USER.id}/avatar.png`;
      const { data: signedUrlData, error } = await supabase.storage
        .from("avatars")
        .createSignedUrl(avatarPath, 3600);
      
      if (!error && signedUrlData?.signedUrl) {
        // Mostra l'immagine avatar con signed URL
        initials.style.display = "none";
        avatar.style.backgroundImage = `url(${signedUrlData.signedUrl})`;
        avatar.style.backgroundSize = "cover";
        avatar.style.backgroundPosition = "center";
        avatar.style.backgroundRepeat = "no-repeat";
      } else {
        // Fallback alle iniziali se signed URL fallisce
        throw new Error("Signed URL failed");
      }
    } catch (error) {
      // Mostra le iniziali come fallback
      initials.style.display = "block";
      avatar.style.backgroundImage = "none";
      const displayName = CURRENT_PROFILE?.display_name || CURRENT_USER?.email || "User";
      initials.textContent = getInitialsFromDisplayName(displayName);
    }
  } else {
    // Mostra le iniziali
    initials.style.display = "block";
    avatar.style.backgroundImage = "none";
    const displayName = CURRENT_PROFILE?.display_name || CURRENT_USER?.email || "User";
    initials.textContent = getInitialsFromDisplayName(displayName);
  }
  
  // Aggiorna il tooltip
  avatar.title = CURRENT_PROFILE?.display_name || CURRENT_USER?.email || "User";
}

function getInitialsFromDisplayName(displayName) {
  if (!displayName) return "U";
  
  // Se contiene spazi, usa le prime lettere delle parole
  const words = displayName.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  
  // Altrimenti usa i primi due caratteri
  return displayName.substring(0, 2).toUpperCase();
}

function updateNicknameInDropdown() {
  const dropdown = qs("#userDropdown");
  if (!dropdown || !CURRENT_PROFILE?.display_name) return;
  
  // Rimuovi nickname esistente se presente
  const existingNickname = dropdown.querySelector(".dropdown__nickname");
  if (existingNickname) {
    existingNickname.remove();
  }
  
  // Aggiungi il nickname come primo elemento
  const nicknameElement = document.createElement("div");
  nicknameElement.className = "dropdown__nickname";
  nicknameElement.style.cssText = `
    text-align: center;
    font-weight: 600;
    padding: 8px 12px;
    color: var(--gold);
    border-bottom: 1px solid rgba(255,255,255,.08);
    margin-bottom: 4px;
  `;
  nicknameElement.textContent = CURRENT_PROFILE.display_name;
  
  // Inserisci come primo elemento
  dropdown.insertBefore(nicknameElement, dropdown.firstChild);
}

// === AVATAR MANAGEMENT ===
async function updateAvatarPreview() {
  const avatarPreview = qs("#avatarPreview");
  const avatarPreviewContent = qs("#avatarPreviewContent");
  
  if (!avatarPreview || !avatarPreviewContent) return;
  
  if (CURRENT_PROFILE?.avatar_url) {
    try {
      // Genera nuovo signed URL per l'anteprima avatar
      const avatarPath = `${CURRENT_USER.id}/avatar.png`;
      const { data: signedUrlData, error } = await supabase.storage
        .from("avatars")
        .createSignedUrl(avatarPath, 3600);
      
      if (!error && signedUrlData?.signedUrl) {
        // Mostra l'immagine avatar
        avatarPreviewContent.innerHTML = `<img src="${signedUrlData.signedUrl}" alt="Avatar" />`;
      } else {
        throw new Error("Signed URL failed");
      }
    } catch (error) {
      // Mostra placeholder come fallback
      avatarPreviewContent.innerHTML = `
        <svg data-lucide="user" class="icon-large"></svg>
        <span class="preview-text">Nessun avatar</span>
      `;
    }
  } else {
    // Mostra placeholder
    avatarPreviewContent.innerHTML = `
      <svg data-lucide="user" class="icon-large"></svg>
      <span class="preview-text">Nessun avatar</span>
    `;
  }
  
  try {
    lucide.createIcons();
  } catch {}
}

function initializeAvatarHandlers() {
  const uploadArea = qs("#avatarUploadArea");
  const fileInput = qs("#avatarFileInput");
  const cropSection = qs("#avatarCropSection");
  const canvas = qs("#avatarCanvas");
  const cropAcceptBtn = qs("#cropAcceptBtn");
  const cropCancelBtn = qs("#cropCancelBtn");
  const removeAvatarBtn = qs("#removeAvatarBtn");
  
  if (!uploadArea || !fileInput) return;
  
  // Rimuovi event listeners esistenti per evitare duplicati
  const newUploadArea = uploadArea.cloneNode(true);
  uploadArea.parentNode.replaceChild(newUploadArea, uploadArea);
  
  const newFileInput = newUploadArea.querySelector("#avatarFileInput");
  const newCropAcceptBtn = qs("#cropAcceptBtn");
  const newCropCancelBtn = qs("#cropCancelBtn");
  const newRemoveAvatarBtn = qs("#removeAvatarBtn");
  
  // Click per aprire file dialog
  newUploadArea.addEventListener("click", () => {
    newFileInput.click();
  });
  
  // Drag and drop events
  newUploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    newUploadArea.classList.add("drag-over");
  });
  
  newUploadArea.addEventListener("dragleave", (e) => {
    e.preventDefault();
    newUploadArea.classList.remove("drag-over");
  });
  
  newUploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    newUploadArea.classList.remove("drag-over");
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleAvatarFile(files[0]);
    }
  });
  
  // File input change
  newFileInput.addEventListener("change", (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleAvatarFile(files[0]);
    }
  });
  
  // Crop buttons
  newCropAcceptBtn?.addEventListener("click", acceptCrop);
  newCropCancelBtn?.addEventListener("click", cancelCrop);
  
  // Remove avatar button
  newRemoveAvatarBtn?.addEventListener("click", removeAvatar);
}

function handleAvatarFile(file) {
  // Validazione del file
  if (!file.type.includes("image/png")) {
    toast("Solo file PNG sono supportati");
    return;
  }
  
  if (file.size > 2 * 1024 * 1024) { // 2MB max
    toast("Il file è troppo grande. Massimo 2MB");
    return;
  }
  
  // Mostra la sezione crop
  const uploadArea = qs("#avatarUploadArea");
  const cropSection = qs("#avatarCropSection");
  const canvas = qs("#avatarCanvas");
  
  if (uploadArea && cropSection && canvas) {
    uploadArea.classList.add("hidden");
    cropSection.classList.remove("hidden");
    
    // Carica l'immagine nel canvas per il crop
    loadImageToCanvas(file, canvas);
  }
}

function loadImageToCanvas(file, canvas) {
  const ctx = canvas.getContext("2d");
  const img = new Image();
  
  img.onload = () => {
    // Pulisci il canvas
    ctx.clearRect(0, 0, 36, 36);
    
    // Calcola le dimensioni per centrare e scalare l'immagine
    const scale = Math.min(36 / img.width, 36 / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const offsetX = (36 - scaledWidth) / 2;
    const offsetY = (36 - scaledHeight) / 2;
    
    // Disegna l'immagine
    ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
    
    // Mostra preview dell'immagine nel canvas
    const avatarPreview = qs("#avatarPreview");
    if (avatarPreview) {
      const previewImg = document.createElement("img");
      previewImg.src = canvas.toDataURL("image/png");
      previewImg.style.width = "100%";
      previewImg.style.height = "100%";
      previewImg.style.objectFit = "cover";
      
      qs("#avatarPreviewContent").innerHTML = "";
      qs("#avatarPreviewContent").appendChild(previewImg);
    }
  };
  
  img.src = URL.createObjectURL(file);
}

async function acceptCrop() {
  const canvas = qs("#avatarCanvas");
  if (!canvas) return;
  
  try {
    // Converti il canvas in blob
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, "image/png");
    });
    
    if (!blob) {
      toast("Errore nella conversione dell'immagine");
      return;
    }
    
    // Upload dell'avatar
    const avatarUrl = await uploadAvatar(blob);
    
    if (avatarUrl) {
      // Aggiorna il profilo con il nuovo avatar URL
      const updatedProfile = await updateUserProfile({
        avatar_url: avatarUrl
      });
      
      if (updatedProfile) {
        CURRENT_PROFILE = updatedProfile;
        await updateAvatarUI();
        await updateAvatarPreview();
        toast("Avatar aggiornato con successo!");
      }
    }
    
    // Nascondi la sezione crop
    cancelCrop();
    
  } catch (error) {
    console.error("Errore upload avatar:", error);
    toast("Errore durante l'upload dell'avatar");
    await cancelCrop();
  }
}

async function cancelCrop() {
  const uploadArea = qs("#avatarUploadArea");
  const cropSection = qs("#avatarCropSection");
  const fileInput = qs("#avatarFileInput");
  
  if (uploadArea && cropSection) {
    uploadArea.classList.remove("hidden");
    cropSection.classList.add("hidden");
  }
  
  if (fileInput) {
    fileInput.value = "";
  }
  
  // Ripristina l'anteprima originale
  await updateAvatarPreview();
}

async function removeAvatar() {
  try {
    // Aggiorna il profilo rimuovendo l'avatar URL
    const updatedProfile = await updateUserProfile({
      avatar_url: null
    });
    
    if (updatedProfile) {
      CURRENT_PROFILE = updatedProfile;
      await updateAvatarUI();
      await updateAvatarPreview();
      toast("Avatar rimosso con successo!");
    }
    
  } catch (error) {
    console.error("Errore rimozione avatar:", error);
    toast("Errore durante la rimozione dell'avatar");
  }
}

// ========== DASHBOARD MODULE ==========
let calendar = null; // Istanza FullCalendar

// Inizializza dashboard e calendario
function initializeDashboard() {
  if (calendar) return; // Già inizializzato
  
  const calendarEl = qs('#calendar');
  if (!calendarEl) return;
  
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'it',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    height: 'auto',
    events: loadCalendarEvents,
    eventClick: handleEventClick,
    dateClick: handleDateClick,
    editable: true,
    selectable: true,
    select: handleDateSelect,
    eventDrop: handleEventDrop,
    eventResize: handleEventResize
  });
  
  calendar.render();
  
  // Carica statistiche dashboard
  loadDashboardStats();
  
  // Setup event handlers
  setupDashboardHandlers();
}

// Carica eventi dal database per FullCalendar
async function loadCalendarEvents() {
  if (!CURRENT_USER) return [];
  
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', CURRENT_USER.id)
      .order('start_date', { ascending: true });
    
    if (error) {
      console.error('Error loading events:', error);
      return [];
    }
    
    return events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.start_date,
      end: event.end_date,
      description: event.description,
      extendedProps: {
        type: event.type,
        location: event.location,
        reminder_minutes: event.reminder_minutes
      },
      backgroundColor: getEventColor(event.type),
      borderColor: getEventColor(event.type)
    }));
    
  } catch (error) {
    console.error('Error in loadCalendarEvents:', error);
    return [];
  }
}

// Colori per diversi tipi di eventi
function getEventColor(type) {
  const colors = {
    'exam': '#ef4444', // Rosso - Esami
    'lecture': '#3b82f6', // Blu - Lezioni
    'deadline': '#f59e0b', // Arancione - Scadenze
    'reminder': '#10b981', // Verde - Promemoria
    'event': '#8b5cf6', // Viola - Eventi generici
    'appointment': '#ec4899' // Rosa - Appuntamenti
  };
  return colors[type] || '#6b7280'; // Grigio default
}

// Gestisci click su evento
function handleEventClick(info) {
  const event = info.event;
  toast(`Evento: ${event.title}\nData: ${event.start.toLocaleDateString('it-IT')}`);
  // TODO: Aprire modal modifica evento
}

// Gestisci click su data
function handleDateClick(info) {
  // TODO: Aprire modal nuovo evento per quella data
  toast(`Selezionata data: ${info.dateStr}`);
}

// Gestisci selezione range di date
function handleDateSelect(info) {
  // TODO: Aprire modal nuovo evento per il range selezionato
  toast(`Selezionato periodo: ${info.startStr} - ${info.endStr}`);
}

// Gestisci drag & drop eventi
async function handleEventDrop(info) {
  try {
    const event = info.event;
    await updateEventDate(event.id, event.start, event.end);
    toast('Evento spostato con successo!');
  } catch (error) {
    console.error('Error updating event:', error);
    toast('Errore nello spostamento evento');
    info.revert(); // Ripristina posizione originale
  }
}

// Gestisci resize eventi
async function handleEventResize(info) {
  try {
    const event = info.event;
    await updateEventDate(event.id, event.start, event.end);
    toast('Durata evento aggiornata!');
  } catch (error) {
    console.error('Error resizing event:', error);
    toast('Errore nel ridimensionamento evento');
    info.revert();
  }
}

// Aggiorna date evento nel database
async function updateEventDate(eventId, newStart, newEnd) {
  const { error } = await supabase
    .from('events')
    .update({
      start_date: newStart?.toISOString(),
      end_date: newEnd?.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', eventId)
    .eq('user_id', CURRENT_USER.id);
    
  if (error) throw error;
}

// Carica statistiche dashboard
async function loadDashboardStats() {
  if (!CURRENT_USER) return;
  
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Prossimi eventi (7 giorni)
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const { data: upcomingEvents } = await supabase
      .from('events')
      .select('id')
      .eq('user_id', CURRENT_USER.id)
      .gte('start_date', today.toISOString())
      .lte('start_date', nextWeek.toISOString());
    
    // Esami totali pianificati
    const { data: totalExams } = await supabase
      .from('events')
      .select('id')
      .eq('user_id', CURRENT_USER.id)
      .eq('type', 'exam')
      .gte('start_date', today.toISOString());
    
    // Promemoria oggi
    const { data: todayReminders } = await supabase
      .from('events')
      .select('id')
      .eq('user_id', CURRENT_USER.id)
      .eq('type', 'reminder')
      .gte('start_date', today.toISOString())
      .lt('start_date', tomorrow.toISOString());
    
    // Aggiorna UI
    updateDashboardStats({
      upcomingEvents: upcomingEvents?.length || 0,
      totalExams: totalExams?.length || 0,
      todayReminders: todayReminders?.length || 0,
      averageGrade: '--' // TODO: Calcolare dalla tabella grades
    });
    
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}

// Aggiorna le statistiche nell'UI
function updateDashboardStats(stats) {
  const upcomingEl = qs('#upcomingEvents');
  const examsEl = qs('#totalExams');
  const remindersEl = qs('#todayReminders');
  const gradeEl = qs('#averageGrade');
  
  if (upcomingEl) upcomingEl.textContent = stats.upcomingEvents;
  if (examsEl) examsEl.textContent = stats.totalExams;
  if (remindersEl) remindersEl.textContent = stats.todayReminders;
  if (gradeEl) gradeEl.textContent = stats.averageGrade;
}

// Setup event handlers della dashboard
function setupDashboardHandlers() {
  // Bottone nuovo evento
  const addEventBtn = qs('#addEventBtn');
  addEventBtn?.addEventListener('click', () => {
    toast('Modal nuovo evento in arrivo!');
    // TODO: Aprire modal nuovo evento
  });
  
  // Bottone export calendario
  const exportBtn = qs('#exportCalendarBtn');
  exportBtn?.addEventListener('click', exportCalendarToICS);
  
  // Azioni rapide
  const actionBtns = document.querySelectorAll('.action-btn');
  actionBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = e.currentTarget.getAttribute('data-action');
      handleQuickAction(action);
    });
  });
}

// Gestisci azioni rapide
function handleQuickAction(action) {
  switch(action) {
    case 'add-exam':
      toast('Aggiunta esame in arrivo!');
      // TODO: Aprire modal nuovo esame
      break;
    case 'add-reminder':
      toast('Nuovo promemoria in arrivo!');
      // TODO: Aprire modal nuovo reminder
      break;
    case 'add-lecture':
      toast('Nuova lezione in arrivo!');
      // TODO: Aprire modal nuova lezione
      break;
    case 'add-deadline':
      toast('Nuova scadenza in arrivo!');
      // TODO: Aprire modal nuova scadenza
      break;
    default:
      toast('Funzione in sviluppo!');
  }
}

// Export calendario in formato ICS
async function exportCalendarToICS() {
  if (!CURRENT_USER) return;
  
  try {
    const events = await loadCalendarEvents();
    
    if (events.length === 0) {
      toast('Nessun evento da esportare');
      return;
    }
    
    // Crea eventi ICS usando la libreria ics
    const icsEvents = events.map(event => ({
      title: event.title,
      description: event.description || '',
      start: new Date(event.start).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''),
      end: event.end ? new Date(event.end).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') : undefined,
      location: event.extendedProps?.location || ''
    }));
    
    // Genera file ICS
    const icsContent = generateICS(icsEvents);
    
    // Download del file
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendario-universitario-${new Date().toISOString().split('T')[0]}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast('Calendario esportato con successo!');
    
  } catch (error) {
    console.error('Error exporting calendar:', error);
    toast('Errore durante l\'esportazione');
  }
}

// Genera contenuto ICS manualmente (alternativa alla libreria)
function generateICS(events) {
  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//UCT//University Course Tracking//IT
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;
  
  events.forEach(event => {
    icsContent += `BEGIN:VEVENT
`;
    icsContent += `UID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@uct.app
`;
    icsContent += `DTSTART:${event.start}
`;
    if (event.end) icsContent += `DTEND:${event.end}
`;
    icsContent += `SUMMARY:${event.title}
`;
    if (event.description) icsContent += `DESCRIPTION:${event.description}
`;
    if (event.location) icsContent += `LOCATION:${event.location}
`;
    icsContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}
`;
    icsContent += `END:VEVENT
`;
  });
  
  icsContent += `END:VCALENDAR`;
  return icsContent;
}

// --- Utils ---
function qs(s) {
  return document.querySelector(s);
}
function escapeHtml(s) {
  return (s ?? "")
    .toString()
    .replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[m],
    );
}
function fmtDate(d) {
  try {
    const [Y, M, D] = d.split("-").map(Number);
    return new Date(Y, M - 1, D).toLocaleDateString("it-IT");
  } catch {
    return d;
  }
}
function toInputDate(dt) {
  const p = (n) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}
function formatEUR(n) {
  try {
    return Number(n).toLocaleString("it-IT", {
      style: "currency",
      currency: "EUR",
    });
  } catch {
    return `€${Number(n).toFixed(2)}`;
  }
}
function toast(msg) {
  const t = qs("#toast");
  t.textContent = msg;
  t.style.display = "block";
  setTimeout(() => (t.style.display = "none"), 2000);
}

// Default categories
const DEFAULT_CATEGORIES = {
  expense: [
    {
      name: "Alloggio",
      kind: "expense",
      color: "rgba(41,64,97,.18)",
      icon: "house",
    },
    {
      name: "Vitto",
      kind: "expense",
      color: "rgba(45,106,79,.18)",
      icon: "utensils",
    },
    {
      name: "Libri",
      kind: "expense",
      color: "rgba(245,197,24,.18)",
      icon: "book-open",
    },
    {
      name: "Trasporti",
      kind: "expense",
      color: "rgba(56,189,248,.18)",
      icon: "train",
    },
    {
      name: "Svago",
      kind: "expense",
      color: "rgba(250,204,21,.14)",
      icon: "sparkles",
    },
  ],
  income: [
    {
      name: "Borsa di studio",
      kind: "income",
      color: "rgba(245,197,24,.18)",
      icon: "graduation-cap",
    },
    {
      name: "Rimborsi",
      kind: "income",
      color: "rgba(168,85,247,.18)",
      icon: "receipt",
    },
    {
      name: "Part-time",
      kind: "income",
      color: "rgba(34,197,94,.18)",
      icon: "briefcase",
    },
  ],
};
