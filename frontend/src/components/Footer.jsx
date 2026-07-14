import { Link, useNavigate } from "react-router-dom";
import { MapPin, User, LogIn } from "lucide-react";

const WHATSAPP_SVG = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const services = [
  "Maçonnerie & Gros Oeuvre", "Charpente & Ossature", "Toiture & Couverture",
  "Carrelage & Revêtements", "Rénovation Intérieure", "Peinture & Enduits",
  "Terrassement & VRD", "Plomberie & Sanitaire", "Électricité Générale",
];

export default function Footer({ whatsapp }) {
  const navigate = useNavigate();

  const scrollTo = (id) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer
      data-testid="footer"
      className="bg-[#EEE9DF] dark:bg-[#050505] border-t border-black/8 dark:border-white/5 pt-16 md:pt-20 pb-8"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">

          {/* Brand — 2 cols */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-3 mb-5 group">
              <div className="w-12 h-12 bg-[#D4AF37] flex items-center justify-center rounded-sm">
                <span className="font-outfit font-black text-black text-base">E3C</span>
              </div>
              <div>
                <p className="font-outfit font-bold text-[#1A1A1A] dark:text-white text-lg group-hover:text-[#D4AF37] transition-colors">
                  E3C — Entreprise de constructions
                </p>
                <p className="text-sm text-[#9E9E9E] dark:text-gray-500 uppercase tracking-widest">Guadeloupe · BTP</p>
              </div>
            </Link>
            <p className="text-[#737373] dark:text-gray-400 text-base leading-relaxed mb-5">
              Votre partenaire de confiance pour tous vos travaux de construction
              et rénovation en Guadeloupe. Qualité, réactivité et expertise locale.
            </p>

            <div className="flex flex-wrap gap-2 mb-5">
              <a
                href={`https://wa.me/${whatsapp}?text=Bonjour%20E3C%2C%20je%20souhaite%20un%20devis%20gratuit.`}
                target="_blank" rel="noopener noreferrer"
                data-testid="footer-whatsapp"
                className="inline-flex items-center gap-2 bg-green-600 text-white font-semibold text-sm px-4 py-2.5 hover:bg-green-500 transition-colors rounded-sm"
              >
                <WHATSAPP_SVG /> WhatsApp — Devis gratuit
              </a>
            </div>

            {/* Account links */}
            <div className="space-y-2">
              <Link to="/connexion" className="flex items-center gap-2 text-[#737373] dark:text-gray-400 hover:text-[#D4AF37] text-sm transition-colors">
                <LogIn size={12} /> Se connecter à l'espace client
              </Link>
              <Link to="/inscription" className="flex items-center gap-2 text-[#737373] dark:text-gray-400 hover:text-[#D4AF37] text-sm transition-colors">
                <User size={12} /> Créer un compte client
              </Link>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-outfit font-semibold text-[#1A1A1A] dark:text-white text-base uppercase tracking-widest mb-4">
              Navigation
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "Accueil", to: "/" },
                { label: "Nos Prestations", scroll: "#services" },
                { label: "Réalisations", scroll: "#gallery" },
                { label: "Zone d'intervention", scroll: "#zone" },
                { label: "FAQ", scroll: "#faq" },
              ].map((item) => (
                <li key={item.label}>
                  {item.to ? (
                    <Link to={item.to} className="text-[#737373] dark:text-gray-400 hover:text-[#D4AF37] text-base transition-colors">{item.label}</Link>
                  ) : (
                    <button onClick={() => scrollTo(item.scroll)} className="text-[#737373] dark:text-gray-400 hover:text-[#D4AF37] text-base transition-colors">{item.label}</button>
                  )}
                </li>
              ))}
              <li>
                <Link to="/contact" className="text-[#737373] dark:text-gray-400 hover:text-[#D4AF37] text-base transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-outfit font-semibold text-[#1A1A1A] dark:text-white text-base uppercase tracking-widest mb-4">
              Prestations
            </h4>
            <ul className="space-y-2">
              {services.map((s) => (
                <li key={s} className="text-[#9E9E9E] dark:text-gray-500 text-sm">{s}</li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h4 className="font-outfit font-semibold text-[#1A1A1A] dark:text-white text-base uppercase tracking-widest mb-4">
              Coordonnées
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={13} className="text-[#D4AF37] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-[#9E9E9E] dark:text-gray-500 mb-0.5">Zone d'intervention</p>
                  <p className="text-[#1A1A1A] dark:text-white text-base">Guadeloupe (971)</p>
                  <p className="text-[#9E9E9E] dark:text-gray-500 text-sm">Toutes communes</p>
                </div>
              </li>
            </ul>

            <button
              onClick={() => navigate("/contact")}
              className="mt-5 w-full text-center text-sm font-bold text-black bg-[#D4AF37] py-3 hover:bg-[#E6C65A] transition-colors rounded-sm"
              data-testid="footer-contact-btn"
            >
              Formulaire de contact
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-black/8 dark:border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="font-outfit font-black text-5xl text-black/5 dark:text-white/5 select-none">E3C</span>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link to="/mentions-legales" className="text-[#ADADAD] dark:text-gray-600 hover:text-[#737373] dark:hover:text-gray-400 text-sm transition-colors">Mentions légales</Link>
            <span className="text-[#CCCCCC] dark:text-gray-700 text-sm">·</span>
            <Link to="/cgv" className="text-[#ADADAD] dark:text-gray-600 hover:text-[#737373] dark:hover:text-gray-400 text-sm transition-colors">CGV</Link>
            <span className="text-[#CCCCCC] dark:text-gray-700 text-sm">·</span>
            <span className="text-[#ADADAD] dark:text-gray-600 text-sm">RGPD</span>
          </div>
          <div className="text-center md:text-right">
            <p className="text-[#ADADAD] dark:text-gray-600 text-sm">
              &copy; {new Date().getFullYear()} E3C — Entreprise de Constructions · Guadeloupe (971)
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
