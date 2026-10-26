# Haramain Collection

A mobile-first ecommerce website for Islamic gifts, fragrances, Hajj and Umrah essentials, Quran boxes, bakhoor, oud daan and related products.

The website is built with plain HTML, CSS and JavaScript. It does not require npm, a framework or a build step.

## Pages

- Home page with hero, collections, featured products, reviews and FAQ
- Shop page with the complete product catalogue
- Dynamic product detail page
- Working shopping cart saved in the browser
- WhatsApp checkout form
- About, contact and store policy pages

## Project structure

```text
index.html          Home page
admin.html          Private product and stock dashboard
shop.html           Product catalogue
product.html        Dynamic product details
cart.html           Cart and WhatsApp checkout
about.html          Brand story
contact.html        Contact page
policies.html       Shipping, returns and privacy information
css/style.css       Website styling
js/products.js      Product catalogue data
js/main.js          Navigation, cart and page functionality
js/admin.js         Supabase admin and image upload functionality
supabase/schema.sql Database tables, storage and security rules
images/             Logo, icons and placeholder artwork
```

## Product dashboard

The store is connected to Supabase for products, images, categories, prices and stock quantities. Open `/admin.html` and sign in with the approved owner account. Quantity `0` automatically displays **Out of stock** and disables cart ordering for that item.

See `BACKEND_SETUP.md` for the one-time connection and recovery steps. Never commit a Supabase service-role key; the browser configuration uses only the public publishable key.

## Preview locally

Open a terminal in the project folder and run:

```bash
python3 -m http.server 8000
```

Then open [http://127.0.0.1:8000](http://127.0.0.1:8000) in a browser.

## Editing products

Use `admin.html` for normal product and inventory updates. `js/products.js` is the safe fallback catalogue used only if the backend is temporarily unavailable.

## Before accepting real orders

- Replace the placeholder WhatsApp number in `js/main.js`
- Replace the placeholder UPI ID and QR code
- Confirm product prices, stock and shipping terms
- Add the final domain to the page metadata after deployment

## Deployment

This repository is deployed on Netlify. Pushing to the connected GitHub repository triggers a new deployment automatically.

