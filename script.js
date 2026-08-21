const services = window.HAMMAD_SERVICES || {};
const partners = window.HAMMAD_PARTNERS || {};
const params = new URLSearchParams(window.location.search);
const serviceKey = services[params.get("service")] ? params.get("service") : "website";
const selectedService = services[serviceKey] || services.website;

const pathParts = window.location.pathname.split("/").filter(Boolean);
const offerIndex = pathParts.indexOf("offer");
const partnerSlug = offerIndex >= 0 ? pathParts[offerIndex + 1] : (params.get("partner") || "demo-partner");
const partner = partners[partnerSlug];
const validPartner = Boolean(partner && partner.active && /^62\d{8,15}$/.test(partner.whatsapp));

const packageData = [
  { key: "cms", label: "Paket 01", name: "Website + CMS", price: "Rp1.199jt", chips: ["Dashboard", "CMS", "Responsive"] },
  { key: "ecommerce", label: "Paket 02", name: "E-Commerce", price: "Rp1.699jt", chips: ["Produk", "Cart", "Checkout", "Dashboard"] },
  { key: "qris", label: "Paket 03", name: "E-Commerce + QRIS", price: "Rp2.999jt", chips: ["QRIS", "Payment", "Tracking Order"] },
  { key: "booking", label: "Paket 04", name: "Booking System", price: "Rp2.999jt", chips: ["Booking", "Schedule", "Dashboard"] },
  { key: "lms", label: "Paket 05", name: "LMS / Course System", price: "Rp3.999jt", chips: ["Student Login", "Course", "Progress"] },
  { key: "business", label: "Paket 06", name: "Business System", price: "Rp3.499jt", chips: ["CRM", "POS", "Rental", "Membership"] }
];

const messageMap = {
  general: "Halo Kak, saya ingin konsultasi website atau sistem digital untuk bisnis saya.",
  hero: selectedService.message,
  selected: selectedService.message,
  custom: "Halo Kak, saya punya kebutuhan website/sistem yang belum ada di daftar. Boleh konsultasi?",
  portfolio: "Halo Kak, saya sudah melihat beberapa portfolio Hammad Studio dan ingin konsultasi untuk bisnis saya.",
  final: "Halo Kak, saya masih bingung memilih website yang cocok. Boleh dibantu konsultasi?"
};

function track(eventName, data = {}) {
  const campaign = {};
  params.forEach((value, key) => {
    if (key.startsWith("utm_") || ["fbclid", "gclid", "service"].includes(key)) campaign[key] = value;
  });
  const payload = { event: eventName, partner_id: partner?.id || null, partner_slug: partnerSlug, service: serviceKey, ...campaign, ...data };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
  if (typeof window.gtag === "function") window.gtag("event", eventName, payload);
  if (typeof window.fbq === "function") window.fbq("trackCustom", eventName, payload);
  window.dispatchEvent(new CustomEvent("hammad:analytics", { detail: payload }));
}

function openWhatsApp(message, eventName = "whatsapp_click", packageName) {
  track(eventName, packageName ? { package: packageName } : {});
  if (!validPartner) {
    const alert = document.getElementById("configAlert");
    alert.hidden = false;
    window.setTimeout(() => { alert.hidden = true; }, 3200);
    return;
  }
  const attribution = partner?.id ? `\n\nRef Partner: ${partner.id}` : "";
  window.open(`https://wa.me/${partner.whatsapp}?text=${encodeURIComponent(message + attribution)}`, "_blank", "noopener,noreferrer");
}

function applyDynamicOffer() {
  document.getElementById("heroEyebrow").textContent = selectedService.eyebrow;
  const headline = selectedService.headline.replace(/(Bisnis Kamu|Tanpa Ribet|Sendiri|Lebih Rapi|Kursus Sendiri|Bisnis Kamu)$/i, "<em>$1</em>");
  document.getElementById("heroHeadline").innerHTML = headline;
  document.getElementById("heroDescription").textContent = selectedService.description;
  document.getElementById("heroPrice").textContent = selectedService.price;
  document.getElementById("stickyPrice").textContent = selectedService.price;
  document.getElementById("offerLabel").textContent = selectedService.offer;
  document.getElementById("offerPrice").textContent = selectedService.fullPrice;
  document.getElementById("offerFeatures").innerHTML = selectedService.features.map((feature) => `<li><span>✓</span>${feature}</li>`).join("");
  document.querySelector("[data-message-key='selected']").childNodes[0].textContent = "Konsultasi Paket Ini ";
  document.querySelector(".offer-content small").textContent = serviceKey === "website" ? "*Domain standar dan mengikuti ketersediaan." : "*Detail fitur mengikuti scope yang disepakati.";
  document.querySelector(".offer-card").dataset.watermark = selectedService.price.replace("Rp", "").replace("jt", "");
  document.title = `${selectedService.offer} Mulai ${selectedService.price} — Hammad Studio`;
  document.getElementById("partnerName").textContent = partner?.name || "Partner Resmi Hammad Studio";
}

function renderPackages() {
  const grid = document.getElementById("servicesGrid");
  grid.innerHTML = packageData.map((item) => `
    <article class="service-card reveal" data-service="${item.key}">
      <span>${item.label.toUpperCase()}</span>
      <h3>${item.name}</h3>
      <p class="service-price">Mulai ${item.price}</p>
      <div class="chips">${item.chips.map((chip) => `<span>${chip}</span>`).join("")}</div>
      <a class="service-link" href="#" data-package="${item.key}">Konsultasi paket <i>↗</i></a>
    </article>`).join("");

  grid.querySelectorAll(".service-card").forEach((card) => {
    const observer = new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting) { track("view_package", { package: card.dataset.service }); obs.disconnect(); }
    }, { threshold: .55 });
    observer.observe(card);
  });

  grid.querySelectorAll("[data-package]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const item = packageData.find((pkg) => pkg.key === link.dataset.package);
      const serviceMessage = services[item.key]?.message || `Halo Kak, saya tertarik ${item.name} mulai ${item.price}. Boleh konsultasi?`;
      openWhatsApp(serviceMessage, "package_whatsapp_click", item.name);
    });
  });
}

function bindWhatsappLinks() {
  document.querySelectorAll(".js-wa").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const message = messageMap[link.dataset.messageKey] || messageMap.general;
      openWhatsApp(message, "whatsapp_click", selectedService.offer);
    });
  });
}

function initReveal() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } });
  }, { threshold: .12 });
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

function initPortfolioTracking() {
  const portfolio = document.querySelector("[data-track-event='portfolio_view']");
  const observer = new IntersectionObserver((entries, obs) => {
    if (entries[0].isIntersecting) { track("portfolio_view"); obs.disconnect(); }
  }, { threshold: .35 });
  observer.observe(portfolio);
}

applyDynamicOffer();
renderPackages();
bindWhatsappLinks();
initReveal();
initPortfolioTracking();
track("page_view");
