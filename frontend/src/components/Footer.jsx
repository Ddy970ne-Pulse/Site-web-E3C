import { Phone, MapPin, Mail } from "lucide-react";

const navLinks = [
  { label: "Prestations", href: "#services" },
  { label: "Réalisations", href: "#gallery" },
  { label: "Zone d'intervention", href: "#zone" },
  { label: "Contact", href: "#contact" },
  { label: "FAQ", href: "#faq" },
];

const services = [
  "Maçonnerie & Gros Oeuvre",
  "Charpente & Ossature",
  "Toiture & Couverture",
  "Carrelage & Revêtements",
  "Rénovation Intérieure",
  "Peinture & Enduits",
  "Terrassement & VRD",
  "Plomberie & Sanitaire",
  "Électricité Générale",
];

export default function Footer({ whatsapp, phone }) {
  const handleNav = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer
      data-testid="footer"
      className="bg-[#050505] border-t border-white/5 pt-16 md:pt-24 pb-8"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-[#D4AF37] flex items-center justify-center">
                <span className="font-outfit font-black text-black text-sm leading-none tracking-tight">
                  E3C
                </span>
              </div>
              <div>
                <p className="font-outfit font-bold text-white text-base leading-tight">E3C</p>
                <p className="text-xs text-gray-500 uppercase tracking-widest">
                  Constructions
                </p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Votre partenaire de confiance pour tous vos travaux BTP en
              Guadeloupe. Qualité, réactivité et savoir-faire local.
            </p>
            <a
              href={`https://wa.me/${whatsapp}?text=Bonjour%20E3C%2C%20je%20souhaite%20un%20devis%20gratuit.`}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="footer-whatsapp"
              className="inline-flex items-center gap-2 bg-green-600 text-white font-semibold text-xs px-4 py-2.5 hover:bg-green-500 transition-colors rounded-sm"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-outfit font-semibold text-white text-sm uppercase tracking-widest mb-5">
              Navigation
            </h4>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => handleNav(link.href)}
                    className="text-gray-400 hover:text-[#D4AF37] text-sm transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-outfit font-semibold text-white text-sm uppercase tracking-widest mb-5">
              Nos Prestations
            </h4>
            <ul className="space-y-2">
              {services.map((s) => (
                <li key={s} className="text-gray-400 text-sm">
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-outfit font-semibold text-white text-sm uppercase tracking-widest mb-5">
              Contact
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone size={14} strokeWidth={1.5} className="text-[#D4AF37] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Téléphone / WhatsApp</p>
                  <a
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    data-testid="footer-phone"
                    className="text-white text-sm font-medium hover:text-[#D4AF37] transition-colors"
                  >
                    {phone}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={14} strokeWidth={1.5} className="text-[#D4AF37] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Zone d'intervention</p>
                  <p className="text-white text-sm">Guadeloupe (971)</p>
                  <p className="text-gray-500 text-xs">Toutes communes</p>
                </div>
              </li>
            </ul>

            <div className="mt-6 p-4 bg-[#D4AF37]/5 border border-[#D4AF37]/15 rounded-sm">
              <p className="text-xs text-gray-400 mb-1">Devis 100% Gratuit</p>
              <p className="text-[#D4AF37] font-bold text-sm">Sans engagement</p>
              <p className="text-xs text-gray-500">Réponse rapide garantie</p>
            </div>
          </div>
        </div>

        {/* Decorative E3C */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className="font-outfit font-black text-5xl md:text-7xl text-white/3 select-none"
              aria-hidden="true"
            >
              E3C
            </span>
          </div>
          <div className="text-center md:text-right">
            <p className="text-gray-500 text-xs">
              &copy; {new Date().getFullYear()} E3C — Entreprise de Constructions. Tous droits
              réservés.
            </p>
            <p className="text-gray-600 text-xs mt-1">
              Guadeloupe · BTP · Constructions & Rénovations
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
