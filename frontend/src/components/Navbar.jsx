import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Phone, X, Menu, User, LogIn, FileText, Home, Briefcase, Image, MapPin, HelpCircle, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const WHATSAPP_ICON = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function Navbar({ whatsapp, phone }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const scrollTo = (id) => {
    setOpen(false);
    if (isHome) {
      document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => document.querySelector(id)?.scrollIntoView({ behavior: "smooth" }), 300);
    }
  };

  const navItems = [
    { icon: Home, label: "Accueil", action: () => { setOpen(false); navigate("/"); } },
    { icon: Briefcase, label: "Nos Prestations", action: () => scrollTo("#services") },
    { icon: Image, label: "Réalisations", action: () => scrollTo("#gallery") },
    { icon: MapPin, label: "Zone d'intervention", action: () => scrollTo("#zone") },
    { icon: Mail, label: "Contact", action: () => { setOpen(false); navigate("/contact"); } },
    { icon: HelpCircle, label: "FAQ", action: () => scrollTo("#faq") },
  ];

  return (
    <>
      {/* Header bar */}
      <header
        data-testid="navbar"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled || open
            ? "bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5 shadow-xl"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-10 h-16 md:h-20 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            data-testid="navbar-logo"
            className="flex items-center gap-2.5 group flex-shrink-0"
          >
            <div className="w-10 h-10 bg-[#D4AF37] flex items-center justify-center rounded-sm shadow-lg">
              <span className="font-outfit font-black text-black text-sm leading-none">E3C</span>
            </div>
            <div>
              <p className="font-outfit font-bold text-white text-sm leading-tight group-hover:text-[#D4AF37] transition-colors">
                E3C Constructions
              </p>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest">
                Guadeloupe · BTP
              </p>
            </div>
          </Link>

          {/* Right side: phone + hamburger */}
          <div className="flex items-center gap-4">
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              data-testid="navbar-phone"
              className="hidden sm:flex items-center gap-1.5 text-gray-300 hover:text-[#D4AF37] transition-colors text-sm"
            >
              <Phone size={13} />
              <span>{phone}</span>
            </a>

            {/* Hamburger — all sizes */}
            <button
              onClick={() => setOpen(!open)}
              data-testid="navbar-menu-toggle"
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              className="relative flex flex-col items-center justify-center w-10 h-10 gap-1.5 text-white hover:text-[#D4AF37] transition-colors group"
            >
              <span className={`block h-0.5 bg-current transition-all duration-300 ${open ? "w-6 rotate-45 translate-y-2" : "w-6"}`} />
              <span className={`block h-0.5 bg-current transition-all duration-300 ${open ? "opacity-0 w-0" : "w-5"}`} />
              <span className={`block h-0.5 bg-current transition-all duration-300 ${open ? "w-6 -rotate-45 -translate-y-2" : "w-6"}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-out Drawer */}
      <div
        data-testid="nav-drawer"
        className={`fixed top-0 right-0 h-full w-full sm:w-80 z-50 bg-[#080808] border-l border-white/5 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 h-16 md:h-20 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#D4AF37] flex items-center justify-center rounded-sm">
              <span className="font-outfit font-black text-black text-xs">E3C</span>
            </div>
            <span className="font-outfit font-semibold text-white text-sm">Menu</span>
          </div>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1">
            <X size={22} />
          </button>
        </div>

        {/* Drawer nav links */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center gap-4 px-4 py-3.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors rounded-sm text-left group"
              >
                <Icon size={18} className="text-[#D4AF37] flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-base">{item.label}</span>
              </button>
            );
          })}

          {/* Divider */}
          <div className="border-t border-white/5 my-3" />

          {/* Account section */}
          {user ? (
            <Link
              to={user.role === "admin" ? "/admin" : "/espace-client"}
              className="w-full flex items-center gap-4 px-4 py-3.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors rounded-sm"
            >
              <User size={18} className="text-[#D4AF37] flex-shrink-0" />
              <div>
                <p className="font-medium text-base">Mon espace</p>
                <p className="text-xs text-gray-500">{user.name}</p>
              </div>
            </Link>
          ) : (
            <>
              <Link
                to="/connexion"
                className="w-full flex items-center gap-4 px-4 py-3.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors rounded-sm"
              >
                <LogIn size={18} className="text-[#D4AF37] flex-shrink-0" />
                <span className="font-medium text-base">Se connecter</span>
              </Link>
              <Link
                to="/inscription"
                className="w-full flex items-center gap-4 px-4 py-3.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors rounded-sm"
              >
                <User size={18} className="text-[#D4AF37] flex-shrink-0" />
                <span className="font-medium text-base">Créer un compte</span>
              </Link>
            </>
          )}
        </nav>

        {/* Drawer footer CTA */}
        <div className="px-4 py-5 border-t border-white/5 space-y-3 flex-shrink-0">
          <a
            href={`https://wa.me/${whatsapp}?text=Bonjour%20E3C%2C%20je%20souhaite%20un%20devis%20gratuit.`}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="drawer-whatsapp-cta"
            className="w-full flex items-center justify-center gap-2.5 bg-[#D4AF37] text-black font-bold py-3.5 hover:bg-[#E6C65A] transition-colors text-sm tracking-wide rounded-sm"
            onClick={() => setOpen(false)}
          >
            <WHATSAPP_ICON />
            Devis Gratuit WhatsApp
          </a>
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="w-full flex items-center justify-center gap-2 text-gray-300 hover:text-[#D4AF37] transition-colors text-sm py-2"
          >
            <Phone size={14} /> {phone}
          </a>
          <p className="text-center text-xs text-gray-600">
            E3C Constructions · Guadeloupe (971)
          </p>
        </div>
      </div>
    </>
  );
}
