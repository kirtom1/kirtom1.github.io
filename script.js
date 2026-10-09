// Tariff from the Blue Hills View poster (assets/tariff-poster.jpg). All amounts in rupees, before GST.
const TARIFF = {
  roomPerNight: 4000, // Deluxe room, double occupancy, breakfast for 2
  includedGuests: 2,
  extraGuestPerNight: 1000, // above 11 years, includes extra bed and breakfast
  childPerNight: 500, // 5 to 11 years, breakfast, no extra bed
  // Under 5: free. TODO(owner): maximum guests per room and number of rooms; the estimate assumes one room.
};
const WHATSAPP_NUMBER = "918089000159";
const EMAIL = "booking@bluehillsview.com";

const PHOTOS = [
  { src: "assets/photos/villa-evening-1000.webp", alt: "The villa at night, its porch lit with festive lights and stars", caption: "The villa after dark" },
  { src: "assets/photos/campfire-900.webp", alt: "A campfire burning in front of the two-storey villa after dark", caption: "Campfire nights" },
  { src: "assets/photos/mountain-view-1100.webp", alt: "Clouds drifting over the Attapady hills above green slopes", caption: "The view from your morning coffee" },
  { src: "assets/photos/mountain-hero-1212.webp", alt: "Forested peaks above terraced fields under a clear blue sky", caption: "Into the highlands" },
  { src: "assets/photos/villa-day-1000.webp", alt: "A thickly wooded green hill with the valley beyond", caption: "Green hills around Attapady" },
];

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const rupees = (n) => "₹" + n.toLocaleString("en-IN");
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

$("#year").textContent = new Date().getFullYear();

/* ---------- Toast ---------- */
let toastTimer;
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2400);
}

/* ---------- Share ---------- */
$("#share-btn").addEventListener("click", async () => {
  const data = { title: "Blue Hills View", text: "Blue Hills View, a serviced villa in Attapady, Kerala", url: location.href.split("#")[0] };
  if (navigator.share) {
    try { await navigator.share(data); } catch { /* cancelled */ }
    return;
  }
  try {
    await navigator.clipboard.writeText(data.url);
    toast("Link copied");
  } catch {
    toast(data.url);
  }
});

/* ---------- Dialog helpers ---------- */
function openDialog(dialog) {
  dialog.showModal();
}
$$("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) dialog.close();
    else if (e.target === dialog && !dialog.classList.contains("lightbox")) dialog.close();
  });
});
$$("[data-open-dialog]").forEach((btn) => {
  btn.addEventListener("click", () => openDialog(document.getElementById(btn.dataset.openDialog)));
});

/* ---------- Gallery ---------- */
const track = $("#gallery-track");
const counter = $("#gallery-counter");
track.addEventListener("scroll", () => {
  const i = Math.round(track.scrollLeft / track.clientWidth);
  counter.textContent = `${i + 1} / ${PHOTOS.length}`;
}, { passive: true });

$("#show-all-photos").addEventListener("click", () => openDialog($("#photo-tour")));
$$("[data-index]").forEach((btn) => btn.addEventListener("click", () => openLightbox(Number(btn.dataset.index))));

const lightbox = $("#lightbox");
const lbImg = $("#lb-img");
let lbIndex = 0;

function showPhoto(i) {
  lbIndex = (i + PHOTOS.length) % PHOTOS.length;
  const photo = PHOTOS[lbIndex];
  lbImg.classList.add("is-loading");
  lbImg.onload = () => lbImg.classList.remove("is-loading");
  lbImg.src = photo.src;
  lbImg.alt = photo.alt;
  $("#lb-caption").textContent = photo.caption;
  $("#lb-counter").textContent = `${lbIndex + 1} / ${PHOTOS.length}`;
  // Warm the cache for the neighbours so swiping feels instant.
  [lbIndex + 1, lbIndex - 1].forEach((n) => { new Image().src = PHOTOS[(n + PHOTOS.length) % PHOTOS.length].src; });
}

function openLightbox(i) {
  showPhoto(i);
  if (!lightbox.open) lightbox.showModal();
  $("#lb-next").focus();
}

$("#lb-prev").addEventListener("click", () => showPhoto(lbIndex - 1));
$("#lb-next").addEventListener("click", () => showPhoto(lbIndex + 1));
lightbox.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") { e.preventDefault(); showPhoto(lbIndex - 1); }
  if (e.key === "ArrowRight") { e.preventDefault(); showPhoto(lbIndex + 1); }
});

let touchX = null;
const stage = $("#lb-stage");
stage.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
stage.addEventListener("touchend", (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 40) showPhoto(lbIndex + (dx < 0 ? 1 : -1));
  touchX = null;
});

/* ---------- Booking ---------- */
const guests = { adults: 2, children: 0, infants: 0 };
const checkin = $("#checkin");
const checkout = $("#checkout");
const errorEl = $("#booking-error");

const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const longDate = (d) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const shortDate = (d) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

const today = new Date();
checkin.min = toISO(today);
checkout.min = toISO(addDays(today, 1));

function nights() {
  if (!checkin.value || !checkout.value) return 0;
  return Math.round((fromISO(checkout.value) - fromISO(checkin.value)) / 86400000);
}

function guestSummary() {
  const parts = [plural(guests.adults, "adult", "adults")];
  if (guests.children) parts.push(plural(guests.children, "child (5–11)", "children (5–11)"));
  if (guests.infants) parts.push(plural(guests.infants, "child under 5", "children under 5"));
  return parts.join(", ");
}

function calculate() {
  const n = nights();
  const extraGuests = Math.max(0, guests.adults - TARIFF.includedGuests);
  const lines = [{ label: `${rupees(TARIFF.roomPerNight)} × ${plural(n, "night", "nights")}`, amount: TARIFF.roomPerNight * n }];
  if (extraGuests) lines.push({ label: `Extra ${plural(extraGuests, "guest", "guests")} × ${rupees(TARIFF.extraGuestPerNight)} × ${n}`, amount: extraGuests * TARIFF.extraGuestPerNight * n });
  if (guests.children) lines.push({ label: `${plural(guests.children, "child", "children")} (5–11) × ${rupees(TARIFF.childPerNight)} × ${n}`, amount: guests.children * TARIFF.childPerNight * n });
  if (guests.infants) lines.push({ label: `${plural(guests.infants, "child", "children")} under 5`, amount: 0 });
  return { n, lines, total: lines.reduce((sum, l) => sum + l.amount, 0), perNight: TARIFF.roomPerNight + extraGuests * TARIFF.extraGuestPerNight + guests.children * TARIFF.childPerNight };
}

function buildMessage(est) {
  const rows = ["Hello Blue Hills View, I'd like to check availability."];
  if (est.n > 0) {
    rows.push(`Check-in: ${longDate(fromISO(checkin.value))}`);
    rows.push(`Check-out: ${longDate(fromISO(checkout.value))} (${plural(est.n, "night", "nights")})`);
  }
  rows.push(`Guests: ${guestSummary()}`);
  if (est.n > 0) rows.push(`Estimated total from your website: ${rupees(est.total)} plus GST`);
  rows.push("Please confirm availability and the final price. Thank you!");
  return rows.join("\n");
}

function render() {
  // Steppers
  $$(".stepper").forEach((s) => {
    const key = s.dataset.key;
    $("output", s).textContent = guests[key];
    $('[data-step="-1"]', s).disabled = guests[key] <= Number(s.dataset.min);
    $('[data-step="1"]', s).disabled = guests[key] >= Number(s.dataset.max);
  });
  $("#guests-summary").textContent = guestSummary();

  const est = calculate();
  const linesEl = $("#estimate-lines");
  const totalEl = $("#estimate-total");
  linesEl.replaceChildren();
  $("#estimate-empty").hidden = est.n > 0;
  totalEl.hidden = est.n === 0;
  $("#estimate .estimate-note")?.remove();

  if (est.n > 0) {
    est.lines.forEach((l) => {
      const row = document.createElement("div");
      row.innerHTML = "<dt></dt><dd></dd>";
      row.firstChild.textContent = l.label;
      row.lastChild.textContent = l.amount ? rupees(l.amount) : "Free";
      linesEl.append(row);
    });
    totalEl.innerHTML = `<span>Estimated total<small>Before GST · final price confirmed by the hosts</small></span><span>${rupees(est.total)}</span>`;
    if (guests.adults > 3) {
      const note = document.createElement("p");
      note.className = "estimate-note";
      note.textContent = "This estimate assumes one room. For larger groups the hosts will confirm how many rooms you need.";
      $("#estimate").append(note);
    }
    $("#bar-price").textContent = rupees(est.total);
    $("#bar-unit").textContent = "total";
    $("#bar-sub").textContent = `${shortDate(fromISO(checkin.value))} – ${shortDate(fromISO(checkout.value))} · plus GST`;
  } else {
    $("#bar-price").textContent = rupees(est.perNight);
    $("#bar-unit").textContent = "night";
    $("#bar-sub").textContent = "plus GST · breakfast for 2";
  }

  const message = buildMessage(est);
  $("#whatsapp-cta").href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  $("#email-cta").href = `mailto:${EMAIL}?subject=${encodeURIComponent("Booking enquiry")}&body=${encodeURIComponent(message)}`;
}

function setError(message, field) {
  errorEl.textContent = message;
  $$(".date-fields .field").forEach((f) => f.classList.remove("is-invalid"));
  if (field) field.closest(".field").classList.add("is-invalid");
}

checkin.addEventListener("change", () => {
  if (checkin.value) {
    const next = addDays(fromISO(checkin.value), 1);
    checkout.min = toISO(next);
    if (!checkout.value || fromISO(checkout.value) <= fromISO(checkin.value)) checkout.value = toISO(next);
  }
  setError("");
  render();
});
checkout.addEventListener("change", () => {
  if (checkin.value && checkout.value && fromISO(checkout.value) <= fromISO(checkin.value)) {
    setError("Check-out must be after check-in.", checkout);
    checkout.value = "";
  } else {
    setError("");
  }
  render();
});

$$(".stepper").forEach((s) => {
  s.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-step]");
    if (!btn || btn.disabled) return;
    const key = s.dataset.key;
    guests[key] = Math.min(Number(s.dataset.max), Math.max(Number(s.dataset.min), guests[key] + Number(btn.dataset.step)));
    render();
  });
});

const guestsToggle = $("#guests-toggle");
guestsToggle.addEventListener("click", () => {
  const open = guestsToggle.getAttribute("aria-expanded") !== "true";
  guestsToggle.setAttribute("aria-expanded", String(open));
  $("#guests-panel").hidden = !open;
});

function requireDates(e) {
  if (checkin.value && checkout.value && nights() > 0) return;
  e.preventDefault();
  const missing = !checkin.value ? checkin : checkout;
  setError("Add your check-in and check-out dates first.", missing);
  missing.focus();
  try { missing.showPicker(); } catch { /* not supported or not allowed */ }
}
$("#whatsapp-cta").addEventListener("click", requireDates);
$("#email-cta").addEventListener("click", requireDates);

/* ---------- Booking band and mobile bar ---------- */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const bookBand = $("#book");

// Every "Check availability" link lands on the card with check-in ready to fill.
$$('a[href="#book"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    closeMenu();
    bookBand.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth" });
    (checkin.value ? $("#whatsapp-cta") : checkin).focus({ preventScroll: true });
  });
});

// The bar steps aside while the booking card itself is on screen.
const mobileBar = $("#mobile-bar");
new IntersectionObserver(([entry]) => mobileBar.classList.toggle("is-hidden", entry.isIntersecting))
  .observe(bookBand);

/* ---------- Phone menu ---------- */
const nav = $(".site-nav");
const navToggle = $("#nav-toggle");

function setMenu(open) {
  nav.classList.toggle("is-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
}
function closeMenu() { setMenu(false); }

navToggle.addEventListener("click", () => {
  const open = !nav.classList.contains("is-open");
  setMenu(open);
  if (open) $("#nav-menu a").focus();
});
$$("#nav-menu a").forEach((a) => a.addEventListener("click", closeMenu));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && nav.classList.contains("is-open")) { closeMenu(); navToggle.focus(); }
});
document.addEventListener("click", (e) => {
  if (nav.classList.contains("is-open") && !nav.contains(e.target)) closeMenu();
});
window.matchMedia("(min-width: 768px)").addEventListener("change", (e) => { if (e.matches) closeMenu(); });

render();
