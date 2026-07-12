import { useEffect, useRef } from "react";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

let gsiScriptPromise = null;
function loadGsiScript() {
  if (gsiScriptPromise) return gsiScriptPromise;
  gsiScriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Échec du chargement de Google Sign-In"));
    document.head.appendChild(script);
  });
  return gsiScriptPromise;
}

export default function GoogleSignInButton({ onSuccess, onError }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !buttonRef.current) return;
    let cancelled = false;

    loadGsiScript()
      .then(() => {
        if (cancelled || !buttonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response.credential) onSuccess(response.credential);
            else onError?.(new Error("Aucun jeton Google reçu"));
          },
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: 336,
          locale: "fr",
        });
      })
      .catch((err) => onError?.(err));

    return () => { cancelled = true; };
  }, [onSuccess, onError]);

  if (!GOOGLE_CLIENT_ID) return null;

  return <div ref={buttonRef} data-testid="google-signin-button" className="flex justify-center" />;
}
