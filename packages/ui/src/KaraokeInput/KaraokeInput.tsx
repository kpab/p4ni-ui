import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type TextareaHTMLAttributes,
} from "react";

export interface KaraokeInputProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Star particle colors. Gold-ish by default, like DAM's pitch-match sparkle. */
  colors?: string[];
  /** Gradient of the sweeping score bar: [start, end]. */
  barColors?: [string, string];
  /** Seconds for the bar to sweep across the committed line. */
  sweepDuration?: number;
  /** Approximate number of stars emitted per committed line. */
  starCount?: number;
  /** Corner radius of the outer frame in px. */
  radius?: number;
  /** Background color of the input surface. */
  surface?: string;
  /** Extra styles for the outer wrapper. */
  wrapperStyle?: CSSProperties;
  /** Extra class for the outer wrapper. */
  wrapperClassName?: string;
}

interface Sweep {
  x0: number;
  x1: number;
  y: number;
  h: number;
  born: number;
  duration: number;
  spawned: number;
  budget: number;
}

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
  born: number;
  life: number;
  phase: number;
}

const MIRROR_PROPS = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "letterSpacing",
  "lineHeight",
  "textTransform",
  "wordSpacing",
  "textIndent",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
] as const;

export const KaraokeInput = forwardRef<HTMLTextAreaElement, KaraokeInputProps>(
  function KaraokeInput(
    {
      colors = ["#ffe066", "#fff6c2", "#ffc93c", "#ffffff"],
      barColors = ["#ffdf6e", "#ff9d2e"],
      sweepDuration = 0.38,
      starCount = 18,
      radius = 14,
      surface = "#0d0d12",
      wrapperStyle,
      wrapperClassName,
      style,
      onKeyDown,
      onFocus,
      onBlur,
      rows = 4,
      ...textareaProps
    },
    ref,
  ) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const taRef = useRef<HTMLTextAreaElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mirrorRef = useRef<HTMLDivElement>(null);
    const sweepsRef = useRef<Sweep[]>([]);
    const starsRef = useRef<Star[]>([]);
    const rafRef = useRef(0);
    const lastRef = useRef(0);
    const [focused, setFocused] = useState(false);

    useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

    const drawStarShape = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      r: number,
      rot: number,
    ) => {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = rot + (Math.PI / 4) * i;
        const rr = i % 2 === 0 ? r : r * 0.38;
        const px = x + Math.cos(a) * rr;
        const py = y + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    };

    const tick = useCallback(
      (now: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const dt = Math.min((now - lastRef.current) / 1000, 0.05);
        lastRef.current = now;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

        const sweeps = sweepsRef.current;
        const stars = starsRef.current;
        const fadeDuration = 0.45;

        for (const s of sweeps) {
          const t = (now - s.born) / 1000;
          const p = Math.min(t / s.duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const fade =
            p < 1 ? 1 : Math.max(0, 1 - (t - s.duration) / fadeDuration);
          const front = s.x0 + (s.x1 - s.x0) * eased;
          const barH = s.h * 0.82;
          const barY = s.y + (s.h - barH) / 2;

          const grad = ctx.createLinearGradient(s.x0, 0, s.x1, 0);
          grad.addColorStop(0, barColors[0]);
          grad.addColorStop(1, barColors[1]);
          ctx.save();
          ctx.globalAlpha = 0.32 * fade;
          ctx.fillStyle = grad;
          ctx.shadowColor = barColors[0];
          ctx.shadowBlur = 14;
          ctx.beginPath();
          const rr = Math.min(barH / 2, 10);
          roundedRect(ctx, s.x0, barY, Math.max(front - s.x0, rr * 2), barH, rr);
          ctx.fill();

          // bright leading edge, like the pitch bar's fill front
          if (p < 1) {
            ctx.globalAlpha = 0.9 * fade;
            ctx.fillStyle = "#fffbe8";
            ctx.shadowBlur = 18;
            ctx.beginPath();
            roundedRect(ctx, front - 3, barY - 2, 5, barH + 4, 2.5);
            ctx.fill();
          }
          ctx.restore();

          // emit stars from the sweep front
          const due = Math.floor(eased * s.budget);
          while (s.spawned < due) {
            s.spawned++;
            stars.push({
              x: front + (Math.random() - 0.5) * 6,
              y: s.y + Math.random() * s.h,
              vx: (Math.random() - 0.35) * 90,
              vy: -50 - Math.random() * 110,
              rot: Math.random() * Math.PI,
              vr: (Math.random() - 0.5) * 8,
              size: 2.5 + Math.random() * 4.5,
              color: colors[Math.floor(Math.random() * colors.length)],
              born: now,
              life: 0.5 + Math.random() * 0.45,
              phase: Math.random() * Math.PI * 2,
            });
          }
        }
        sweepsRef.current = sweeps.filter(
          (s) => (now - s.born) / 1000 < s.duration + fadeDuration,
        );

        for (const st of stars) {
          const t = (now - st.born) / 1000;
          if (t >= st.life) continue;
          st.vy += 160 * dt;
          st.x += st.vx * dt;
          st.y += st.vy * dt;
          st.rot += st.vr * dt;
          const k = 1 - t / st.life;
          const twinkle = 0.72 + 0.28 * Math.sin(t * 22 + st.phase);
          ctx.save();
          ctx.globalAlpha = k * k;
          ctx.fillStyle = st.color;
          ctx.shadowColor = st.color;
          ctx.shadowBlur = 8;
          drawStarShape(ctx, st.x, st.y, st.size * twinkle, st.rot);
          ctx.restore();
        }
        starsRef.current = stars.filter((st) => (now - st.born) / 1000 < st.life);

        if (sweepsRef.current.length || starsRef.current.length) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        }
      },
      [barColors, colors],
    );

    const fireLineEffect = useCallback(() => {
      const ta = taRef.current;
      const wrap = wrapRef.current;
      const canvas = canvasRef.current;
      const mirror = mirrorRef.current;
      if (!ta || !wrap || !canvas || !mirror) return;
      if (
        typeof matchMedia !== "undefined" &&
        matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }

      const selEnd = ta.selectionStart ?? ta.value.length;
      const lineStart = ta.value.lastIndexOf("\n", selEnd - 1) + 1;
      const lineText = ta.value.slice(lineStart, selEnd);
      if (!lineText.trim()) return;

      // Mirror the textarea's text layout to locate the committed line.
      const cs = getComputedStyle(ta);
      for (const p of MIRROR_PROPS) mirror.style[p] = cs[p];
      const padLeft = parseFloat(cs.paddingLeft) || 0;
      const padRight = parseFloat(cs.paddingRight) || 0;
      mirror.style.width = `${ta.clientWidth - padLeft - padRight}px`;
      mirror.textContent = "";
      mirror.appendChild(document.createTextNode(ta.value.slice(0, lineStart)));
      const m1 = document.createElement("span");
      mirror.appendChild(m1);
      mirror.appendChild(document.createTextNode(lineText));
      const m2 = document.createElement("span");
      m2.textContent = "​";
      mirror.appendChild(m2);

      const lineH =
        parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.6 || 24;
      const sameRow = m1.offsetTop === m2.offsetTop;
      const x0 = ta.offsetLeft + (sameRow ? m1.offsetLeft : padLeft);
      const x1 = ta.offsetLeft + m2.offsetLeft;
      const y = ta.offsetTop + m2.offsetTop - ta.scrollTop;
      mirror.textContent = "";

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = wrap.clientWidth * dpr;
      canvas.height = wrap.clientHeight * dpr;

      sweepsRef.current.push({
        x0,
        x1: Math.max(x1, x0 + 24),
        y,
        h: lineH,
        born: performance.now(),
        duration: sweepDuration,
        spawned: 0,
        budget: starCount,
      });
      cancelAnimationFrame(rafRef.current);
      lastRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    }, [sweepDuration, starCount, tick]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Skip the Enter that confirms an IME composition (Japanese input).
        if (e.key === "Enter" && !e.nativeEvent.isComposing) {
          fireLineEffect();
        }
        onKeyDown?.(e);
      },
      [fireLineEffect, onKeyDown],
    );

    return (
      <div
        ref={wrapRef}
        className={wrapperClassName}
        style={{
          position: "relative",
          padding: 2,
          borderRadius: radius,
          background: focused
            ? `linear-gradient(135deg, ${barColors[0]}, ${barColors[1]})`
            : "#26262e",
          boxShadow: focused ? `0 0 18px ${hexToRgba(barColors[0], 0.35)}` : "none",
          transition: "background 0.25s ease, box-shadow 0.25s ease",
          ...wrapperStyle,
        }}
      >
        <textarea
          ref={(node) => {
            taRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          rows={rows}
          {...textareaProps}
          onKeyDown={handleKeyDown}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={{
            display: "block",
            width: "100%",
            boxSizing: "border-box",
            border: "none",
            outline: "none",
            resize: "vertical",
            borderRadius: radius - 2,
            padding: "14px 18px",
            fontSize: 15,
            lineHeight: 1.6,
            background: surface,
            color: "#f5f5f7",
            ...style,
          }}
        />
        <div
          ref={mirrorRef}
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            visibility: "hidden",
            pointerEvents: "none",
            whiteSpace: "pre-wrap",
            overflowWrap: "break-word",
            boxSizing: "content-box",
          }}
        />
        <canvas
          ref={canvasRef}
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            borderRadius: radius,
          }}
        />
      </div>
    );
  },
);

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h.split("").map((c) => c + c).join("")
      : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(255, 223, 110, ${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
}
