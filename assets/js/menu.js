const m = document.getElementById("menu"), n = document.getElementById("nav");
if (m) {
  const set = o => { n.classList.toggle("open", o); m.setAttribute("aria-expanded", o); document.documentElement.classList.toggle("menu-open", o); };
  m.onclick = () => set(!n.classList.contains("open"));
  n.addEventListener("click", e => { if (e.target.closest("a")) set(false); });
  addEventListener("keydown", e => { if (e.key === "Escape") set(false); });
}
