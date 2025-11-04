document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("timeoffForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const type = document.getElementById("leaveType").value;

    if (!startDate || !endDate || !type) {
      alert("Please fill all required fields.");
      return;
    }

    // In a real app, derive employee_id from auth session
    const employee_id = 1001; // Example only

    try {
      const res = await fetch("/api/timeoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id, startDate, endDate, type }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`✅ Request #${data.request_id} submitted for manager approval.`);
        form.reset();
      } else {
        alert(`❌ ${data.error || "Error submitting request"}`);
      }
    } catch (err) {
      console.error("Network error:", err);
      alert("❌ Unable to reach server");
    }
  });
});
