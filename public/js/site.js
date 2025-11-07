// --------------------------------------------
// Nestey Global JS
// --------------------------------------------
console.log("Nestey global JS loaded");

// ========== CHAT PANEL LOGIC ==========
const chatWindow = document.getElementById("chatWindow");
const input = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

// Set context-aware suggestions based on current page
function setContextAwareSuggestions() {
  const suggestionsContainer = document.getElementById('contextSuggestions');
  if (!suggestionsContainer) return;
  
  const path = window.location.pathname;
  let suggestions = [];
  
  if (path.includes('timeoff') || path.includes('time-off')) {
    suggestions = [
      { text: 'Book time off', say: 'book Dec 15 through Dec 17' },
      { text: 'PTO balance', say: "What's my PTO balance?" },
      { text: 'PTO used', say: 'How much PTO have I used this year?' }
    ];
  } else if (path.includes('benefit')) {
    suggestions = [
      { text: 'My benefits', say: 'What benefits do I have?' },
      { text: 'What have I paid', say: 'What have I paid for benefits this year?' },
      { text: 'Medical details', say: 'Tell me about my medical coverage' }
    ];
  } else {
    // Default suggestions for other pages
    suggestions = [
      { text: 'Pending approvals', say: 'Show my pending approvals' },
      { text: 'Book time off', say: 'Request time off' },
      { text: 'PTO balance', say: "What's my PTO balance?" }
    ];
  }
  
  suggestionsContainer.innerHTML = suggestions.map(s => 
    `<button class="pill" data-say="${s.say}">${s.text}</button>`
  ).join('');
}

// Call on page load
document.addEventListener('DOMContentLoaded', setContextAwareSuggestions);
// Also call after a short delay to ensure DOM is ready
setTimeout(setContextAwareSuggestions, 100);

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
  
  // Handle time off booking with dates - keep this rule-based for reliability
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
  
  // For all other questions, use AI with database context
  try {
    addMsg("ai", "Let me check that for you...");
    
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        employee_id: 2 // TODO: Replace with actual employee ID from auth
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.fallback) {
        addMsg("ai", errorData.fallback);
      } else {
        throw new Error('AI service unavailable');
      }
      return;
    }
    
    const { response: aiResponse } = await response.json();
    
    // Remove the "checking" message and add AI response
    const messages = chatWindow.querySelectorAll('.chat-message');
    if (messages.length > 0) {
      messages[messages.length - 1].remove();
    }
    addMsg("ai", aiResponse);
    
  } catch (err) {
    console.error('AI chat error:', err);
    addMsg("ai", "Sorry, I'm having trouble right now. Try asking about your PTO balance or benefits.");
  }
  return;
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

