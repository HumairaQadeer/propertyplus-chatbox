const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// --- Demo data you can replace with your DB later ---
const properties = [
  { id: 1, city: "Lahore",  type: "house",    price: 15000000, beds: 4, baths: 3, area: "DHA Phase 6" },
  { id: 2, city: "Karachi", type: "apartment", price: 9000000,  beds: 2, baths: 2, area: "Clifton"     },
  { id: 3, city: "Islamabad", type: "plot",    price: 6500000,  beds: 0, baths: 0, area: "B-17"        },
  { id: 4, city: "Lahore",  type: "apartment", price: 12000000, beds: 3, baths: 3, area: "Gulberg"     }
];

const services = [
  "Property buying & selling",
  "Rental management",
  "Legal & documentation assistance",
  "Property valuation",
  "Marketing & listing services"
];

// --- Utility: simple property search ---
function searchProperties({ city, type, maxPrice, minBeds }) {
  return properties.filter(p =>
    (!city || p.city.toLowerCase() === city.toLowerCase()) &&
    (!type || p.type.toLowerCase() === type.toLowerCase()) &&
    (!maxPrice || p.price <= Number(maxPrice)) &&
    (!minBeds || p.beds >= Number(minBeds))
  );
}

// --- Health check (Render pings this) ---
app.get("/health", (_req, res) => res.send("ok"));

// --- Optional: browse properties via API ---
app.get("/properties", (req, res) => {
  const results = searchProperties({
    city: req.query.city,
    type: req.query.type,
    maxPrice: req.query.maxPrice,
    minBeds: req.query.minBeds
  });
  res.json({ count: results.length, results });
});

// --- Core chatbot endpoint ---
app.post("/message", (req, res) => {
  const textRaw = (req.body.message || "").trim();
  if (!textRaw) return res.json({ reply: "Please type a message." });

  const text = textRaw.toLowerCase();

  // 1) Greetings
  if (/(^|\s)(hi|hello|hey|salam|assalam)/.test(text)) {
    return res.json({
      reply: "Hi there! Welcome to PropertyPlus. Ask me about properties, prices, or our services."
    });
  }

  // 2) Services
  if (text.includes("service") || text.includes("what do you do")) {
    return res.json({
      reply: `We offer: ${services.join(", ")}. What are you looking for?`
    });
  }

  // 3) Contact
  if (text.includes("contact") || text.includes("phone") || text.includes("email")) {
    return res.json({
      reply: "You can reach us at support@propertyplus.live or +92-300-0000000."
    });
  }

  // 4) Property search (very simple keyword extraction)
  // Examples: "show apartments in Lahore under 1.5 crore with 3 beds"
  const cityMatch = text.match(/\b(lahore|karachi|islamabad|rawalpindi|peshawar)\b/);
  const typeMatch = text.match(/\b(apartment|house|plot|villa)\b/);
  const bedsMatch = text.match(/(\d+)\s*(bed|beds|bedroom)/);
  // price: match numbers like 15000000 or "1.5 crore" or "90 lac"
  let maxPrice = null;
  const priceNumber = text.match(/(\d{6,})/); // raw number
  const crore = text.match(/(\d+(\.\d+)?)\s*crore/);
  const lac = text.match(/(\d+(\.\d+)?)\s*(lac|lakh)/);

  if (priceNumber) maxPrice = Number(priceNumber[1]);
  if (crore) maxPrice = Math.round(Number(crore[1]) * 10000000);
  if (lac)   maxPrice = Math.round(Number(lac[1]) * 100000);

  if (text.includes("show") || text.includes("find") || text.includes("price") || cityMatch || typeMatch) {
    const results = searchProperties({
      city: cityMatch?.[0],
      type: typeMatch?.[0],
      maxPrice,
      minBeds: bedsMatch ? Number(bedsMatch[1]) : null
    });

    if (results.length === 0) {
      return res.json({
        reply: "I couldn't find matching properties. Try another city/type/price."
      });
    }

    const top = results.slice(0, 3).map(p =>
      `#${p.id} ${p.type} in ${p.area}, ${p.city} — PKR ${p.price.toLocaleString()} (${p.beds} beds, ${p.baths} baths)`
    ).join("\n");

    return res.json({
      reply: `Here are ${results.length} match(es). Top results:\n${top}\n\nYou can refine by saying things like: "apartments in Lahore under 1.2 crore with 3 beds".`
    });
  }

  // 5) Fallback
  return res.json({
    reply: "I'm here to help with properties, prices, or our services. Try: 'apartments in Lahore under 1.2 crore'."
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`PropertyPlus bot listening on port ${PORT}`));
