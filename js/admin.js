/* Haramain Collection — private Supabase product dashboard */

let adminClient;
let adminProducts = [];

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
}

async function showCorrectView(session) {
  $("[data-admin-login]").hidden = Boolean(session);
  $("[data-admin-dashboard]").hidden = !session;
  $("[data-admin-signout]").hidden = !session;
  if (session) await loadProducts();
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
