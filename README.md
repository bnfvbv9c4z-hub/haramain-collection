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
shop.html           Product catalogue
product.html        Dynamic product details
cart.html           Cart and WhatsApp checkout
about.html          Brand story
contact.html        Contact page
policies.html       Shipping, returns and privacy information
css/style.css       Website styling
js/products.js      Product catalogue data
js/main.js          Navigation, cart and page functionality
images/             Logo, icons and placeholder artwork
```

## Preview locally

Open a terminal in the project folder and run:

```bash
python3 -m http.server 8000
```

Then open [http://127.0.0.1:8000](http://127.0.0.1:8000) in a browser.

## Editing products

Open `js/products.js`. Each product is one item in the `products` array. Copy an existing item, give it a unique ID and update its name, category, price, image, description and other details.

## Before accepting real orders

- Replace the placeholder WhatsApp number in `js/main.js`
- Replace the placeholder UPI ID and QR code
- Confirm product prices, stock and shipping terms
- Add the final domain to the page metadata after deployment

## Deployment

This repository can be published directly with GitHub Pages because the site is completely static.

