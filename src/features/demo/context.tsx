"use client";
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { actors, createDemo, type Actor, type DemoState, type SocietyType } from "./model";
import { usePwa } from "@/components/pwa-support";

type DemoContextType = {
  state: DemoState;
  actor: Actor;
  setActor: (id: string) => void;
  switchSociety: (type: SocietyType) => void;
  update: (fn: (s: DemoState) => DemoState) => void;
  toast: string;
  notify: (message: string) => void;
  reset: () => void;
};
const DemoContext = createContext<DemoContextType | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const { online } = usePwa();
  const [societies, setSocieties] = useState(() => ({
    rotating: createDemo("rotating"),
    burial: createDemo("burial"),
  }));
  const [type, setType] = useState<SocietyType>("rotating");
  const [actorId, setActor] = useState("naledi");
  const [toast, setToast] = useState("");
  const state = societies[type];
  const actor = { ...actors.find((a) => a.id === actorId)!, societyId: state.societyId };
  function update(fn: (s: DemoState) => DemoState) {
    if (!online || !navigator.onLine)
      throw new Error(
        "Connect to the internet to record payments, decisions or imports. No changes are queued offline.",
      );
    const next = fn(state);
    setSocieties((previous) => ({ ...previous, [type]: next }));
  }
  const switchSociety = useCallback((next: SocietyType) => {
    setType(next);
    setToast("");
  }, []);
  return (
    <DemoContext.Provider
      value={{
        state,
        actor,
        setActor,
        switchSociety,
        update,
        toast,
        notify: setToast,
        reset: () => {
          setSocieties({ rotating: createDemo("rotating"), burial: createDemo("burial") });
          setToast("Demo reset. All changes cleared.");
        },
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}
export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("Demo provider is required.");
  return context;
}
