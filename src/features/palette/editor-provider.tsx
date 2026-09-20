"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { saveProject, getProject, duplicateProject } from "@/features/projects/api";
import {
  createEditorState,
  editorReducer,
  proportionsNeedNormalize,
  type EditorAction,
  type EditorState,
} from "@/features/palette/editor-state";
import type { Project } from "@/lib/types";
import { RepositoryError } from "@/lib/repositories/memory";

interface EditorContextValue {
  state: EditorState;
  dispatch: (action: EditorAction) => void;
  saveNow: () => Promise<boolean>;
  retry: () => Promise<boolean>;
  reloadLatest: () => Promise<void>;
  saveAsCopy: () => Promise<Project | null>;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({
  project,
  children,
}: {
  project: Project;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(editorReducer, project, createEditorState);
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);

  const saveNow = useCallback(async () => {
    const current = stateRef.current;
    if (current.saveStatus === "conflict") return false;
    if (proportionsNeedNormalize(current)) return false;
    if (current.inFlight) {
      dispatch({ type: "queueSave" });
      return false;
    }
    dispatch({ type: "markSaving" });
    try {
      const saved = await saveProject(current.project.id, {
        expectedVersion: current.project.version,
        name: current.project.name,
        status: current.project.status,
        payload: current.project.payload,
      });
      dispatch({ type: "markSaved", project: saved });
      return !stateRef.current.queued;
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === "VERSION_CONFLICT") {
        dispatch({
          type: "markConflict",
          version: (error as { currentVersion?: number }).currentVersion ?? current.project.version,
        });
        return false;
      }
      dispatch({
        type: "markFailed",
        message: error instanceof Error ? error.message : "Save failed",
      });
      return false;
    }
  }, []);

  useEffect(() => {
    if (state.saveStatus !== "unsaved" || state.inFlight) return;
    if (proportionsNeedNormalize(state)) return;
    const timer = window.setTimeout(() => {
      void saveNow();
    }, 800);
    return () => window.clearTimeout(timer);
  }, [state, saveNow]);

  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => {
      if (["unsaved", "saving", "failed"].includes(stateRef.current.saveStatus)) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, []);

  const retry = useCallback(() => saveNow(), [saveNow]);

  const reloadLatest = useCallback(async () => {
    const latest = await getProject(project.id);
    dispatch({ type: "hydrate", project: latest });
  }, [project.id]);

  const saveAsCopy = useCallback(async () => {
    try {
      return await duplicateProject(project.id, stateRef.current.project.version);
    } catch (error) {
      if (error instanceof RepositoryError) {
        dispatch({ type: "markFailed", message: error.message });
      }
      return null;
    }
  }, [project.id]);

  const wrappedDispatch = useCallback((action: EditorAction) => {
    if (
      stateRef.current.inFlight &&
      !["markSaved", "markFailed", "markConflict", "markSaving", "queueSave"].includes(
        action.type,
      )
    ) {
      dispatch({ type: "queueSave" });
    }
    dispatch(action);
  }, []);

  return (
    <EditorContext.Provider
      value={{
        state,
        dispatch: wrappedDispatch,
        saveNow,
        retry,
        reloadLatest,
        saveAsCopy,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const value = useContext(EditorContext);
  if (!value) {
    throw new Error("useEditor must be used within EditorProvider");
  }
  return value;
}
