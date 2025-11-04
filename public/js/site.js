// --------------------------------------------
// Nestey Global JS
// --------------------------------------------
console.log("Nestey global JS loaded");

// ========== CHAT PANEL LOGIC ==========
const chatWindow = document.getElementById("chatWindow");
const input = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

function timeNow() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function addMsg(type, text) {
  if (!chatWindow) return;
  const wrap = document.createElement("div");
  wrap.className = `chat-message ${type}`;
  wrap.innerHTML = `
    <div class="avatar">${type === "ai" ? "🤖" : "U"}</div>
    <div class="bubble">${text}<span class="timestamp">${timeNow()}</span></div>`;
  chatWindow.appendChild(wrap);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function handleIntent(text) {
  const msg = text.toLowerCase();
  if (msg.includes("pto") || msg.includes("time off")) {
    addMsg("ai", "Sure! You can manage PTO on the Time Off page.");
  } else if (msg.includes("benefit")) {
    addMsg("ai", "You can view benefits on the Benefits page.");
  } else if (msg.includes("goal")) {
    addMsg("ai", "Goals are tracked on the Goals page.");
  } else if (msg.includes("personal")) {
    addMsg("ai", "Update personal info under the Personal section.");
  } else {
    addMsg("ai", "I'll be able to do that once I'm connected to the backend!");
  }
}

if (sendBtn && input) {
  sendBtn.addEventListener("click", () => {
    const val = input.value.trim();
    if (!val) return;
    addMsg("user", val);
    input.value = "";
    setTimeout(() => handleIntent(val), 400);
  });
}

document.addEventListener("click", (e) => {
  if (e.target.matches(".pill[data-say]")) {
    const say = e.target.getAttribute("data-say");
    addMsg("user", say);
    setTimeout(() => handleIntent(say), 400);
  }
});

// ========== TIME OFF CALENDAR & FORM ==========
function renderCalendar() {
  const cal = document.getElementById("calendar");
  if (!cal) return;

  const today = new Date();
  const month = today.toLocaleString("default", { month: "long" });
  const year = today.getFullYear();
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const firstDay = new Date(year, today.getMonth(), 1).getDay();
  const daysInMonth = new Date(year, today.getMonth() + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push("<div class='day empty'></div>");
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, today.getMonth(), d);
    const isToday = d === today.getDate();
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    cells.push(
      `<div class="day${isWeekend ? " weekend" : ""}${isToday ? " today" : ""}">${d}</div>`
    );
  }

  // Ensure the last row always contains 7 cells so the Saturday column isn't visually missing
  const remainder = cells.length % 7;
  if (remainder !== 0) {
    const pad = 7 - remainder;
    for (let i = 0; i < pad; i++) cells.push("<div class='day empty'></div>");
  }

  cal.innerHTML = `
    <div class="cal-header"><strong>${month} ${year}</strong></div>
    <div class="cal-weekdays">
      ${weekdays.map((d) => `<div class="weekday">${d}</div>`).join("")}
    </div>
    <div class="cal-grid">${cells.join("")}</div>
  `;
}

// Run calendar if element exists
document.addEventListener("DOMContentLoaded", () => {
  renderCalendar();
});

