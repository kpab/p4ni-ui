"use client";

import * as React from "react";
import { Canvas } from "@react-three/fiber";
import {
  LockScene,
  type LockColors,
  type SceneApi,
  type ScenePhaseEvent,
  type SlotRect,
} from "./LockScene";
import { injectStyles } from "./styles";

/* ------------------------------------------------------------------ */
/* Public types                                                        */
/* ------------------------------------------------------------------ */

export interface LockInputProps {
  /**
   * The passphrase. A string (compared case-insensitively unless
   * `caseSensitive`), a RegExp, or a custom predicate.
   *
   * NOTE: the keyword ships in the client bundle. LockInput is a
   * theatrical gate, not a security boundary.
   */
  keyword: string | RegExp | ((value: string) => boolean);
  /** Compare string keywords case-sensitively. Default: false. */
  caseSensitive?: boolean;
  /** Fires the moment the correct keyword is entered. */
  onUnlock?: () => void;
  /** Fires when a wrong keyword is submitted. */
  onFail?: (value: string) => void;
  /** Fires after the dissolve animation completes. */
  onRevealed?: () => void;
  placeholder?: string;
  /** Override the p4ni palette. */
  colors?: Partial<LockColors>;
  /** Extra props forwarded to the underlying <input>. */
  inputProps?: Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "onKeyDown" | "placeholder"
  >;
  className?: string;
  style?: React.CSSProperties;
  /** Content revealed after unlocking. */
  children?: React.ReactNode;
}

export interface LockInputHandle {
  /** Re-lock: restores the lock and clears the input. */
  reset(): void;
}

const DEFAULT_COLORS: LockColors = {
  purple: "#7f77dd",
  teal: "#1d9e75",
  coral: "#d85a30",
  body: "#171a28",
  shackle: "#232738",
};

type Status = "locked" | "unlocking" | "revealed";

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export const LockInput = React.forwardRef<LockInputHandle, LockInputProps>(
  function LockInput(
    {
      keyword,
      caseSensitive = false,
      onUnlock,
      onFail,
      onRevealed,
      placeholder = "keyword",
      colors: colorOverrides,
      inputProps,
      className,
      style,
      children,
    },
    ref,
  ) {
    React.useEffect(() => injectStyles(), []);

    const colors = React.useMemo(
      () => ({ ...DEFAULT_COLORS, ...colorOverrides }),
      [colorOverrides],
    );

    const sceneApi = React.useRef<SceneApi | null>(null);
    const winRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const [status, setStatus] = React.useState<Status>("locked");
    const [shaking, setShaking] = React.useState(false);
    const [revealStarted, setRevealStarted] = React.useState(false);
    const [reducedMotion, setReducedMotion] = React.useState(false);

    React.useEffect(() => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mq.matches);
      const on = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mq.addEventListener("change", on);
      return () => mq.removeEventListener("change", on);
    }, []);

    /* ---- keyword matching ---- */
    const matches = React.useCallback(
      (value: string) => {
        const v = value.trim();
        if (typeof keyword === "function") return keyword(v);
        if (keyword instanceof RegExp) return keyword.test(v);
        return caseSensitive
          ? v === keyword
          : v.toLowerCase() === keyword.toLowerCase();
      },
      [keyword, caseSensitive],
    );

    /* ---- HTML window placement (driven by the scene's projection) ---- */
    const handleSlotRect = React.useCallback((rect: SlotRect) => {
      const win = winRef.current;
      const input = inputRef.current;
      if (!win) return;
      win.style.left = `${rect.left}px`;
      win.style.top = `${rect.top}px`;
      win.style.width = `${rect.width}px`;
      win.style.height = `${rect.height}px`;
      if (input) input.style.fontSize = `${Math.max(13, rect.height * 0.4)}px`;
    }, []);

    /* ---- phase events from the scene ---- */
    const handlePhase = React.useCallback(
      (event: ScenePhaseEvent) => {
        if (event === "revealStart") setRevealStarted(true);
        if (event === "done") {
          setStatus("revealed");
          onRevealed?.();
        }
      },
      [onRevealed],
    );

    /* ---- input events ---- */
    const handleKeyDown = React.useCallback(
      (ev: React.KeyboardEvent<HTMLInputElement>) => {
        if (ev.key !== "Enter" || status !== "locked") return;
        if (ev.nativeEvent.isComposing) return; // don't fire mid-IME
        const value = ev.currentTarget.value;
        if (matches(value)) {
          setStatus("unlocking");
          inputRef.current?.blur();
          sceneApi.current?.unlock();
          onUnlock?.();
        } else {
          sceneApi.current?.fail();
          onFail?.(value);
          setShaking(false);
          requestAnimationFrame(() => setShaking(true));
          window.setTimeout(() => setShaking(false), 600);
        }
      },
      [status, matches, onUnlock, onFail],
    );

    const handleFocus = React.useCallback(
      () => sceneApi.current?.setFocus(true),
      [],
    );
    const handleBlur = React.useCallback(
      () => sceneApi.current?.setFocus(false),
      [],
    );

    /* ---- imperative handle ---- */
    React.useImperativeHandle(
      ref,
      () => ({
        reset() {
          sceneApi.current?.reset();
          if (inputRef.current) inputRef.current.value = "";
          setStatus("locked");
          setRevealStarted(false);
          setShaking(false);
        },
      }),
      [],
    );

    const cssVars = {
      "--p4ni-li-purple": colors.purple,
      "--p4ni-li-teal": colors.teal,
      "--p4ni-li-coral": colors.coral,
    } as React.CSSProperties;

    const lockCls = [
      "p4ni-li-lock",
      shaking ? "is-shake" : "",
      revealStarted || status === "revealed" ? "is-still" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const winCls = [
      "p4ni-li-win",
      shaking ? "is-error" : "",
      status !== "locked" ? "is-gone" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        className={["p4ni-li-root", className].filter(Boolean).join(" ")}
        style={{ ...cssVars, ...style }}
      >
        <div className={lockCls}>
          <Canvas
            dpr={[1, 2]}
            gl={{ alpha: true, antialias: true }}
            camera={{ fov: 38, position: [0, 0.35, 5.2] }}
          >
            <LockScene
              api={sceneApi}
              colors={colors}
              reducedMotion={reducedMotion}
              onSlotRect={handleSlotRect}
              onPhase={handlePhase}
            />
          </Canvas>
          <div ref={winRef} className={winCls}>
            <input
              ref={inputRef}
              className="p4ni-li-input"
              type="text"
              placeholder={placeholder}
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="go"
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={status !== "locked"}
              {...inputProps}
            />
          </div>
        </div>
        <div
          className={[
            "p4ni-li-secret",
            revealStarted || status === "revealed" ? "is-show" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {children}
        </div>
      </div>
    );
  },
);
