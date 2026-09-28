import type { DesignElement, DesignPage } from "@/types/design";

export type EditorState = {
  pages: DesignPage[];
  pageIndex: number;
  selectedId: string | null;
  past: DesignPage[][];
  future: DesignPage[][];
  lastKey: string | null;
  lastAt: number;
  dirty: number;
};

type Edit = { key?: string };

export type EditorAction =
  | { type: "select"; id: string | null }
  | { type: "page"; index: number }
  | ({ type: "updateElement"; id: string; patch: Partial<DesignElement> } & Edit)
  | ({ type: "updateStyle"; id: string; patch: DesignElement["style"] } & Edit)
  | ({ type: "updatePage"; patch: Partial<Pick<DesignPage, "background">> } & Edit)
  | { type: "add"; element: DesignElement }
  | { type: "remove"; id: string }
  | { type: "reorder"; id: string; dir: "up" | "down" }
  | { type: "undo" }
  | { type: "redo" };

const HISTORY_LIMIT = 100;
const COALESCE_MS = 800;

export function initEditor(pages: DesignPage[]): EditorState {
  return { pages, pageIndex: 0, selectedId: null, past: [], future: [], lastKey: null, lastAt: 0, dirty: 0 };
}

function mapPage(state: EditorState, fn: (p: DesignPage) => DesignPage) {
  return state.pages.map((p, i) => (i === state.pageIndex ? fn(p) : p));
}

function mapElement(state: EditorState, id: string, fn: (e: DesignElement) => DesignElement) {
  return mapPage(state, (p) => ({ ...p, elements: p.elements.map((e) => (e.id === id ? fn(e) : e)) }));
}

function commit(state: EditorState, pages: DesignPage[], key?: string): EditorState {
  const now = Date.now();
  const coalesce = key !== undefined && key === state.lastKey && now - state.lastAt < COALESCE_MS;
  return {
    ...state,
    pages,
    past: coalesce ? state.past : [...state.past, state.pages].slice(-HISTORY_LIMIT),
    future: [],
    lastKey: key ?? null,
    lastAt: now,
    dirty: state.dirty + 1,
  };
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "select":
      return { ...state, selectedId: action.id };
    case "page":
      return { ...state, pageIndex: Math.min(Math.max(0, action.index), state.pages.length - 1), selectedId: null };
    case "updateElement":
      return commit(state, mapElement(state, action.id, (e) => ({ ...e, ...action.patch })), action.key);
    case "updateStyle":
      return commit(state, mapElement(state, action.id, (e) => ({ ...e, style: { ...e.style, ...action.patch } })), action.key);
    case "updatePage":
      return commit(state, mapPage(state, (p) => ({ ...p, ...action.patch })), action.key);
    case "add": {
      const next = commit(state, mapPage(state, (p) => ({ ...p, elements: [...p.elements, action.element] })));
      return { ...next, selectedId: action.element.id };
    }
    case "remove": {
      const next = commit(state, mapPage(state, (p) => ({ ...p, elements: p.elements.filter((e) => e.id !== action.id) })));
      return { ...next, selectedId: state.selectedId === action.id ? null : state.selectedId };
    }
    case "reorder": {
      const pages = mapPage(state, (p) => {
        const sorted = [...p.elements].sort((a, b) => a.z - b.z);
        const i = sorted.findIndex((e) => e.id === action.id);
        const j = action.dir === "up" ? i + 1 : i - 1;
        if (i < 0 || j < 0 || j >= sorted.length || sorted[j].locked) return p;
        [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
        return { ...p, elements: sorted.map((e, k) => ({ ...e, z: k + 1 })) };
      });
      return commit(state, pages);
    }
    case "undo": {
      const prev = state.past.at(-1);
      if (!prev) return state;
      return { ...state, pages: prev, past: state.past.slice(0, -1), future: [state.pages, ...state.future], lastKey: null, dirty: state.dirty + 1 };
    }
    case "redo": {
      const [next, ...rest] = state.future;
      if (!next) return state;
      return { ...state, pages: next, past: [...state.past, state.pages], future: rest, lastKey: null, dirty: state.dirty + 1 };
    }
  }
}

export function currentPage(state: EditorState) {
  return state.pages[state.pageIndex];
}

export function selectedElement(state: EditorState) {
  return currentPage(state).elements.find((e) => e.id === state.selectedId) ?? null;
}

export function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function topZ(page: DesignPage) {
  return page.elements.reduce((m, e) => Math.max(m, e.z), 0) + 1;
}
