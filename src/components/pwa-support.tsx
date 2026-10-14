"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  DownloadSimpleIcon,
  WifiSlashIcon,
  ArrowClockwiseIcon,
  DeviceMobileIcon,
  ShareNetworkIcon,
} from "@phosphor-icons/react";
import { Dialog } from "./dialog";
type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
const PwaContext = createContext<{ online: boolean; install: () => void; installed: boolean }>({
  online: true,
  install: () => {},
  installed: false,
});
export function usePwa() {
  return useContext(PwaContext);
}
export function PwaSupport({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(true);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [status, setStatus] = useState("");
  useEffect(() => {
    const connection = () => setOnline(navigator.onLine);
    connection();
    const media = window.matchMedia("(display-mode: standalone)");
    const standalone = () =>
      setInstalled(
        media.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
      );
    standalone();
    media.addEventListener("change", standalone);
    const before = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const installedEvent = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("online", connection);
    window.addEventListener("offline", connection);
    window.addEventListener("beforeinstallprompt", before);
    window.addEventListener("appinstalled", installedEvent);
    let disposed = false;
    let reload = false;
    const controllerChange = () => {
      if (reload) window.location.reload();
    };
    navigator.serviceWorker?.addEventListener("controllerchange", controllerChange);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production")
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          if (disposed) return;
          if (reg.waiting) setWaiting(reg.waiting);
          reg.addEventListener("updatefound", () => {
            const worker = reg.installing;
            worker?.addEventListener("statechange", () => {
              if (worker.state === "installed" && navigator.serviceWorker.controller && !disposed)
                setWaiting(worker);
            });
          });
        })
        .catch(() => {
          if (!disposed)
            setStatus(
              "Offline setup is unavailable in this browser. You can still use StokvelOS online.",
            );
        });
    const updateEvent = () => {
      reload = true;
    };
    window.addEventListener("stokvelos:apply-update", updateEvent);
    return () => {
      disposed = true;
      window.removeEventListener("online", connection);
      window.removeEventListener("offline", connection);
      window.removeEventListener("beforeinstallprompt", before);
      window.removeEventListener("appinstalled", installedEvent);
      window.removeEventListener("stokvelos:apply-update", updateEvent);
      media.removeEventListener("change", standalone);
      navigator.serviceWorker?.removeEventListener("controllerchange", controllerChange);
    };
  }, []);
  async function install() {
    if (prompt) {
      await prompt.prompt();
      await prompt.userChoice;
      setPrompt(null);
    } else setHelp(true);
  }
  return (
    <PwaContext.Provider value={{ online, installed, install }}>
      {children}
      {!online && (
        <div className="pwa-notice offline-notice" role="status">
          <WifiSlashIcon size={20} />
          <div>
            <b>You’re offline.</b>
            <span>
              {" "}
              Payments, approvals and imports require a connection. Nothing will be queued.
            </span>
          </div>
        </div>
      )}
      {waiting && (
        <div className="pwa-notice update-notice" role="status">
          <ArrowClockwiseIcon size={20} />
          <span>An app update is ready. Finish your current work before reloading.</span>
          <button
            onClick={() => {
              window.dispatchEvent(new Event("stokvelos:apply-update"));
              waiting.postMessage({ type: "SKIP_WAITING" });
            }}
          >
            Update & reload
          </button>
          <button onClick={() => setWaiting(null)}>Later</button>
        </div>
      )}
      {status && (
        <div className="pwa-notice" role="status">
          {status}
          <button onClick={() => setStatus("")}>Dismiss</button>
        </div>
      )}
      {help && (
        <Dialog title="Keep StokvelOS close" onClose={() => setHelp(false)}>
          <div className="install-intro">
            <DeviceMobileIcon size={42} weight="light" />
            <h3>A place on your home screen.</h3>
            <p>Open StokvelOS in your device’s browser to install the app.</p>
          </div>
          <div className="install-instructions">
            <h4>iPhone or iPad</h4>
            <p>
              In Safari, tap <ShareNetworkIcon size={15} /> Share, then <b>Add to Home Screen</b>.
              Enable “Open as Web App” if offered.
            </p>
            <h4>Android</h4>
            <p>
              In Chrome or Edge, open the browser menu and choose <b>Install app</b> or{" "}
              <b>Add to Home screen</b>.
            </p>
            <h4>Desktop</h4>
            <p>
              In Chrome or Edge, use the install icon in the address bar. Other browsers may offer a
              website shortcut.
            </p>
          </div>
          <div className="info-note">
            Installation requires HTTPS or localhost and browser support. The offline screen
            contains no member or financial data.
          </div>
          <button className="button button-primary" onClick={() => setHelp(false)}>
            Got it
          </button>
        </Dialog>
      )}
    </PwaContext.Provider>
  );
}
export function InstallButton() {
  const { install, installed } = usePwa();
  return (
    <button className="button button-outline" onClick={install}>
      <DownloadSimpleIcon size={18} />
      {installed ? "App installed · Help" : "Install StokvelOS"}
    </button>
  );
}
