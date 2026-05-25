import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === "admin" ? "/admin" : "/espace-client", { replace: true });
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Identifiants incorrects");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0A0A0A] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#D4AF37] flex items-center justify-center">
              <span className="font-outfit font-black text-black text-sm">E3C</span>
            </div>
            <span className="font-outfit font-bold text-[#1A1A1A] dark:text-white text-xl">E3C — Entreprise de constructions</span>
          </Link>
          <h1 className="font-outfit font-bold text-2xl text-[#1A1A1A] dark:text-white">Connexion</h1>
          <p className="text-[#737373] dark:text-gray-400 text-sm mt-1">Accédez à votre espace personnel</p>
        </div>

        <div className="bg-white dark:bg-[#121212] border border-black/8 dark:border-white/8 p-8 rounded-sm shadow-sm dark:shadow-none">
          {error && (
            <div data-testid="login-error" className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 p-3 mb-5 text-sm rounded-sm">
              {error}
            </div>
          )}
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-xs text-[#737373] dark:text-gray-400 uppercase tracking-wider mb-2">Email</label>
              <input type="email" name="email" value={form.email} onChange={handle} required
                data-testid="login-email"
                className="w-full bg-[#F5F4F0] dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#1A1A1A] dark:text-white placeholder-[#ADADAD] dark:placeholder-gray-500 px-4 py-3 text-sm rounded-sm"
                placeholder="votre@email.com" />
            </div>
            <div>
              <label className="block text-xs text-[#737373] dark:text-gray-400 uppercase tracking-wider mb-2">Mot de passe</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} name="password" value={form.password} onChange={handle} required
                  data-testid="login-password"
                  className="w-full bg-[#F5F4F0] dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#1A1A1A] dark:text-white placeholder-[#ADADAD] dark:placeholder-gray-500 px-4 py-3 pr-10 text-sm rounded-sm"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9E9E] dark:text-gray-400 hover:text-[#1A1A1A] dark:hover:text-white transition-colors">
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} data-testid="login-submit"
              className="w-full flex items-center justify-center gap-2 bg-[#D4AF37] text-black font-bold py-3.5 hover:bg-[#E6C65A] transition-colors disabled:opacity-60 text-sm tracking-wide rounded-sm">
              <LogIn size={16}/> {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
          <div className="mt-6 text-center border-t border-black/7 dark:border-white/5 pt-5">
            <p className="text-[#737373] dark:text-gray-400 text-sm">Pas encore de compte ?{" "}
              <Link to="/inscription" className="text-[#D4AF37] hover:underline font-medium">Créer un compte</Link>
            </p>
          </div>
        </div>
        <div className="mt-4 text-center">
          <Link to="/" className="text-[#9E9E9E] dark:text-gray-500 text-xs hover:text-[#4B4B4B] dark:hover:text-gray-300 transition-colors">
            ← Retour au site
          </Link>
        </div>
      </div>
    </div>
  );
}
