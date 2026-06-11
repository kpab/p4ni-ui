import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type InputHTMLAttributes,
} from "react";

export interface GlowInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Gradient colors for the rotating border. 2+ colors recommended. */
  colors?: string[];
  /** Seconds per full rotation of the gradient. */
  speed?: number;
  /** Idle glow strength, 0–1. */
  intensity?: number;
  /** Pulse the glow on typing. */
  reactive?: boolean;
  /** Corner radius of the outer frame in px. */
  radius?: number;
  /** Background color of the input surface. */
  surface?: string;
  /** Extra styles for the outer wrapper. */
  wrapperStyle?: CSSProperties;
  /** Extra class for the outer wrapper. */
  wrapperClassName?: string;
}

const STYLE_ID = "p4ni-glow-input-keyframes";

function ensureGlobalStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = `
@property --p4ni-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}
@keyframes p4ni-glow-spin {
  to { --p4ni-angle: 360deg; }
}
@media (prefers-reduced-motion: reduce) {
  .p4ni-glow-wrap { animation: none !important; }
}
`;
  document.head.appendChild(el);
}

export const GlowInput = forwardRef<HTMLInputElement, GlowInputProps>(
  function GlowInput(
    {
      colors = ["#7f77dd", "#1d9e75", "#d85a30", "#ed93b1"],
      speed = 3.2,
      intensity = 0.45,
      reactive = true,
      radius = 14,
      surface = "#0d0d12",
      wrapperStyle,
      wrapperClassName,
      style,
      onInput,
      onFocus,
      onBlur,
      ...inputProps
    },
    ref,
  ) {
    const [state, setState] = useState<"idle" | "focus" | "typing">("idle");
    const timer = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
      ensureGlobalStyles();
      return () => clearTimeout(timer.current);
    }, []);

    const handleInput = useCallback(
      (e: React.FormEvent<HTMLInputElement>) => {
        if (reactive) {
          setState("typing");
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setState("focus"), 350);
        }
        onInput?.(e as React.ChangeEvent<HTMLInputElement>);
      },
      [reactive, onInput],
    );

    const primary = colors[0] ?? "#7f77dd";
    const secondary = colors[2] ?? colors[colors.length - 1] ?? primary;
    const gradient = `conic-gradient(from var(--p4ni-angle, 0deg), ${[...colors, primary].join(", ")})`;

    const glowAlpha =
      state === "typing"
        ? Math.min(intensity + 0.4, 1)
        : state === "focus"
          ? Math.min(intensity + 0.2, 1)
          : intensity;

    const blurPx = state === "typing" ? 22 : state === "focus" ? 16 : 10;

    const filter =
      state === "typing"
        ? `drop-shadow(0 0 ${blurPx}px ${hexToRgba(primary, glowAlpha)}) drop-shadow(0 0 ${blurPx * 1.8}px ${hexToRgba(secondary, glowAlpha * 0.5)})`
        : `drop-shadow(0 0 ${blurPx}px ${hexToRgba(primary, glowAlpha)})`;

    return (
      <div
        className={["p4ni-glow-wrap", wrapperClassName].filter(Boolean).join(" ")}
        style={{
          position: "relative",
          padding: 2,
          borderRadius: radius,
          background: gradient,
          animation: `p4ni-glow-spin ${speed}s linear infinite`,
          filter,
          transition: "filter 0.25s ease",
          ...wrapperStyle,
        }}
      >
        <input
          ref={ref}
          {...inputProps}
          onInput={handleInput}
          onFocus={(e) => {
            setState("focus");
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setState("idle");
            onBlur?.(e);
          }}
          style={{
            display: "block",
            width: "100%",
            boxSizing: "border-box",
            border: "none",
            outline: "none",
            borderRadius: radius - 2,
            padding: "14px 18px",
            fontSize: 15,
            background: surface,
            color: "#f5f5f7",
            ...style,
          }}
        />
      </div>
    );
  },
);

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h.split("").map((c) => c + c).join("")
      : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(127, 119, 221, ${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
}
