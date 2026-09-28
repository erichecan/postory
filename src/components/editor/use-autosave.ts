"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveDesignAction } from "@/lib/actions/designs";
import type { DesignPage } from "@/types/design";

export type SaveStatus = "saved" | "pending" | "saving" | "error";

const DELAY_MS = 1200;
const RETRY_MS = 4000;

export function useAutosave(designId: string, title: string, pages: DesignPage[], version: number) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const latest = useRef({ title, pages });
  const versionRef = useRef(version);
  const savedVersion = useRef(version);
  const inFlight = useRef<Promise<boolean> | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    latest.current = { title, pages };
    versionRef.current = version;
  }, [title, pages, version]);

  const saveOnce = useCallback(async () => {
    const v = versionRef.current;
    if (v === savedVersion.current) return true;
    setStatus("saving");
    const res = await saveDesignAction(designId, latest.current).catch(() => ({ ok: false, error: undefined }));
    if (!res.ok) {
      setStatus("error");
      return false;
    }
    savedVersion.current = Math.max(savedVersion.current, v);
    setStatus(versionRef.current === savedVersion.current ? "saved" : "pending");
    return true;
  }, [designId]);

  const flushRef = useRef<() => Promise<boolean>>(async () => true);

  const flush = useCallback(async (): Promise<boolean> => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    for (;;) {
      while (inFlight.current) await inFlight.current;
      if (versionRef.current === savedVersion.current) return true;
      inFlight.current = saveOnce();
      const ok = await inFlight.current;
      inFlight.current = null;
      if (!ok) {
        retryTimer.current = setTimeout(() => void flushRef.current(), RETRY_MS);
        return false;
      }
    }
  }, [saveOnce]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  useEffect(() => {
    if (version === savedVersion.current) return;
    setStatus((s) => (s === "saving" ? s : "pending"));
    const t = setTimeout(() => void flush(), DELAY_MS);
    return () => clearTimeout(t);
  }, [version, flush]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (versionRef.current !== savedVersion.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, []);

  return { status, flush };
}
