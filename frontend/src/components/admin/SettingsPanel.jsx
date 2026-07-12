import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { Save, CheckCircle2, Circle, AlertCircle } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ax = () => axios.create({ withCredentials: true });

const SECTIONS = [
  {
    title: "Stripe — paiements par carte",
    help: "Depuis le tableau de bord Stripe : Développeurs > Clés API (stripe_api_key), et Développeurs > Webhooks > votre endpoint (stripe_webhook_secret).",
    fields: [
      { name: "stripe_api_key", label: "Clé API secrète", placeholder: "sk_live_…" },
      { name: "stripe_webhook_secret", label: "Secret de signature webhook", placeholder: "whsec_…" },
    ],
  },
  {
    title: "Brevo — emails (et SMS)",
    help: "Depuis Brevo : Paramètres du compte > Clés API.",
    fields: [
      { name: "brevo_api_key", label: "Clé API", placeholder: "xkeysib-…" },
    ],
  },
  {
    title: "Google Sign-In",
    help: "Depuis Google Cloud Console : Identifiants > ID client OAuth. Le Client ID n'est pas secret.",
    fields: [
      { name: "google_client_id", label: "Client ID", placeholder: "xxxxx.apps.googleusercontent.com" },
    ],
  },
  {
    title: "Facebook Login",
    help: "Depuis Facebook for Developers : votre app > Paramètres > Basique.",
    fields: [
      { name: "facebook_app_id", label: "App ID", placeholder: "1234567890" },
      { name: "facebook_app_secret", label: "App Secret", placeholder: "" },
    ],
  },
  {
    title: "Apple Sign-In",
    help: "Nécessite un compte Apple Developer payant (99$/an) et une vérification de domaine. Depuis developer.apple.com : créez un « Services ID » (pas l'App ID) — c'est sa valeur qu'il faut coller ici. Aucun secret requis.",
    fields: [
      { name: "apple_client_id", label: "Services ID", placeholder: "com.e3c-construction.web" },
    ],
  },
  {
    title: "PayPal — paiements",
    help: "Depuis le tableau de bord développeur PayPal (developer.paypal.com) : Apps & Credentials. Utilisez les identifiants Sandbox pour tester avant de passer en Live.",
    fields: [
      { name: "paypal_client_id", label: "Client ID", placeholder: "" },
      { name: "paypal_client_secret", label: "Client Secret", placeholder: "" },
      { name: "paypal_mode", label: "Mode (\"sandbox\" ou \"live\")", placeholder: "sandbox" },
    ],
  },
  {
    title: "Virement bancaire — vos coordonnées",
    help: "Affichées aux clients qui choisissent de payer par virement. Ce ne sont pas des secrets — elles doivent être communiquées, contrairement aux clés ci-dessus.",
    fields: [
      { name: "bank_account_holder", label: "Titulaire du compte", placeholder: "E3C — Entreprise de Constructions" },
      { name: "bank_iban", label: "IBAN", placeholder: "FR76 XXXX XXXX XXXX XXXX XXXX XXX" },
      { name: "bank_bic", label: "BIC / SWIFT", placeholder: "XXXXXXXX" },
      { name: "bank_name", label: "Banque", placeholder: "Nom de votre banque" },
    ],
  },
];

export default function SettingsPanel() {
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data } = await ax().get(`${API}/admin/settings`);
      setStatus(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Impossible de charger les paramètres");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleChange = (name, value) => setForm(p => ({ ...p, [name]: value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setMessage(null); setError("");
    try {
      const { data } = await ax().put(`${API}/admin/settings`, form);
      setStatus(data);
      setForm({});
      setMessage("Paramètres enregistrés — appliqués immédiatement, sans redémarrage.");
    } catch (err) {
      setError(err.response?.data?.detail || "Échec de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="font-outfit font-bold text-2xl text-white mb-2">Paramètres</h1>
      <p className="text-sm text-gray-500 mb-6">
        Configurez ici vos comptes de gestion (Stripe, Brevo, Google, Facebook, PayPal) — plus besoin de toucher au serveur.
      </p>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 mb-5 text-sm rounded-sm">{error}</div>}
      {message && <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 mb-5 text-sm rounded-sm">{message}</div>}

      {loading && !status ? (
        <p className="text-sm text-gray-500">Chargement...</p>
      ) : (
        <form onSubmit={save} className="space-y-6">
          {SECTIONS.map(section => (
            <div key={section.title} className="bg-[#121212] border border-white/5 rounded-sm p-5">
              <h2 className="font-outfit font-semibold text-white text-sm mb-1">{section.title}</h2>
              <p className="text-xs text-gray-500 mb-4">{section.help}</p>
              <div className="space-y-4">
                {section.fields.map(field => {
                  const info = status?.[field.name];
                  return (
                    <div key={field.name}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <label className="text-xs text-gray-400 uppercase tracking-wider">{field.label}</label>
                        {info?.configured ? (
                          <span className="flex items-center gap-1 text-[11px] text-green-400" title={info.source === "database" ? "Configuré depuis ce panneau" : "Configuré via variable d'environnement"}>
                            <CheckCircle2 size={12} /> {info.preview || "configuré"}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] text-gray-600">
                            <Circle size={12} /> non configuré
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        autoComplete="off"
                        data-testid={`settings-${field.name}`}
                        value={form[field.name] ?? ""}
                        onChange={e => handleChange(field.name, e.target.value)}
                        placeholder={info?.configured ? "Laisser vide pour ne pas changer" : field.placeholder}
                        className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-3 py-2.5 text-sm rounded-sm"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} data-testid="settings-save"
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[#D4AF37] text-black rounded-sm hover:bg-[#E6C65A] disabled:opacity-50">
              <Save size={15} /> {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <AlertCircle size={13} /> Seuls les champs remplis sont modifiés.
            </span>
          </div>
        </form>
      )}
    </div>
  );
}
