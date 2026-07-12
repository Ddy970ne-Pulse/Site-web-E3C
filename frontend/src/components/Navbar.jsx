import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { X, LogIn, UserPlus, User, Home, Briefcase, Image, MapPin, HelpCircle, Mail, FileEdit, Sun, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const WHATSAPP_ICON = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function Navbar({ whatsapp }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { isDark, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

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
    { icon: FileEdit, label: "Demander un devis", action: () => { setOpen(false); navigate("/devis"); }, highlight: true },
  ];

  return (
    <>
      <header
        data-testid="navbar"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled || open
            ? "bg-[#FAFAF8]/95 dark:bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-black/8 dark:border-white/5 shadow-xl"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-10 h-16 md:h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" data-testid="navbar-logo" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-10 h-10 bg-[#D4AF37] flex items-center justify-center rounded-sm shadow-lg">
              <span className="font-outfit font-black text-black text-base leading-none">E3C</span>
            </div>
            <div className="hidden sm:block">
              <p className="font-outfit font-bold text-[#1A1A1A] dark:text-white text-base leading-tight group-hover:text-[#D4AF37] transition-colors">
                E3C — Entreprise de constructions
              </p>
              <p className="text-sm text-gray-500 uppercase tracking-widest">Guadeloupe · BTP</p>
            </div>
          </Link>

          {/* Right: theme toggle + account icons + hamburger */}
          <div className="flex items-center gap-1 sm:gap-2">

            {/* Theme toggle */}
            <button
              onClick={toggle}
              data-testid="theme-toggle"
              aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
              className="flex items-center justify-center w-9 h-9 text-[#737373] hover:text-[#D4AF37] dark:text-gray-400 dark:hover:text-[#D4AF37] transition-colors rounded-sm hover:bg-black/5 dark:hover:bg-white/5"
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {user ? (
              /* Logged-in user: avatar + dashboard link */
              <Link
                to={user.role === "admin" ? "/admin" : "/espace-client"}
                data-testid="navbar-user-link"
                className="flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1.5 rounded-sm transition-colors text-sm font-semibold"
              >
                <User size={14} />
                <span className="hidden sm:inline max-w-[100px] truncate">{user.name.split(" ")[0]}</span>
              </Link>
            ) : (
              /* Not logged in: login + register icons */
              <>
                <Link
                  to="/connexion"
                  data-testid="navbar-login-icon"
                  title="Se connecter"
                  className="flex items-center gap-1.5 text-[#4B4B4B] hover:text-[#D4AF37] dark:text-gray-300 dark:hover:text-[#D4AF37] transition-colors p-2 rounded-sm hover:bg-black/5 dark:hover:bg-white/5 text-sm"
                >
                  <LogIn size={17} />
                  <span className="hidden md:inline text-sm font-medium">Connexion</span>
                </Link>
                <Link
                  to="/inscription"
                  data-testid="navbar-register-icon"
                  title="Créer un compte"
                  className="flex items-center gap-1.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-[#4B4B4B] hover:text-[#1A1A1A] dark:text-gray-200 dark:hover:text-white transition-colors px-2.5 py-1.5 rounded-sm text-sm font-medium"
                >
                  <UserPlus size={15} />
                  <span className="hidden md:inline">Compte</span>
                </Link>
              </>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setOpen(!open)}
              data-testid="navbar-menu-toggle"
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              className="ml-1 flex flex-col items-center justify-center w-9 h-9 gap-1.5 text-[#1A1A1A] hover:text-[#D4AF37] dark:text-white dark:hover:text-[#D4AF37] transition-colors rounded-sm hover:bg-black/5 dark:hover:bg-white/5"
            >
              <span className={`block h-0.5 bg-current transition-all duration-300 ${open ? "w-5 rotate-45 translate-y-2" : "w-5"}`} />
              <span className={`block h-0.5 bg-current transition-all duration-300 ${open ? "opacity-0 w-0" : "w-4"}`} />
              <span className={`block h-0.5 bg-current transition-all duration-300 ${open ? "w-5 -rotate-45 -translate-y-2" : "w-5"}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40" onClick={() => setOpen(false)} />
      )}

      {/* Slide-out Drawer */}
      <div
        data-testid="nav-drawer"
        className={`fixed top-0 right-0 h-full w-full sm:w-80 z-50 bg-white dark:bg-[#080808] border-l border-black/8 dark:border-white/5 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 h-16 md:h-20 border-b border-black/8 dark:border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#D4AF37] flex items-center justify-center rounded-sm">
              <span className="font-outfit font-black text-black text-sm">E3C</span>
            </div>
            <span className="font-outfit font-semibold text-[#1A1A1A] dark:text-white text-base">Navigation</span>
          </div>
          <button onClick={() => setOpen(false)} className="text-[#737373] hover:text-[#1A1A1A] dark:text-gray-400 dark:hover:text-white transition-colors p-1">
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.action}
                className={`w-full flex items-center gap-4 px-4 py-3.5 transition-colors rounded-sm text-left group ${
                  item.highlight
                    ? "bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/20"
                    : "text-[#4B4B4B] hover:text-[#1A1A1A] hover:bg-black/5 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5"
                }`}
              >
                <Icon size={18} className={`flex-shrink-0 group-hover:scale-110 transition-transform text-[#D4AF37]`} />
                <span className="font-medium text-lg">{item.label}</span>
              </button>
            );
          })}

          {/* Theme toggle in drawer */}
          <button
            onClick={toggle}
            className="w-full flex items-center gap-4 px-4 py-3.5 transition-colors rounded-sm text-left text-[#4B4B4B] hover:text-[#1A1A1A] hover:bg-black/5 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/5"
          >
            {isDark ? <Sun size={18} className="flex-shrink-0 text-[#D4AF37]" /> : <Moon size={18} className="flex-shrink-0 text-[#D4AF37]" />}
            <span className="font-medium text-lg">{isDark ? "Mode clair" : "Mode sombre"}</span>
          </button>
        </nav>

        <div className="px-4 py-5 border-t border-black/8 dark:border-white/5 space-y-3 flex-shrink-0">
          <a
            href={`https://wa.me/${whatsapp}?text=Bonjour%20E3C%2C%20je%20souhaite%20un%20devis%20gratuit.`}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="drawer-whatsapp-cta"
            className="w-full flex items-center justify-center gap-2.5 bg-[#D4AF37] text-black font-bold py-3.5 hover:bg-[#E6C65A] transition-colors text-base tracking-wide rounded-sm"
            onClick={() => setOpen(false)}
          >
            <WHATSAPP_ICON />
            Devis Gratuit WhatsApp
          </a>
          <p className="text-center text-sm text-[#9E9E9E] dark:text-gray-600">E3C — Entreprise de constructions · Guadeloupe (971)</p>
        </div>
      </div>
    </>
  );
}
