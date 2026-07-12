import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { RefreshCw, Wrench, CheckCircle, XCircle, AlertTriangle, MinusCircle } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ax = () => axios.create({ withCredentials: true });

const CHECK_LABELS = {
  database: "Base de données",
  stripe_api: "API Stripe",
  stripe_webhook: "Webhook Stripe",
  email: "Envoi d'emails (Brevo)",
  uploads_storage: "Stockage des images",
  google_auth: "Connexion Google",
};

const STATUS_STYLES = {
  ok: { icon: CheckCircle, color: "text-green-400", label: "OK" },
  warning: { icon: AlertTriangle, color: "text-yellow-400", label: "Attention" },
  disabled: { icon: MinusCircle, color: "text-gray-500", label: "Désactivé" },
  error: { icon: XCircle, color: "text-red-400", label: "Erreur" },
};

function CheckRow({ name, result }) {
  const style = STATUS_STYLES[result.status] || STATUS_STYLES.error;
  const Icon = style.icon;
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-white/5 last:border-0">
      <div>
        <p className="text-sm text-white font-medium">{CHECK_LABELS[name] || name}</p>
        {result.detail && <p className="text-xs text-gray-500 mt-0.5">{result.detail}</p>}
      </div>
      <div className={`flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${style.color}`}>
        <Icon size={14} /> {style.label}
      </div>
    </div>
  );
}

export default function DiagnosticsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [fixResult, setFixResult] = useState(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data } = await ax().get(`${API}/admin/diagnostics`);
      setData(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Impossible de charger le diagnostic");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const runAutoFix = async () => {
    setFixing(true); setFixResult(null);
    try {
      const { data } = await ax().post(`${API}/admin/diagnostics/auto-fix`);
      setFixResult(data);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.detail || "Échec de l'auto-réparation");
    } finally {
      setFixing(false);
    }
  };

  const hasIssues = data && Object.values(data.checks).some(c => c.status === "error" || c.status === "warning");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-outfit font-bold text-2xl text-white">Diagnostic système</h1>
        <div className="flex gap-2">
          <button onClick={refresh} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-300 border border-white/10 rounded-sm hover:bg-white/5 disabled:opacity-50">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Actualiser
          </button>
          <button onClick={runAutoFix} disabled={fixing}
            data-testid="run-auto-fix"
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-[#D4AF37] text-black rounded-sm hover:bg-[#E6C65A] disabled:opacity-50">
            <Wrench size={14} /> {fixing ? "Réparation..." : "Lancer l'auto-réparation"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 mb-5 text-sm rounded-sm">{error}</div>
      )}

      {data && !hasIssues && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 mb-5 text-sm rounded-sm">
          Tout fonctionne normalement.
        </div>
      )}

      {fixResult && (
        <div className="bg-white/5 border border-white/10 p-4 mb-5 rounded-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Résultat de la réparation automatique</p>
          <p className="text-sm text-gray-300">
            Sessions de paiement expirées nettoyées : {fixResult.results?.expired_payment_sessions?.fixed_count ?? 0}
          </p>
        </div>
      )}

      <div className="bg-[#121212] border border-white/5 rounded-sm p-5">
        {loading && !data ? (
          <p className="text-sm text-gray-500">Chargement du diagnostic...</p>
        ) : data ? (
          <>
            {Object.entries(data.checks).map(([name, result]) => (
              <CheckRow key={name} name={name} result={result} />
            ))}
            <p className="text-xs text-gray-600 mt-4">Dernière vérification : {new Date(data.checked_at).toLocaleString("fr-FR")}</p>
          </>
        ) : null}
      </div>

      <p className="text-xs text-gray-600 mt-4">
        L'auto-réparation ne corrige que des problèmes sûrs et réversibles (ex : sessions de paiement expirées).
        Une réparation identique s'exécute aussi automatiquement chaque heure en arrière-plan.
        Les erreurs (base de données, Stripe, email) nécessitent une intervention manuelle.
      </p>
    </div>
  );
}
