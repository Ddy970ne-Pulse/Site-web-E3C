import { useEffect } from "react";

const SITE_URL = "https://e3c-construction.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

export function SEO({ title, description, image, url, type = "website" }) {
  useEffect(() => {
    // Title
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

    // Canonical link
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonical);
  }, [title, description, image, url, type]);

  return null;
}
