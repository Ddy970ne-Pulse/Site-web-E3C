import { useState, useCallback } from "react";

let fbSdkPromise = null;
function loadFacebookSdk(appId) {
  if (fbSdkPromise) return fbSdkPromise;
  fbSdkPromise = new Promise((resolve, reject) => {
    if (window.FB) return resolve(window.FB);
    window.fbAsyncInit = function () {
      window.FB.init({ appId, cookie: true, xfbml: false, version: "v21.0" });
      resolve(window.FB);
    };
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/fr_FR/sdk.js";
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Échec du chargement du SDK Facebook"));
    document.head.appendChild(script);
  });
  return fbSdkPromise;
}

export default function FacebookSignInButton({ appId, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      const FB = await loadFacebookSdk(appId);
      FB.login((response) => {
        setLoading(false);
        if (response.authResponse?.accessToken) {
          onSuccess(response.authResponse.accessToken);
        } else {
          onError?.(new Error("Connexion Facebook annulée"));
        }
      }, { scope: "public_profile,email" });
    } catch (err) {
      setLoading(false);
      onError?.(err);
    }
  }, [appId, onSuccess, onError]);

  if (!appId) return null;

  return (
    <button type="button" onClick={handleClick} disabled={loading}
      data-testid="facebook-signin-button"
      className="w-full flex items-center justify-center gap-2.5 bg-[#1877F2] text-white font-semibold py-3 rounded-sm hover:bg-[#166FE5] transition-colors disabled:opacity-60 text-base">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
      {loading ? "Connexion..." : "Continuer avec Facebook"}
    </button>
  );
}
