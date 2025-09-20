import React, { useEffect, useState } from "react";

const PWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  // Detect Android
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    setIsAndroid(ua.includes("android"));
  }, []);

  // Detect install eligibility
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      console.log("👍 beforeinstallprompt event captured");
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      console.log("✅ PWA installed");
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Automatically trigger install if redirected via QR
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const autoInstall = urlParams.get("install") === "true";

    if (deferredPrompt && autoInstall) {
      console.log("🚀 Triggering auto install prompt...");
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
      });
    }
  }, [deferredPrompt]);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        console.log("User choice:", choiceResult.outcome);
        setDeferredPrompt(null);
      });
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto text-center shadow-lg min-h-screen flex justify-center items-center flex-col bg-white">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        📲 Install Online Shopping Store App
      </h2>

      {isInstalled ? (
        <p className="text-green-600">✅ App already installed!</p>
      ) : deferredPrompt ? (
        <button
          onClick={handleInstallClick}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Install App
        </button>
      ) : isAndroid ? (
        <p className="text-gray-500">🔄 Waiting for install prompt...</p>
      ) : (
        <p className="text-gray-500">
          ❌ Install prompt is not available on this device. Use Chrome on
          Android.
        </p>
      )}
    </div>
  );
};

export default PWAInstall;
