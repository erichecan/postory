"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveDesignAction } from "@/lib/actions/designs";
import type { DesignPage } from "@/types/design";

export type SaveStatus = "saved" | "pending" | "saving" | "error";

const DELAY_MS = 1200;

export function useAutosave(designId: string, title: string, pages: DesignPage[], version: number) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const latest = useRef({ title, pages });
  const savedVersion = useRef(version);
  const versionRef = useRef(version);

  useEffect(() => {
    latest.current = { title, pages };
    versionRef.current = version;
  }, [title, pages, version]);

  const flush = useCallback(async () => {
    const v = versionRef.current;
    if (v === savedVersion.current) return true;
    setStatus("saving");
    const res = await saveDesignAction(designId, latest.current).catch(() => ({ ok: false }));
    if (res.ok) {
      savedVersion.current = v;
      setStatus(versionRef.current === v ? "saved" : "pending");
    } else {
      setStatus("error");
    }
    return res.ok;
  }, [designId]);

  useEffect(() => {
    if (version === savedVersion.current) return;
    setStatus("pending");
    const t = setTimeout(flush, DELAY_MS);
    return () => clearTimeout(t);
  }, [version, flush]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (versionRef.current !== savedVersion.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  return { status, flush };
}
