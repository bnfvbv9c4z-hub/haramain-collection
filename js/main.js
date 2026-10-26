/* Haramain Collection — shared site behaviour */

const STORE = {
  whatsapp: "919303081471", // Business WhatsApp: country code + number, without + or spaces.
  upiId: "yourname@upi", // Replace with your real UPI ID.
  cartKey: "haramainCollectionCart",
  shippingNote: "Shipping and final stock availability will be confirmed on WhatsApp."
};

let catalogue = window.HARAMAIN_PRODUCTS || [];
let activeCoupons = [];

document.addEventListener("DOMContentLoaded", async () => {
  setupMobileMenu();
  updateCartBadges();
  const [products, storeData] = await Promise.all([
    window.getHaramainProducts ? window.getHaramainProducts() : catalogue,
    window.getHaramainStoreData ? window.getHaramainStoreData() : { settings: window.HARAMAIN_DEFAULT_SETTINGS || {}, coupons: [] }
  ]);
  catalogue = products;
  activeCoupons = storeData.coupons || [];
  applyStoreSettings(storeData.settings || {});
  renderFeaturedProducts();
  setupShop();
  renderProductPage();
  renderCartPage();
  setupWhatsAppLinks();
  setupContactForm();
  setupNewsletterForm();
  setFooterYear();
});

/* ---------- Shared helpers ---------- */
function applyStoreSettings(settings) {
  Object.assign(STORE, {
    whatsapp: settings.whatsapp || STORE.whatsapp,
    upiId: settings.upiId || STORE.upiId,
    shippingNote: settings.shippingNote || STORE.shippingNote
  });

  document.querySelectorAll(".brand span").forEach(node => {
    node.textContent = settings.storeName || "Haramain Collection";
  });
  document.querySelectorAll(".announcement").forEach(node => {
    node.textContent = settings.announcementText || "";
    node.hidden = settings.announcementEnabled === false;
  });
  document.querySelectorAll(".footer-brand > p").forEach(node => {
    if (settings.footerCopy) node.textContent = settings.footerCopy;
  });

  const themeColours = {
    "--maroon": settings.primaryColor,
    "--maroon-dark": settings.primaryDarkColor,
    "--gold": settings.accentColor,
    "--cream-light": settings.backgroundColor
  };
  Object.entries(themeColours).forEach(([property, value]) => {
    if (value) document.documentElement.style.setProperty(property, value);
  });
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta && settings.primaryColor) themeMeta.content = settings.primaryColor;

  const hero = document.querySelector(".hero");
  if (hero) {
    if (settings.heroImageUrl) hero.style.setProperty("--hero-image", `url("${String(settings.heroImageUrl).replace(/["\\]/g, "")}")`);
    const eyebrow = hero.querySelector(".eyebrow");
    const title = hero.querySelector("h1");
    const copy = hero.querySelector(".hero__copy");
    const note = hero.querySelector(".hero__note");
    const primary = hero.querySelector(".button-group .button:first-child");
    if (eyebrow && settings.heroEyebrow) eyebrow.textContent = settings.heroEyebrow;
    if (title && settings.heroTitle) title.textContent = settings.heroTitle;
    if (copy && settings.heroCopy) copy.textContent = settings.heroCopy;
    if (note && settings.heroNote) note.textContent = settings.heroNote;
    if (primary) {
      if (settings.heroPrimaryLabel) primary.textContent = settings.heroPrimaryLabel;
      if (settings.heroPrimaryLink) primary.href = settings.heroPrimaryLink;
    }
  }
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function getCouponState(cart, subtotal) {
  const itemCount = cart.reduce((total, item) => total + Number(item.quantity), 0);
  const eligible = activeCoupons
    .filter(coupon => subtotal >= coupon.minCartValue && itemCount >= coupon.minItems)
    .sort((a, b) => ((subtotal * b.discountPercent) - (subtotal * a.discountPercent)) || b.priority - a.priority);
  const applied = eligible[0] || null;
  const upcoming = activeCoupons
    .filter(coupon => !eligible.includes(coupon))
    .map(coupon => ({
      coupon,
      missingValue: Math.max(0, coupon.minCartValue - subtotal),
      missingItems: Math.max(0, coupon.minItems - itemCount)
    }))
    .sort((a, b) => (a.missingValue + a.missingItems * 100) - (b.missingValue + b.missingItems * 100))[0] || null;
  const discount = applied ? Math.round(subtotal * applied.discountPercent / 100) : 0;
  return { itemCount, applied, upcoming, discount, total: Math.max(0, subtotal - discount) };
}

function couponProgressMessage(state) {
  if (state.applied) return `${state.applied.code} applied automatically — you saved ${formatPrice(state.discount)} (${state.applied.discountPercent}% off).`;
  if (!state.upcoming) return "";
  const parts = [];
  if (state.upcoming.missingItems) parts.push(`${state.upcoming.missingItems} more item${state.upcoming.missingItems === 1 ? "" : "s"}`);
  if (state.upcoming.missingValue) parts.push(`${formatPrice(state.upcoming.missingValue)} more`);
  return `Add ${parts.join(" and ")} to unlock ${state.upcoming.coupon.discountPercent}% off automatically.`;
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(STORE.cartKey)) || [];
  } catch (error) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(STORE.cartKey, JSON.stringify(cart));
  updateCartBadges();
}

function findProduct(id) {
  return catalogue.find(product => product.id === Number(id));
}

function addToCart(id, quantity = 1) {
  const product = findProduct(id);
  if (!product) return;
  if (product.quantity <= 0) {
    showToast(`${product.name} is currently out of stock`);
    return;
  }

  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);
  const requested = Number(quantity);
  const current = existing ? existing.quantity : 0;
  const newQuantity = Math.min(current + requested, product.quantity);
  if (existing) existing.quantity = newQuantity;
  else cart.push({ id: product.id, quantity: newQuantity });
  saveCart(cart);
  showToast(newQuantity < current + requested
    ? `Only ${product.quantity} available — cart quantity adjusted`
    : `${product.name} added to cart`);
}

function updateCartBadges() {
  const count = getCart().reduce((total, item) => total + item.quantity, 0);
  document.querySelectorAll("[data-cart-count]").forEach(badge => {
    badge.textContent = count;
    badge.hidden = count === 0;
  });
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function productCard(product) {
  const oldPrice = product.oldPrice
    ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>`
    : "";

  const inStock = product.quantity > 0;
  return `
    <article class="product-card">
      <a class="product-card__image" href="product.html?id=${product.id}" aria-label="View ${product.name}">
        <img src="${product.image}" alt="${product.alt}" loading="lazy">
        ${product.badge || !inStock ? `<span class="product-badge">${inStock ? product.badge : "Out of stock"}</span>` : ""}
      </a>
      <div class="product-card__body">
        <p class="eyebrow">${product.category}</p>
        <h3><a href="product.html?id=${product.id}">${product.name}</a></h3>
        <div class="price-row"><strong>${formatPrice(product.price)}</strong>${oldPrice}</div>
        <button class="button button--secondary button--full" type="button" data-add-to-cart="${product.id}" ${inStock ? "" : "disabled"}>${inStock ? "Add to cart" : "Out of stock"}</button>
      </div>
    </article>`;
}

function bindAddToCartButtons(scope = document) {
  scope.querySelectorAll("[data-add-to-cart]").forEach(button => {
    button.addEventListener("click", () => addToCart(button.dataset.addToCart));
  });
}

/* ---------- Navigation ---------- */
function setupMobileMenu() {
  const button = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  if (!button || !nav) return;

  const closeMenu = () => {
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Open navigation");
    nav.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  };

  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") === "true";
    if (open) {
      closeMenu();
      return;
    }

    button.setAttribute("aria-expanded", "true");
    button.setAttribute("aria-label", "Close navigation");
    nav.classList.add("is-open");
    document.body.classList.add("menu-open");
  });

  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));

  document.addEventListener("click", event => {
    if (!nav.classList.contains("is-open")) return;
    if (!nav.contains(event.target) && !button.contains(event.target)) closeMenu();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 850) closeMenu();
  });
}

/* ---------- Home ---------- */
function renderFeaturedProducts() {
  const container = document.querySelector("[data-featured-products]");
  if (!container) return;
  container.innerHTML = catalogue.filter(item => item.featured).slice(0, 4).map(productCard).join("");
  bindAddToCartButtons(container);
}

/* ---------- Shop ---------- */
function setupShop() {
  const grid = document.querySelector("[data-shop-grid]");
  if (!grid) return;

  const search = document.querySelector("[data-product-search]");
  const select = document.querySelector("[data-category-filter]");
  const count = document.querySelector("[data-result-count]");

  [...new Set(catalogue.map(item => item.category))].sort().forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });

  function render() {
    const query = search.value.trim().toLowerCase();
    const category = select.value;
    const results = catalogue.filter(item => {
      const matchesText = `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(query);
      return matchesText && (!category || item.category === category);
    });
    count.textContent = `${results.length} product${results.length === 1 ? "" : "s"}`;
    grid.innerHTML = results.length
      ? results.map(productCard).join("")
      : `<div class="empty-state"><h2>Koi product nahi mila</h2><p>Search ya category ko change karke dekhein.</p></div>`;
    bindAddToCartButtons(grid);
  }

  search.addEventListener("input", render);
  select.addEventListener("change", render);
  render();
}

/* ---------- Product detail ---------- */
function renderProductPage() {
  const container = document.querySelector("[data-product-detail]");
  if (!container) return;

  const id = new URLSearchParams(window.location.search).get("id") || 1;
  const product = findProduct(id);
  if (!product) {
    container.innerHTML = `<div class="empty-state"><h1>Product nahi mila</h1><p>Yeh item available nahi hai.</p><a class="button" href="shop.html">Shop dekhein</a></div>`;
    return;
  }

  document.title = `${product.name} | Haramain Collection`;
  const descriptionMeta = document.querySelector('meta[name="description"]');
  if (descriptionMeta) descriptionMeta.content = product.description;

  const inStock = product.quantity > 0;
  const maxOrderQuantity = Math.min(product.quantity, 10);
  container.innerHTML = `
    <div class="product-detail__media">
      <span class="product-badge">${product.badge || product.category}</span>
      <img src="${product.image}" alt="${product.alt}">
    </div>
    <div class="product-detail__content">
      <p class="eyebrow">${product.category}</p>
      <h1>${product.name}</h1>
      <div class="product-detail__price">${formatPrice(product.price)} ${product.oldPrice ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : ""}</div>
      <p class="stock-status ${inStock ? "is-in-stock" : "is-out-of-stock"}">${inStock ? `${product.quantity} in stock` : "Currently out of stock"}</p>
      <p class="lead">${product.description}</p>
      <ul class="tick-list">${product.details.map(item => `<li>${item}</li>`).join("")}</ul>
      <div class="quantity-add" ${inStock ? "" : "hidden"}>
        <label for="product-quantity">Qty</label>
        <select id="product-quantity" aria-label="Select quantity">${Array.from({length: maxOrderQuantity}, (_, index) => `<option>${index + 1}</option>`).join("")}</select>
        <button class="button" type="button" data-detail-add>Add to cart</button>
      </div>
      <a class="button button--whatsapp button--full" href="https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(`Assalamu Alaikum, I want to know more about ${product.name}.`)}" target="_blank" rel="noopener">Ask on WhatsApp</a>
      <div class="assurance-row"><span>✓ Secure packing</span><span>✓ Shipping across India</span><span>✓ WhatsApp support</span></div>
    </div>`;

  const detailAddButton = container.querySelector("[data-detail-add]");
  if (detailAddButton) detailAddButton.addEventListener("click", () => {
    addToCart(product.id, container.querySelector("#product-quantity").value);
  });

  const related = document.querySelector("[data-related-products]");
  if (related) {
    let items = catalogue.filter(item => item.category === product.category && item.id !== product.id).slice(0, 3);
    if (items.length < 3) items = catalogue.filter(item => item.id !== product.id).slice(0, 3);
    related.innerHTML = items.map(productCard).join("");
    bindAddToCartButtons(related);
  }
}

/* ---------- Cart and WhatsApp checkout ---------- */
function renderCartPage() {
  const itemsContainer = document.querySelector("[data-cart-items]");
  if (!itemsContainer) return;

  const summary = document.querySelector("[data-cart-summary]");
  const empty = document.querySelector("[data-cart-empty]");
  const checkout = document.querySelector("[data-checkout-section]");

  function draw() {
    const cart = getCart()
      .filter(item => findProduct(item.id) && findProduct(item.id).quantity > 0)
      .map(item => ({ ...item, quantity: Math.min(item.quantity, findProduct(item.id).quantity) }));
    saveCart(cart);

    if (!cart.length) {
      itemsContainer.innerHTML = "";
      summary.hidden = true;
      checkout.hidden = true;
      empty.hidden = false;
      return;
    }

    empty.hidden = true;
    summary.hidden = false;
    checkout.hidden = false;
    itemsContainer.innerHTML = cart.map(item => {
      const product = findProduct(item.id);
      return `
        <article class="cart-item">
          <img src="${product.image}" alt="${product.alt}">
          <div class="cart-item__info">
            <p class="eyebrow">${product.category}</p>
            <h2><a href="product.html?id=${product.id}">${product.name}</a></h2>
            <strong>${formatPrice(product.price)}</strong>
            <div class="cart-item__actions">
              <label for="qty-${product.id}">Qty</label>
              <select id="qty-${product.id}" data-cart-quantity="${product.id}">${Array.from({length: Math.min(product.quantity, 10)}, (_, index) => index + 1).map(value => `<option ${value === item.quantity ? "selected" : ""}>${value}</option>`).join("")}</select>
              <button class="text-button" type="button" data-remove-item="${product.id}">Remove</button>
            </div>
          </div>
          <strong class="cart-item__total">${formatPrice(product.price * item.quantity)}</strong>
        </article>`;
    }).join("");

    const subtotal = cart.reduce((total, item) => total + findProduct(item.id).price * item.quantity, 0);
    const couponState = getCouponState(cart, subtotal);
    document.querySelector("[data-cart-subtotal]").textContent = formatPrice(subtotal);
    document.querySelector("[data-cart-total]").textContent = formatPrice(couponState.total);
    const couponMessage = document.querySelector("[data-coupon-message]");
    const discountRow = document.querySelector("[data-cart-discount-row]");
    if (couponMessage) {
      couponMessage.textContent = couponProgressMessage(couponState);
      couponMessage.hidden = !couponMessage.textContent;
      couponMessage.classList.toggle("is-applied", Boolean(couponState.applied));
    }
    if (discountRow) {
      discountRow.hidden = !couponState.applied;
      const code = discountRow.querySelector("[data-coupon-code]");
      const value = discountRow.querySelector("[data-cart-discount]");
      if (code) code.textContent = couponState.applied ? `Discount (${couponState.applied.code})` : "Discount";
      if (value) value.textContent = `−${formatPrice(couponState.discount)}`;
    }

    itemsContainer.querySelectorAll("[data-cart-quantity]").forEach(select => {
      select.addEventListener("change", () => {
        const target = cart.find(item => item.id === Number(select.dataset.cartQuantity));
        target.quantity = Number(select.value);
        saveCart(cart);
        draw();
      });
    });

    itemsContainer.querySelectorAll("[data-remove-item]").forEach(button => {
      button.addEventListener("click", () => {
        saveCart(cart.filter(item => item.id !== Number(button.dataset.removeItem)));
        draw();
      });
    });
  }

  const form = document.querySelector("[data-checkout-form]");
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const cart = getCart();
    if (!cart.length) return;
    const data = new FormData(form);
    const lines = cart.map(item => {
      const product = findProduct(item.id);
      return `• ${product.name} × ${item.quantity} — ${formatPrice(product.price * item.quantity)}`;
    });
    const subtotal = cart.reduce((sum, item) => sum + findProduct(item.id).price * item.quantity, 0);
    const couponState = getCouponState(cart, subtotal);
    const message = [
      "Assalamu Alaikum, I would like to place an order from Haramain Collection.",
      "",
      ...lines,
      "",
      `Subtotal: ${formatPrice(subtotal)}`,
      couponState.applied ? `Discount (${couponState.applied.code}, ${couponState.applied.discountPercent}%): -${formatPrice(couponState.discount)}` : "",
      `Total: ${formatPrice(couponState.total)}`,
      STORE.shippingNote,
      "",
      `Name: ${data.get("name")}`,
      `Phone: ${data.get("phone")}`,
      `Address: ${data.get("address")}`,
      data.get("notes") ? `Notes: ${data.get("notes")}` : ""
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  });

  document.querySelectorAll("[data-upi-id]").forEach(node => node.textContent = STORE.upiId);
  draw();
}

/* ---------- WhatsApp and forms ---------- */
function setupWhatsAppLinks() {
  document.querySelectorAll("[data-whatsapp-link]").forEach(link => {
    const message = link.dataset.message || "Assalamu Alaikum, I would like to know more about Haramain Collection.";
    link.href = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(message)}`;
  });
}

function setupContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const message = `Assalamu Alaikum, my name is ${data.get("name")} (${data.get("phone")}).\n\n${data.get("message")}`;
    window.open(`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  });
}

function setupNewsletterForm() {
  document.querySelectorAll("[data-newsletter-form]").forEach(form => {
    form.addEventListener("submit", event => {
      event.preventDefault();
      showToast("Shukriya! Offers ke liye aapka number save ho gaya.");
      form.reset();
    });
  });
}

function setFooterYear() {
  document.querySelectorAll("[data-year]").forEach(node => node.textContent = new Date().getFullYear());
}
