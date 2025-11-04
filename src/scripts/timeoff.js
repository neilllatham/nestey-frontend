// src/scripts/timeoff.js

const API_BASE = "http://localhost:3001/api/timeoff";

// Fetch requests list
async function getTimeOffRequests() {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error("Failed to fetch time-off data");
  return res.json();
}

// Fetch balances for an employee
async function getTimeOffBalances(employeeId) {
  const res = await fetch(`${API_BASE}/balance?employee_id=${employeeId}`);
  if (!res.ok) throw new Error("Failed to fetch time-off balances");
  return res.json();
}

// Create a new request
async function createTimeOffRequest(requestData) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create time-off request");
  }
  return res.json();
}

// Format a date for display (MM/DD/YYYY)
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  // Cache DOM elements
  const form = document.getElementById("timeoffForm");
  const list = document.getElementById("requestsList");
  const balanceElements = {
    'PTO': document.getElementById('kpi-pto'),
    'Sick Leave': document.getElementById('kpi-sick'),
    'Floating Holiday': document.getElementById('kpi-float')
  };

  // Load and display balances
  async function loadBalances() {
    try {
      // TODO: Replace with actual employee ID from auth/session
      const employeeId = 2;
      const { summary } = await getTimeOffBalances(employeeId);
      console.info('[timeoff] Loaded balances summary:', summary);
      
      // Update KPI values by API keys
      Object.entries(balanceElements).forEach(([apiType, el]) => {
        if (!el) return;
        const bal = summary[apiType];
        const remaining = bal?.total_remaining ?? 0;
        el.textContent = `${remaining} days`;
      });
    } catch (err) {
      console.error('Failed to load balances:', err);
      // Don't show error to user, just leave existing values
    }
  }

  // Load and display requests
  async function loadRequests() {
    try {
      const requests = await getTimeOffRequests();
      console.info('[timeoff] Loaded requests:', requests);
      if (!requests?.length) {
        list.innerHTML = "<li class='request-item'><div class='req-dates'>No requests yet</div></li>";
        return;
      }

      list.innerHTML = requests
        .map(
          (r) => `
            <li class="request-item">
              <div class="req-dates">${formatDate(r.start_date)}${
                r.start_date !== r.end_date ? ` → ${formatDate(r.end_date)}` : ''
              }</div>
              <div class="req-meta">
                <span class="type-pill">${r.type || 'PTO'}</span>
                <span class="status-badge" style="background:${
                  r.status === 'Pending' ? '#EDCB74' :
                  r.status === 'Approved' ? 'var(--blue-accent)' :
                  'var(--red-alert)'
                };">${r.status}</span>
              </div>
            </li>`
        )
        .join("");
    } catch (err) {
      list.innerHTML = "<li class='request-item'><div class='req-dates'>Error loading requests</div></li>";
      console.error('Failed to load requests:', err);
    }
  }

  // Handle form submission
  if (form) form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const startDate = form.startDate.value;
    const endDate = form.endDate.value;
    const type = form.leaveType.value;

    // Client-side validation
    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      alert("End date must be on or after start date");
      return;
    }

    try {
      const data = {
        employee_id: 2, // TODO: Replace with actual employee ID from auth/session
        type,
        start_date: startDate,
        end_date: endDate
      };

  const created = await createTimeOffRequest(data);
  console.info('[timeoff] Created request:', created);
      form.reset();
      
      // Refresh both lists and balances
      await Promise.all([loadRequests(), loadBalances()]);
    } catch (err) {
      alert(err.message || "Error submitting request");
      console.error('Submit failed:', err);
    }
  });

  // Initial load
  await Promise.all([loadRequests(), loadBalances()]);
  
  // Listen for updates from chatbot
  window.addEventListener('timeoff-updated', async () => {
    console.info('[timeoff] Received update notification, refreshing...');
    await Promise.all([loadRequests(), loadBalances()]);
  });
});
