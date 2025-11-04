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

// Parse natural language dates from user message
function parseDateRange(text) {
  const msg = text.toLowerCase();
  const months = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
    apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
    aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
    nov: 10, november: 10, dec: 11, december: 11
  };

  // Match patterns like "Dec 8 through Dec 11" or "book December 8-11"
  const throughPattern = /(\w+)\s+(\d+)\s+(?:through|to|-)\s+(?:(\w+)\s+)?(\d+)/i;
  const match = msg.match(throughPattern);
  
  if (match) {
    const startMonth = months[match[1].toLowerCase()];
    const startDay = parseInt(match[2]);
    const endMonth = match[3] ? months[match[3].toLowerCase()] : startMonth;
    const endDay = parseInt(match[4]);
    
    if (startMonth !== undefined && endMonth !== undefined) {
      const year = new Date().getFullYear();
      const startDate = new Date(year, startMonth, startDay);
      const endDate = new Date(year, endMonth, endDay);
      
      // Format as YYYY-MM-DD for API
      return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        startDisplay: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        endDisplay: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    }
  }
  
  return null;
}

// Submit time off request via API
async function submitTimeOffRequest(startDate, endDate, type = 'PTO') {
  try {
    const res = await fetch('http://localhost:3001/api/timeoff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: 2, // TODO: Replace with actual employee ID
        type,
        start_date: startDate,
        end_date: endDate
      })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to submit request');
    }
    
    return await res.json();
  } catch (err) {
    console.error('Time off request failed:', err);
    throw err;
  }
}

// Get PTO balance
async function getPTOBalance() {
  try {
    const res = await fetch('http://localhost:3001/api/timeoff/balance?employee_id=2');
    if (!res.ok) throw new Error('Failed to fetch balance');
    const { summary } = await res.json();
    return summary;
  } catch (err) {
    console.error('Balance fetch failed:', err);
    return null;
  }
}

async function handleIntent(text) {
  const msg = text.toLowerCase();
  
  // Handle time off booking
  if (msg.includes("book") && (msg.includes("time off") || msg.includes("pto") || /\w+\s+\d+/.test(msg))) {
    const dates = parseDateRange(text);
    
    if (dates) {
      addMsg("ai", `Got it! Booking time off from ${dates.startDisplay} to ${dates.endDisplay}...`);
      
      try {
        const result = await submitTimeOffRequest(dates.start, dates.end);
        addMsg("ai", `✅ Your time off request has been submitted! Request ID: ${result.request_id}. Status: ${result.status}.`);
        
        // Notify Time Off page to refresh
        window.dispatchEvent(new CustomEvent('timeoff-updated'));
      } catch (err) {
        addMsg("ai", `❌ Sorry, I couldn't submit your request: ${err.message}`);
      }
    } else {
      addMsg("ai", "I didn't catch those dates. Try something like: 'book Dec 8 through Dec 11'");
    }
    return;
  }
  
  // Handle PTO used inquiry
  if (msg.includes("used") && (msg.includes("vacation") || msg.includes("pto"))) {
    addMsg("ai", "Let me check how much PTO you've used this year...");
    const balance = await getPTOBalance();
    if (balance && balance.PTO) {
      const used = balance.PTO.total_used || 0;
      addMsg("ai", `You've used ${used} days of PTO in ${new Date().getFullYear()}.`);
    } else {
      addMsg("ai", "Sorry, I couldn't fetch your PTO usage right now.");
    }
    return;
  }

  // Handle PTO balance inquiry
  if (msg.includes("balance") || msg.includes("how much") || msg.includes("how many")) {
    addMsg("ai", "Let me check your balance...");
    const balance = await getPTOBalance();
    
    if (balance) {
      const parts = [];
      if (balance.PTO) parts.push(`PTO: ${balance.PTO.total_remaining} days`);
      if (balance['Sick Leave']) parts.push(`Sick Leave: ${balance['Sick Leave'].total_remaining} days`);
      if (balance['Floating Holiday']) parts.push(`Floating Holiday: ${balance['Floating Holiday'].total_remaining} days`);
      
      addMsg("ai", `Your current balances:\n${parts.join('\n')}`);
    } else {
      addMsg("ai", "Sorry, I couldn't fetch your balance right now.");
    }
    return;
  }
  
  // Handle pending approvals
  if (msg.includes("pending") || msg.includes("approval")) {
    addMsg("ai", "You can view pending approvals on the Time Off page.");
    return;
  }
  
  // Other intents
  if (msg.includes("benefit")) {
    addMsg("ai", "You can view benefits on the Benefits page.");
  } else if (msg.includes("goal")) {
    addMsg("ai", "Goals are tracked on the Goals page.");
  } else if (msg.includes("personal")) {
    addMsg("ai", "Update personal info under the Personal section.");
  } else {
    addMsg("ai", "I can help you:\n• Book time off (try: 'book Dec 8 through Dec 11')\n• Check your PTO balance\n• View pending approvals");
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

