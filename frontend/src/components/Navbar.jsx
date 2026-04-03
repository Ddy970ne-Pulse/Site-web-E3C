import { useState, useEffect } from "react";
import { Phone, Menu, X } from "lucide-react";

const navLinks = [
  { label: "Prestations", href: "#services" },
  { label: "Réalisations", href: "#gallery" },
  { label: "Zone", href: "#zone" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar({ whatsapp, phone }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      data-testid="navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/5 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 md:h-20 flex items-center justify-between">
        {/* Logo */}
        <a
          href="#"
          data-testid="navbar-logo"
          className="flex items-center gap-2 group"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <div className="w-10 h-10 md:w-12 md:h-12 bg-[#D4AF37] flex items-center justify-center rounded-sm">
            <span className="font-outfit font-black text-black text-sm md:text-base leading-none tracking-tight">
              E3C
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="font-outfit font-bold text-white text-sm leading-tight group-hover:text-[#D4AF37] transition-colors">
              E3C
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-tight">
              Constructions
            </p>
          </div>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNav(link.href)}
              className="text-gray-300 hover:text-[#D4AF37] text-sm font-medium transition-colors duration-200 uppercase tracking-wider"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            data-testid="navbar-phone"
            className="flex items-center gap-2 text-gray-300 hover:text-[#D4AF37] transition-colors text-sm"
          >
            <Phone size={14} />
            <span>{phone}</span>
          </a>
          <a
            href={`https://wa.me/${whatsapp}?text=Bonjour%20E3C%2C%20je%20souhaite%20un%20devis%20gratuit.`}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="navbar-cta"
            className="bg-[#D4AF37] text-black font-semibold text-sm px-5 py-2.5 hover:bg-[#E6C65A] transition-colors duration-200 tracking-wide"
          >
            Devis Gratuit
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          data-testid="navbar-menu-toggle"
          className="md:hidden text-white p-2 hover:text-[#D4AF37] transition-colors"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          data-testid="mobile-menu"
          className="md:hidden mobile-menu border-t border-white/5"
        >
          <div className="px-6 py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNav(link.href)}
                className="text-left text-gray-200 hover:text-[#D4AF37] text-base font-medium transition-colors py-2 border-b border-white/5 uppercase tracking-wider"
              >
                {link.label}
              </button>
            ))}
            <a
              href={`https://wa.me/${whatsapp}?text=Bonjour%20E3C%2C%20je%20souhaite%20un%20devis%20gratuit.`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#D4AF37] text-black font-bold text-center py-3 mt-2 tracking-wide"
              onClick={() => setMenuOpen(false)}
            >
              Devis Gratuit WhatsApp
            </a>
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="flex items-center justify-center gap-2 text-gray-300 hover:text-[#D4AF37] transition-colors text-sm py-2"
            >
              <Phone size={14} />
              <span>{phone}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
