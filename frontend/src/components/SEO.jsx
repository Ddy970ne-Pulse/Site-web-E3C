import { useEffect } from "react";

const SITE_URL = "https://e3c-construction.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

/**
 * Données structurées JSON-LD LocalBusiness pour Google (rich snippets, SEO local).
 * Injectées une seule fois dans <head>.
 */
const LOCAL_BUSINESS_JSONLD = {
  "@context": "https://schema.org",
  "@type": "GeneralContractor",
  "name": "E3C — Entreprise de Constructions",
  "alternateName": "E3C",
  "description": "Entreprise de construction BTP en Guadeloupe. Maçonnerie, toiture, rénovation, carrelage, peinture. Devis gratuit.",
  "url": SITE_URL,
  "logo": `${SITE_URL}/logo.png`,
  "image": DEFAULT_IMAGE,
  "telephone": "+590690449714",
  "email": "contact@e3c-construction.com",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Guadeloupe",
    "addressRegion": "Guadeloupe",
    "addressCountry": "GP",
    "postalCode": "97100",
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "16.265",
    "longitude": "-61.551",
  },
  "areaServed": {
    "@type": "AdministrativeArea",
    "name": "Guadeloupe",
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Prestations BTP",
    "itemListElement": [
      "Maçonnerie", "Toiture", "Rénovation", "Peinture",
      "Carrelage", "Charpente", "Terrassement", "Plomberie", "Électricité"
    ].map((name) => ({ "@type": "Offer", "itemOffered": { "@type": "Service", name } })),
  },
  "priceRange": "€€",
  "openingHoursSpecification": [
    { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"], "opens": "07:30", "closes": "17:30" },
    { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Saturday"], "opens": "08:00", "closes": "12:00" },
  ],
  "sameAs": [
    `https://wa.me/590690449714`,
  ],
};

function injectJsonLd() {
  if (document.getElementById("e3c-local-business-jsonld")) return;
  const script = document.createElement("script");
  script.id = "e3c-local-business-jsonld";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(LOCAL_BUSINESS_JSONLD);
  document.head.appendChild(script);
}

export function SEO({ title, description, image, url, type = "website" }) {
  useEffect(() => {
    document.title = title
      ? `${title} | E3C — Construction Guadeloupe`
      : "E3C — Entreprise de Constructions | Guadeloupe";

    const setMeta = (selector, content, attr = "name") => {
      let el = document.querySelector(`meta[${attr}="${selector}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, selector);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const desc = description || "E3C, votre entreprise de construction BTP en Guadeloupe. Maçonnerie, toiture, rénovation, carrelage, peinture. Devis gratuit en ligne.";
    const canonical = url ? `${SITE_URL}${url}` : window.location.href;
    const img = image || DEFAULT_IMAGE;

    setMeta("description", desc);
    setMeta("og:title", document.title, "property");
    setMeta("og:description", desc, "property");
    setMeta("og:image", img, "property");
    setMeta("og:url", canonical, "property");
    setMeta("og:type", type, "property");
    setMeta("og:site_name", "E3C — Construction Guadeloupe", "property");
    setMeta("og:locale", "fr_FR", "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", document.title);
    setMeta("twitter:description", desc);
    setMeta("twitter:image", img);

    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonical);

    // JSON-LD injecté une seule fois (sur la home uniquement)
    if (!url || url === "/") {
      injectJsonLd();
    }
  }, [title, description, image, url, type]);

  return null;
}
