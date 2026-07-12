import { useState, useCallback } from "react";

let appleSdkPromise = null;
function loadAppleSdk(clientId) {
  if (appleSdkPromise) return appleSdkPromise;
  appleSdkPromise = new Promise((resolve, reject) => {
    if (window.AppleID) return resolve(window.AppleID);
    const script = document.createElement("script");
    script.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.AppleID.auth.init({
        clientId,
        scope: "name email",
        redirectURI: window.location.origin,
        usePopup: true,
      });
      resolve(window.AppleID);
    };
    script.onerror = () => reject(new Error("Échec du chargement de Sign in with Apple"));
    document.head.appendChild(script);
  });
  return appleSdkPromise;
}

export default function AppleSignInButton({ clientId, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      const AppleID = await loadAppleSdk(clientId);
      const res = await AppleID.auth.signIn();
      const idToken = res?.authorization?.id_token;
      if (!idToken) throw new Error("Aucun jeton Apple reçu");
      // Apple ne renvoie le nom qu'à la toute première autorisation.
      const name = res.user?.name
        ? `${res.user.name.firstName || ""} ${res.user.name.lastName || ""}`.trim()
        : undefined;
      onSuccess(idToken, name);
    } catch (err) {
      if (err?.error === "popup_closed_by_user") return; // annulation silencieuse
      onError?.(err instanceof Error ? err : new Error("Connexion Apple annulée"));
    } finally {
      setLoading(false);
    }
  }, [clientId, onSuccess, onError]);

  if (!clientId) return null;

  return (
    <button type="button" onClick={handleClick} disabled={loading}
      data-testid="apple-signin-button"
      className="w-full flex items-center justify-center gap-2.5 bg-black text-white font-semibold py-3 rounded-sm hover:bg-[#1a1a1a] transition-colors disabled:opacity-60 text-sm border border-white/10">
      <svg width="16" height="16" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
      </svg>
      {loading ? "Connexion..." : "Continuer avec Apple"}
    </button>
  );
}
