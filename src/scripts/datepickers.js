import "../styles/litepicker-custom.css";
import Litepicker from "litepicker";
import "litepicker/dist/css/litepicker.css";

// Debug: confirm module is loaded in the browser console
console.log("datepickers.js loaded");

// Use two single-date pickers (one for start, one for end) so selecting a date is a single click
// This avoids the double-click behaviour users were seeing with the range picker.
const startInput = document.getElementById("startDate");
const endInput = document.getElementById("endDate");

// Defensive: only create pickers if inputs exist
if (startInput) {
  const startPicker = new Litepicker({
    element: startInput,
    singleMode: true,
    autoApply: true,
    numberOfMonths: 1,
    numberOfColumns: 1,
    firstDay: 0,
    format: "MM/DD/YYYY",
    mobileFriendly: true,
  });

  // keep a small log for debugging
  startPicker.on("selected", (date) => {
    console.log("Start date selected:", date.format("MM/DD/YYYY"));
  });
}

if (endInput) {
  const endPicker = new Litepicker({
    element: endInput,
    singleMode: true,
    autoApply: true,
    numberOfMonths: 1,
    numberOfColumns: 1,
    firstDay: 0,
    format: "MM/DD/YYYY",
    mobileFriendly: true,
  });

  endPicker.on("selected", (date) => {
    console.log("End date selected:", date.format("MM/DD/YYYY"));
  });
}
