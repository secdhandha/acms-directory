// Interactive Search, Multi-Filter & Dark Mode Logic
let studentsData = [];

const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearch");
const batchFilter = document.getElementById("batchFilter");
const stateFilter = document.getElementById("stateFilter");
const cardsGrid = document.getElementById("cardsGrid");
const noResults = document.getElementById("noResults");
const studentCounter = document.getElementById("studentCounter");
const themeToggleBtn = document.getElementById("themeToggle");

// ==========================================
// 1. Dark Mode Management (Persistent)
// ==========================================
function initTheme() {
  const savedTheme = localStorage.getItem("acms_theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

themeToggleBtn.addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  if (isDark) {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("acms_theme", "light");
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("acms_theme", "dark");
  }
});

// ==========================================
// 2. Data Loading & Dynamic Dropdowns
// ==========================================
async function loadDirectory() {
  try {
    const res = await fetch("all_students.json");
    if (!res.ok) throw new Error("HTTP error " + res.status);
    studentsData = await res.json();
    populateFilters(studentsData);
    renderCards(studentsData);
  } catch (err) {
    console.error("Failed to load students directory:", err);
    studentCounter.innerText = "Error loading data";
  }
}

function populateFilters(data) {
  const batches = [...new Set(data.map(item => item.batch).filter(Boolean))].sort();
  const states = [...new Set(data.map(item => item.state).filter(Boolean))].sort();

  batches.forEach(b => {
    const opt = document.createElement("option");
    opt.value = b;
    opt.textContent = `Batch ${b}`;
    batchFilter.appendChild(opt);
  });

  states.forEach(s => {
    if (s && s !== "Other") {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      stateFilter.appendChild(opt);
    }
  });

  const otherOpt = document.createElement("option");
  otherOpt.value = "Other";
  otherOpt.textContent = "Other States";
  stateFilter.appendChild(otherOpt);
}

// ==========================================
// 3. Card Rendering with Fallbacks
// ==========================================
function renderCards(records) {
  cardsGrid.innerHTML = "";
  studentCounter.textContent = `${records.length} Cadet Profile${records.length === 1 ? "" : "s"}`;

  if (records.length === 0) {
    noResults.classList.remove("hidden");
    return;
  }
  noResults.classList.add("hidden");

  const fragment = document.createDocumentFragment();

  records.forEach(item => {
    const card = document.createElement("article");
    card.className = "cadet-card";

    const telLink = item.mobile && item.mobile !== "N/A" 
      ? item.mobile.split(",")[0].trim() 
      : "";

    const photoSrc = item.photo || `photos/${item.batch}/${item.enrolment}.jpg`;

    card.innerHTML = `
      <div class="card-top">
        <div class="avatar-wrapper">
          <img 
            src="${photoSrc}" 
            alt="${item.name}" 
            loading="lazy" 
            onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=1e3a8a&color=fff&size=128'"
          />
        </div>
        <div class="card-info">
          <h2 class="name" title="${item.name}">${item.name}</h2>
          <span class="enrol">ID: ${item.enrolment}</span>
          <div class="tag-badges">
            <span class="tag tag-batch">Batch ${item.batch}</span>
            <span class="tag tag-state">${item.state}</span>
          </div>
        </div>
      </div>

      <div class="card-body">
        <div class="detail-row">
          <span class="detail-label">Father's Name</span>
          <span class="detail-value">${item.father_name || "N/A"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Home Address</span>
          <span class="detail-value">${item.home_address || "N/A"}</span>
        </div>
      </div>

      <div class="card-action">
        <span class="detail-label">Mobile</span>
        ${telLink ? `<a href="tel:${telLink}" class="phone-link">📞 ${item.mobile}</a>` : `<span style="color:#94a3b8;font-size:0.85rem">N/A</span>`}
      </div>
    `;

    fragment.appendChild(card);
  });

  cardsGrid.appendChild(fragment);
}

// ==========================================
// 4. Instant Search & Filtering
// ==========================================
function filterRecords() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedBatch = batchFilter.value;
  const selectedState = stateFilter.value;

  const filtered = studentsData.filter(student => {
    const matchesSearch = !query || 
      (student.name && student.name.toLowerCase().includes(query)) ||
      (student.enrolment && student.enrolment.toLowerCase().includes(query)) ||
      (student.father_name && student.father_name.toLowerCase().includes(query)) ||
      (student.mobile && student.mobile.toLowerCase().includes(query)) ||
      (student.home_address && student.home_address.toLowerCase().includes(query));

    const matchesBatch = selectedBatch === "ALL" || String(student.batch) === String(selectedBatch);
    const matchesState = selectedState === "ALL" || student.state === selectedState;

    return matchesSearch && matchesBatch && matchesState;
  });

  renderCards(filtered);
}

searchInput.addEventListener("input", filterRecords);
batchFilter.addEventListener("change", filterRecords);
stateFilter.addEventListener("change", filterRecords);

clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  filterRecords();
});

// Initialize on page load
initTheme();
loadDirectory();
