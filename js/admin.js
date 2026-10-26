/* Haramain Collection — private Supabase product dashboard */

let adminClient;
let adminProducts = [];
let adminCoupons = [];

const $ = selector => document.querySelector(selector);

document.addEventListener("DOMContentLoaded", initialiseAdmin);

async function initialiseAdmin() {
  const backend = window.HARAMAIN_BACKEND;
  if (!backend?.isConfigured() || !window.supabase) {
    $("[data-admin-setup]").hidden = false;
    return;
  }

  adminClient = window.supabase.createClient(backend.url, backend.anonKey);
  bindAdminEvents();
  const { data: { session } } = await adminClient.auth.getSession();
  await showCorrectView(session);

  adminClient.auth.onAuthStateChange((_event, nextSession) => {
    window.setTimeout(() => showCorrectView(nextSession), 0);
  });
}

function bindAdminEvents() {
  $("[data-login-form]").addEventListener("submit", login);
  $("[data-admin-signout]").addEventListener("click", () => adminClient.auth.signOut());
  $("[data-product-form]").addEventListener("submit", saveProduct);
  $("[data-new-product]").addEventListener("click", resetEditor);
  $("[data-cancel-edit]").addEventListener("click", resetEditor);
  $("[name='image']").addEventListener("change", previewImage);
  $("[data-admin-search]").addEventListener("input", renderAdminProducts);
  $("[data-import-products]").addEventListener("click", importCurrentProducts);
  document.querySelectorAll("[data-admin-tab]").forEach(button => button.addEventListener("click", () => switchAdminView(button.dataset.adminTab)));
  $("[data-settings-form]").addEventListener("submit", saveSettings);
  $("[name='hero_image']").addEventListener("change", previewHeroImage);
  $("[data-coupon-form]").addEventListener("submit", saveCoupon);
  $("[data-cancel-coupon]").addEventListener("click", resetCouponForm);
}

async function showCorrectView(session) {
  $("[data-admin-login]").hidden = Boolean(session);
  $("[data-admin-dashboard]").hidden = !session;
  $("[data-admin-signout]").hidden = !session;
  if (session) await Promise.all([loadProducts(), loadSettings(), loadCoupons()]);
}

function switchAdminView(view) {
  document.querySelectorAll("[data-admin-tab]").forEach(button => button.classList.toggle("is-active", button.dataset.adminTab === view));
  document.querySelectorAll("[data-admin-view]").forEach(section => section.hidden = section.dataset.adminView !== view);
  $("[data-new-product]").hidden = view !== "products";
}

async function login(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $("[data-login-message]");
  message.textContent = "Signing in…";
  const { error } = await adminClient.auth.signInWithPassword({
    email: form.elements.namedItem("email").value.trim(),
    password: form.elements.namedItem("password").value
  });
  message.textContent = error ? "Sign-in failed. Check the owner email and password." : "";
}

async function loadProducts() {
  const list = $("[data-admin-products]");
  list.innerHTML = "<p>Loading products…</p>";
  const { data, error } = await adminClient.from("products").select("*").order("updated_at", { ascending: false });
  if (error) {
    list.innerHTML = `<p class="form-message is-error">${escapeHtml(error.message)}</p>`;
    return;
  }
  adminProducts = data || [];
  $("[data-import-products]").hidden = adminProducts.length > 0;
  updateStats();
  renderAdminProducts();
}

async function importCurrentProducts() {
  const button = $("[data-import-products]");
  const source = window.HARAMAIN_PRODUCTS || [];
  if (!source.length) return;
  button.disabled = true;
  button.textContent = "Importing…";
  const rows = source.map(product => ({
    name: product.name,
    category: product.category,
    price: product.price,
    old_price: product.oldPrice || null,
    description: product.description,
    details: product.details || [],
    image_url: product.image,
    alt_text: product.alt || product.name,
    badge: product.badge || null,
    featured: Boolean(product.featured),
    quantity: Number(product.quantity) || 10,
    active: true
  }));
  const { error } = await adminClient.from("products").insert(rows);
  if (error) {
    button.disabled = false;
    button.textContent = "Import failed — try again";
    return;
  }
  button.textContent = "Imported successfully";
  await loadProducts();
}

async function loadSettings() {
  const { data, error } = await adminClient.from("store_settings").select("*").eq("id", 1).maybeSingle();
  if (error) {
    $("[data-settings-message]").textContent = "Store settings table is not ready yet.";
    return;
  }
  const settings = data || {};
  const form = $("[data-settings-form]");
  Object.entries(settings).forEach(([name, value]) => {
    const field = form.elements.namedItem(name);
    if (!field) return;
    if (field.type === "checkbox") field.checked = Boolean(value);
    else field.value = value ?? "";
  });
  form.elements.namedItem("current_hero_image_url").value = settings.hero_image_url || "";
  const preview = $("[data-hero-preview]");
  preview.src = settings.hero_image_url || "";
  preview.hidden = !settings.hero_image_url;
}

async function saveSettings(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const message = $("[data-settings-message]");
  const heroFile = data.get("hero_image");
  let heroImageUrl = data.get("current_hero_image_url") || "";
  message.textContent = heroFile?.size ? "Uploading hero image…" : "Saving…";
  message.classList.remove("is-error");
  try {
    if (heroFile?.size) heroImageUrl = await uploadStorefrontImage(heroFile, "hero");
  } catch (error) {
    message.textContent = error.message || "Hero image could not be uploaded.";
    message.classList.add("is-error");
    return;
  }
  const payload = {
    id: 1,
    store_name: data.get("store_name").trim(),
    announcement_text: data.get("announcement_text").trim(),
    announcement_enabled: data.get("announcement_enabled") === "on",
    hero_eyebrow: data.get("hero_eyebrow").trim(),
    hero_title: data.get("hero_title").trim(),
    hero_copy: data.get("hero_copy").trim(),
    hero_note: data.get("hero_note").trim(),
    hero_primary_label: data.get("hero_primary_label").trim(),
    hero_primary_link: data.get("hero_primary_link").trim(),
    hero_image_url: heroImageUrl,
    primary_color: data.get("primary_color"),
    primary_dark_color: data.get("primary_dark_color"),
    accent_color: data.get("accent_color"),
    background_color: data.get("background_color"),
    whatsapp_number: data.get("whatsapp_number").replace(/\D/g, ""),
    upi_id: data.get("upi_id").trim(),
    footer_copy: data.get("footer_copy").trim(),
    shipping_note: data.get("shipping_note").trim()
  };
  const { error } = await adminClient.from("store_settings").upsert(payload);
  message.textContent = error ? error.message : "Storefront settings saved. Refresh the shop to see the changes.";
  message.classList.toggle("is-error", Boolean(error));
}

async function uploadStorefrontImage(file, prefix) {
  if (file.size > 5 * 1024 * 1024) throw new Error("Photo must be smaller than 5 MB.");
  const extension = file.name.split(".").pop().toLowerCase();
  const path = `storefront/${Date.now()}-${prefix}.${extension}`;
  const { error } = await adminClient.storage.from("product-images").upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return adminClient.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

function previewHeroImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const preview = $("[data-hero-preview]");
  preview.src = URL.createObjectURL(file);
  preview.hidden = false;
}

async function loadCoupons() {
  const list = $("[data-admin-coupons]");
  const { data, error } = await adminClient.from("coupons").select("*").order("priority", { ascending: false });
  if (error) {
    list.innerHTML = `<p class="form-message is-error">Coupons table is not ready yet.</p>`;
    return;
  }
  adminCoupons = data || [];
  renderCoupons();
}

function renderCoupons() {
  const list = $("[data-admin-coupons]");
  if (!adminCoupons.length) {
    list.innerHTML = `<div class="empty-state"><h3>No coupons yet</h3><p>Create your first automatic offer.</p></div>`;
    return;
  }
  list.innerHTML = adminCoupons.map(coupon => `
    <article class="admin-coupon ${coupon.active ? "" : "is-hidden"}">
      <div><p class="eyebrow">${coupon.active ? "Live" : "Inactive"}</p><h3>${escapeHtml(coupon.code)} · ${Number(coupon.discount_percent)}% off</h3>
      <p>${escapeHtml(coupon.label)} · Min ${formatAdminPrice(coupon.min_cart_value)} · ${coupon.min_items} item${coupon.min_items === 1 ? "" : "s"}</p></div>
      <button class="button button--secondary" type="button" data-edit-coupon="${coupon.id}">Edit</button>
    </article>`).join("");
  list.querySelectorAll("[data-edit-coupon]").forEach(button => button.addEventListener("click", () => editCoupon(button.dataset.editCoupon)));
}

async function saveCoupon(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const id = data.get("id");
  const message = $("[data-coupon-message-admin]");
  const payload = {
    code: data.get("code").trim().toUpperCase().replace(/\s+/g, ""),
    label: data.get("label").trim(),
    discount_percent: Number(data.get("discount_percent")),
    min_cart_value: Number(data.get("min_cart_value")),
    min_items: Number(data.get("min_items")),
    priority: Number(data.get("priority")) || 0,
    auto_apply: data.get("auto_apply") === "on",
    active: data.get("active") === "on"
  };
  const query = id ? adminClient.from("coupons").update(payload).eq("id", id) : adminClient.from("coupons").insert(payload);
  const { error } = await query;
  message.textContent = error ? error.message : id ? "Coupon updated." : "Coupon created.";
  message.classList.toggle("is-error", Boolean(error));
  if (!error) {
    resetCouponForm(false);
    await loadCoupons();
  }
}

function editCoupon(id) {
  const coupon = adminCoupons.find(item => String(item.id) === String(id));
  if (!coupon) return;
  const form = $("[data-coupon-form]");
  const field = name => form.elements.namedItem(name);
  ["id", "code", "label", "discount_percent", "min_cart_value", "min_items", "priority"].forEach(name => field(name).value = coupon[name] ?? "");
  field("auto_apply").checked = Boolean(coupon.auto_apply);
  field("active").checked = Boolean(coupon.active);
  $("[data-coupon-title]").textContent = "Edit coupon";
  $("[data-cancel-coupon]").hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetCouponForm(scroll = true) {
  const form = $("[data-coupon-form]");
  form.reset();
  form.elements.namedItem("id").value = "";
  form.elements.namedItem("auto_apply").checked = true;
  $("[data-coupon-title]").textContent = "Create coupon";
  $("[data-cancel-coupon]").hidden = true;
  if (scroll) form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderAdminProducts() {
  const list = $("[data-admin-products]");
  const query = $("[data-admin-search]").value.trim().toLowerCase();
  const filtered = adminProducts.filter(product => `${product.name} ${product.category}`.toLowerCase().includes(query));
  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state"><h3>No products found</h3><p>Add your first product using the form.</p></div>`;
    return;
  }
  list.innerHTML = filtered.map(product => `
    <article class="admin-product ${product.active ? "" : "is-hidden"}">
      <img src="${escapeHtml(product.image_url || "images/placeholder-quran.svg")}" alt="${escapeHtml(product.alt_text || product.name)}">
      <div class="admin-product__content">
        <p class="eyebrow">${escapeHtml(product.category)}</p>
        <h3>${escapeHtml(product.name)}</h3>
        <p><strong>${formatAdminPrice(product.price)}</strong> · <span class="${product.quantity > 0 ? "is-in-stock" : "is-out-of-stock"}">${product.quantity > 0 ? `${product.quantity} in stock` : "Out of stock"}</span></p>
        <div class="admin-product__actions">
          <button class="button button--secondary" type="button" data-edit-product="${product.id}">Edit</button>
          <button class="text-button" type="button" data-stock-change="${product.id}" data-delta="-1" ${product.quantity <= 0 ? "disabled" : ""}>−1 stock</button>
          <button class="text-button" type="button" data-stock-change="${product.id}" data-delta="1">+1 stock</button>
        </div>
      </div>
    </article>`).join("");

  list.querySelectorAll("[data-edit-product]").forEach(button => button.addEventListener("click", () => editProduct(button.dataset.editProduct)));
  list.querySelectorAll("[data-stock-change]").forEach(button => button.addEventListener("click", () => changeStock(button.dataset.stockChange, button.dataset.delta)));
}

function updateStats() {
  $("[data-stat-total]").textContent = adminProducts.length;
  $("[data-stat-low]").textContent = adminProducts.filter(item => item.quantity > 0 && item.quantity <= 5).length;
  $("[data-stat-out]").textContent = adminProducts.filter(item => item.quantity <= 0).length;
}

async function saveProduct(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const saveButton = $("[data-save-product]");
  const message = $("[data-product-message]");
  const formData = new FormData(form);
  const id = formData.get("id");
  const file = formData.get("image");

  saveButton.disabled = true;
  saveButton.textContent = "Saving…";
  message.textContent = "";

  try {
    let imageUrl = formData.get("current_image_url") || "";
    if (file && file.size) imageUrl = await uploadProductImage(file);
    if (!imageUrl) throw new Error("Please select a product photo.");

    const payload = {
      name: formData.get("name").trim(),
      category: formData.get("category").trim(),
      price: Number(formData.get("price")),
      old_price: formData.get("old_price") ? Number(formData.get("old_price")) : null,
      quantity: Number(formData.get("quantity")),
      badge: formData.get("badge").trim() || null,
      description: formData.get("description").trim(),
      details: formData.get("details").split("\n").map(item => item.trim()).filter(Boolean),
      alt_text: formData.get("alt_text").trim() || formData.get("name").trim(),
      image_url: imageUrl,
      featured: formData.get("featured") === "on",
      active: formData.get("active") === "on"
    };

    const query = id
      ? adminClient.from("products").update(payload).eq("id", id)
      : adminClient.from("products").insert(payload);
    const { error } = await query;
    if (error) throw error;

    message.textContent = id ? "Product updated successfully." : "Product added successfully.";
    resetEditor(false);
    await loadProducts();
  } catch (error) {
    message.textContent = error.message || "The product could not be saved.";
    message.classList.add("is-error");
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "Save product";
  }
}

async function uploadProductImage(file) {
  if (file.size > 5 * 1024 * 1024) throw new Error("Photo must be smaller than 5 MB.");
  const extension = file.name.split(".").pop().toLowerCase();
  const safeName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase().replace(/^-|-$/g, "");
  const path = `${Date.now()}-${safeName || "product"}.${extension}`;
  const { error } = await adminClient.storage.from("product-images").upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return adminClient.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

function editProduct(id) {
  const product = adminProducts.find(item => String(item.id) === String(id));
  if (!product) return;
  const form = $("[data-product-form]");
  const field = name => form.elements.namedItem(name);
  field("id").value = product.id;
  field("current_image_url").value = product.image_url || "";
  field("name").value = product.name;
  field("category").value = product.category;
  field("price").value = product.price;
  field("old_price").value = product.old_price || "";
  field("quantity").value = product.quantity;
  field("badge").value = product.badge || "";
  field("description").value = product.description || "";
  field("details").value = (product.details || []).join("\n");
  field("alt_text").value = product.alt_text || "";
  field("featured").checked = Boolean(product.featured);
  field("active").checked = Boolean(product.active);
  const preview = $("[data-image-preview]");
  preview.src = product.image_url || "";
  preview.hidden = !product.image_url;
  $("[data-editor-title]").textContent = "Edit product";
  $("[data-cancel-edit]").hidden = false;
  $("[data-editor-panel]").scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetEditor(scroll = true) {
  const form = $("[data-product-form]");
  form.reset();
  form.elements.namedItem("active").checked = true;
  form.elements.namedItem("id").value = "";
  form.elements.namedItem("current_image_url").value = "";
  $("[data-image-preview]").hidden = true;
  $("[data-editor-title]").textContent = "Add a new product";
  $("[data-cancel-edit]").hidden = true;
  $("[data-product-message]").classList.remove("is-error");
  if (scroll) $("[data-editor-panel]").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function changeStock(id, delta) {
  const product = adminProducts.find(item => String(item.id) === String(id));
  if (!product) return;
  const quantity = Math.max(0, Number(product.quantity) + Number(delta));
  const { error } = await adminClient.from("products").update({ quantity }).eq("id", id);
  if (error) {
    window.alert("Stock could not be updated. Please try again.");
    return;
  }
  await loadProducts();
}

function previewImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const preview = $("[data-image-preview]");
  preview.src = URL.createObjectURL(file);
  preview.hidden = false;
}

function formatAdminPrice(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}
