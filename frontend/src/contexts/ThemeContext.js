import { createContext, useContext, useEffect, useState } from "react";

const ThemeCtx = createContext({ isDark: true, toggle: () => {} });

// Guadeloupe est en zone tropicale (16°N) : contrairement aux latitudes tempérées,
// le lever/coucher du soleil varie très peu au fil de l'année (~5h30-6h30 et
// ~17h45-18h30). Une plage fixe est donc une approximation raisonnable, sans avoir
// besoin d'un calcul solaire complet.
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 18;

function isDaytimeNow() {
  const hour = new Date().getHours();
  return hour >= DAY_START_HOUR && hour < DAY_END_HOUR;
}

export function ThemeProvider({ children }) {
  // Un choix déjà enregistré (l'utilisateur a basculé manuellement) est toujours
  // respecté. Sans choix enregistré, le thème suit l'heure actuelle à chaque
  // chargement — c'est ce qui rend le passage jour/nuit "automatique".
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("e3c-theme");
    return saved !== null ? saved === "dark" : !isDaytimeNow();
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const toggle = () => {
    setIsDark(d => {
      const next = !d;
      // Choix manuel explicite : enregistré et respecté à partir de maintenant,
      // ne sera plus jamais écrasé par la détection automatique sur cet appareil.
      localStorage.setItem("e3c-theme", next ? "dark" : "light");
      return next;
    });
  };

  return (
    <ThemeCtx.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
