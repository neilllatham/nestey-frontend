import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import "../styles/flatpickr-custom.css";

flatpickr("#startDate", {
  dateFormat: "m/d/Y",
  altInput: true,
  altFormat: "F j, Y",
  allowInput: true,
  monthSelectorType: "static", // 👈 removes the native dropdown
  prevArrow: "‹",              // cleaner arrows
  nextArrow: "›",
});

flatpickr("#endDate", {
  dateFormat: "m/d/Y",
  altInput: true,
  altFormat: "F j, Y",
  allowInput: true,
  monthSelectorType: "static",
  prevArrow: "‹",
  nextArrow: "›",
});
