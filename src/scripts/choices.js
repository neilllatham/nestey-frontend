import Choices from "choices.js";
import "choices.js/public/assets/styles/choices.min.css";

const leaveTypeSelect = document.getElementById("leaveType");
if (leaveTypeSelect) {
  new Choices(leaveTypeSelect, {
    searchEnabled: false,
    itemSelectText: "",
    shouldSort: false,
    position: "bottom"
  });
}
