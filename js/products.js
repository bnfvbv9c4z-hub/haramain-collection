/*
 * Haramain Collection product catalogue
 * -------------------------------------
 * To add a product, copy one object below and change its details.
 * Keep every `id` unique. Categories power the filters on shop.html.
 */
const products = [
  {
    id: 1,
    name: "Noor Gold Electric Oud Daan",
    category: "Oud Daan",
    price: 1499,
    oldPrice: 1799,
    image: "WhatsApp Image 2026-09-27 at 3.27.28 PM.jpeg",
    alt: "Gold electric oud daan incense burner with decorative palm motif",
    badge: "Bestseller",
    featured: true,
    description: "An elegant electric oud and bakhoor burner with a rich gold finish. Designed for convenient, smoke-free charcoal-free fragrance at home.",
    details: ["Electric heating", "Decorative metallic finish", "Suitable for oud chips and bakhoor", "Easy on/off switch"]
  },
  {
    id: 2,
    name: "Sultan Lantern Bakhoor Burner",
    category: "Oud Daan",
    price: 1899,
    oldPrice: 2199,
    image: "WhatsApp Image 2026-09-27 at 3.27.53 PM.jpeg",
    alt: "Lantern style electric bakhoor burner glowing on a dark background",
    badge: "New",
    featured: true,
    description: "A statement lantern-style burner that fills your space with fragrance and a warm decorative glow.",
    details: ["Electric heating", "Warm ambient light", "Premium gold-tone detailing", "For home and gifting"]
  },
  {
    id: 3,
    name: "Mughal Crown Oud Burner",
    category: "Oud Daan",
    price: 1699,
    oldPrice: 1999,
    image: "WhatsApp Image 2026-09-27 at 3.27.51 PM.jpeg",
    alt: "Tall gold electric oud burner with ornate feather design",
    badge: "Popular",
    featured: true,
    description: "A tall, regal oud burner inspired by traditional Mughal ornamentation, made to elevate festive and everyday spaces.",
    details: ["Tall decorative profile", "Electric operation", "Antique gold finish", "Ideal wedding gift"]
  },
  {
    id: 4,
    name: "Crystal Noor Electric Burner",
    category: "Oud Daan",
    price: 1599,
    image: "WhatsApp Image 2026-09-27 at 3.27.54 PM.jpeg",
    alt: "Silver electric incense burner with crystal detail and floral lattice",
    badge: "Limited",
    featured: true,
    description: "A refined silver-finish burner with floral lattice work and a crystal centre for a graceful premium look.",
    details: ["Silver-tone finish", "Crystal accent", "Electric heating", "Suitable for bakhoor"]
  },
  {
    id: 5,
    name: "Palm Heritage Oud Daan Set",
    category: "Oud Daan",
    price: 1199,
    oldPrice: 1399,
    image: "WhatsApp Image 2026-09-27 at 3.27.56 PM.jpeg",
    alt: "Pair of black and silver palm motif electric oud burners",
    badge: "Value Pick",
    featured: false,
    description: "A compact heritage-inspired electric burner available in contrasting metallic finishes.",
    details: ["Compact tabletop size", "Electric heating", "Palm motif", "Colour subject to availability"]
  },
  {
    id: 6,
    name: "Royal Geometric Bakhoor Burner",
    category: "Oud Daan",
    price: 1799,
    image: "WhatsApp Image 2026-09-27 at 3.27.57 PM.jpeg",
    alt: "Gold geometric electric bakhoor burner with glowing lattice pattern",
    badge: "Premium",
    featured: false,
    description: "A dramatic geometric burner that combines traditional fragrance rituals with convenient electric heating.",
    details: ["Geometric lattice", "Electric operation", "Rich gold finish", "Statement décor piece"]
  },
  {
    id: 7,
    name: "Ayat Calligraphy Sculpture",
    category: "Islamic Décor",
    price: 899,
    image: "WhatsApp Image 2026-09-27 at 3.28.00 PM.jpeg",
    alt: "Cream and gold Islamic calligraphy tabletop sculpture",
    badge: "Gift Pick",
    featured: false,
    description: "A sculptural tabletop accent with calligraphy-inspired detailing for prayer rooms, shelves and thoughtful gifting.",
    details: ["Tabletop décor", "Cream and gold finish", "Calligraphy-inspired design", "Gift-ready style"]
  },
  {
    id: 8,
    name: "Embroidered Islamic Wall Hanging",
    category: "Islamic Décor",
    price: 749,
    image: "WhatsApp Image 2026-09-27 at 3.29.12 PM.jpeg",
    alt: "Traditional embroidered Islamic calligraphy wall hanging with floral border",
    badge: "Handcrafted Look",
    featured: false,
    description: "A richly coloured, traditional wall hanging with floral embroidery and Islamic calligraphy.",
    details: ["Decorative embroidery", "Ready to hang", "Traditional floral border", "Suitable for home or gifting"]
  },
  {
    id: 9,
    name: "Maroon Velvet Quran Gift Box",
    category: "Quran & Gifts",
    price: 2499,
    image: "images/placeholder-quran.svg",
    alt: "Maroon and gold placeholder illustration for a Quran gift box",
    badge: "Coming Soon",
    featured: false,
    description: "A premium Quran presentation box planned in our signature maroon and antique-gold palette. Replace the placeholder when the real photo is ready.",
    details: ["Premium gift presentation", "Velvet-look finish", "Ideal for weddings and special occasions", "Final design may vary"]
  },
  {
    id: 10,
    name: "Complete Hajj & Umrah Kit",
    category: "Hajj & Umrah",
    price: 3499,
    image: "images/placeholder-hajj-kit.svg",
    alt: "Cream and maroon placeholder illustration for a complete Hajj and Umrah kit",
    badge: "Essential",
    featured: true,
    description: "A convenient all-in-one travel kit planned for Hajj and Umrah pilgrims. Confirm current contents with us on WhatsApp before ordering.",
    details: ["Travel-ready essentials", "Organised carry format", "Suitable for gifting", "Contents confirmed on WhatsApp"]
  },
  {
    id: 11,
    name: "Royal Musk Attar",
    category: "Attar & Perfume",
    price: 599,
    oldPrice: 699,
    image: "images/placeholder-attar.svg",
    alt: "Gold attar perfume bottle placeholder on a maroon background",
    badge: "Alcohol Free",
    featured: true,
    description: "A warm, refined attar concept with musky depth, designed for everyday wear and gifting.",
    details: ["Concentrated perfume oil", "Alcohol-free concept", "Long-wearing fragrance", "Compact gifting size"]
  },
  {
    id: 12,
    name: "Zamzam Travel Bottle Set",
    category: "Zamzam Bottles",
    price: 299,
    image: "images/placeholder-zamzam.svg",
    alt: "Cream and gold placeholder illustration for empty Zamzam bottles",
    badge: "Travel Ready",
    featured: false,
    description: "Empty bottles prepared for secure Zamzam water packing and distribution after your journey.",
    details: ["Empty bottle set", "Travel-friendly design", "Secure cap", "Available in multiple quantities"]
  }
];

// Make the catalogue accessible to main.js when pages are opened directly.
window.HARAMAIN_PRODUCTS = products;
