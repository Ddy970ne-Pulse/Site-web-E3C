import { createContext, useContext, useEffect, useState } from "react";

const ThemeCtx = createContext({ isDark: true, toggle: () => {} });

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("e3c-theme");
    return saved !== null ? saved === "dark" : true; // dark par défaut
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("e3c-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("e3c-theme", "light");
    }
  }, [isDark]);

  return (
    <ThemeCtx.Provider value={{ isDark, toggle: () => setIsDark(d => !d) }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
