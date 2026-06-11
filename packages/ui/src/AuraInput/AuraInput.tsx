import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type InputHTMLAttributes,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { auraFragmentShader, auraVertexShader, MAX_PULSES } from "./shaders";

export interface AuraInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Gradient colors for the aura. The first 3 are used. */
  colors?: string[];
  /** Seconds per drift cycle of the aura fog. Lower is faster. */
  speed?: number;
  /** Idle glow strength, 0–1. */
  intensity?: number;
  /** Boost the glow and pulse on typing. */
  reactive?: boolean;
  /** Corner radius of the input in px. */
  radius?: number;
  /** Background color of the input surface. */
  surface?: string;
  /** Emit a ripple pulse on each keystroke (needs `reactive`). */
  particles?: boolean;
  /** How far the aura bleeds outside the input, in px. */
  bleed?: number;
  /** Frame rate cap for the WebGL canvas. Uncapped by default. */
  fps?: number;
  /** Extra styles for the outer wrapper. */
  wrapperStyle?: CSSProperties;
  /** Extra class for the outer wrapper. */
  wrapperClassName?: string;
}

/** `speed` value that maps to a 1x drift; mirrors GlowInput's default. */
const BASE_SPEED = 3.2;

/**
 * Mutable state shared between the input (DOM side) and the scene
 * (render-loop side) without re-rendering the Canvas.
 */
interface AuraShared {
  mode: "idle" | "focus" | "typing";
  intensity: number;
  speed: number;
  bleed: number;
  radius: number;
  fps: number | undefined;
  visible: boolean;
  reduced: boolean;
  /** Pulse seeds pushed per keystroke, consumed by the scene each frame. */
  pendingPulses: number[];
}

interface AuraUniforms {
  [uniform: string]: THREE.IUniform;
  uTime: { value: number };
  uClock: { value: number };
  uEnergy: { value: number };
  uResolution: { value: THREE.Vector2 };
  uBleed: { value: number };
  uRadius: { value: number };
  uColorA: { value: THREE.Vector3 };
  uColorB: { value: THREE.Vector3 };
  uColorC: { value: THREE.Vector3 };
  uPulses: { value: THREE.Vector4[] };
}

/**
 * Drives frames manually (Canvas uses frameloop="never") so we can skip
 * work while offscreen and cap the frame rate.
 */
function FrameDriver({ shared }: { shared: AuraShared }) {
  const advance = useThree((s) => s.advance);

  useEffect(() => {
    let raf = 0;
    let last = -Infinity;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!shared.visible) return;
      // reduced-motion crawls at 8fps; otherwise idle is capped at 30fps.
      const cap = shared.reduced
        ? 8
        : (shared.fps ?? (shared.mode === "idle" ? 30 : 0));
      if (cap > 0 && now - last < 1000 / cap - 0.5) return;
      last = now;
      advance(now);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [advance, shared]);

  return null;
}

function AuraScene({ shared, colors }: { shared: AuraShared; colors: string[] }) {
  const { material, uniforms } = useMemo(() => {
    const uniforms: AuraUniforms = {
      uTime: { value: 0 },
      uClock: { value: 0 },
      uEnergy: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uBleed: { value: 24 },
      uRadius: { value: 14 },
      uColorA: { value: new THREE.Vector3(0.5, 0.47, 0.87) },
      uColorB: { value: new THREE.Vector3(0.11, 0.62, 0.46) },
      uColorC: { value: new THREE.Vector3(0.85, 0.35, 0.19) },
      uPulses: {
        value: Array.from(
          { length: MAX_PULSES },
          () => new THREE.Vector4(-1000, 0, 0, 0),
        ),
      },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader: auraVertexShader,
      fragmentShader: auraFragmentShader,
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    return { material, uniforms };
  }, []);

  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    const a = colors[0] ?? "#7f77dd";
    const b = colors[1] ?? a;
    const c = colors[2] ?? colors[colors.length - 1] ?? a;
    uniforms.uColorA.value.copy(hexToVec3(a));
    uniforms.uColorB.value.copy(hexToVec3(b));
    uniforms.uColorC.value.copy(hexToVec3(c));
  }, [colors, uniforms]);

  // Simulation clocks live here, self-tracked from wall-clock time:
  // R3F's delta comes from the deprecated THREE.Clock and reports garbage
  // with manual advance() on recent three versions. The clamp also keeps
  // pauses (offscreen, fps caps) from producing time jumps.
  const sim = useRef({ time: 0, clock: 0, energy: 0, head: 0, last: 0 });

  useFrame((state) => {
    const c = sim.current;
    const now = performance.now() / 1000;
    const dt = c.last > 0 ? Math.min(now - c.last, 0.1) : 1 / 60;
    c.last = now;
    const timeScale = shared.reduced ? 0.05 : 1;
    c.time += dt * timeScale * (BASE_SPEED / Math.max(shared.speed, 0.1));
    c.clock += dt * timeScale;

    const target =
      shared.mode === "typing"
        ? Math.min(shared.intensity + 0.55, 1.4)
        : shared.mode === "focus"
          ? Math.min(shared.intensity + 0.3, 1.1)
          : shared.intensity * 0.75;
    c.energy += (target - c.energy) * (1 - Math.exp(-dt * 5));
    let energy = c.energy;
    if (shared.mode === "typing" && !shared.reduced) {
      energy += 0.12 * Math.sin(c.clock * 9);
    }

    while (shared.pendingPulses.length > 0) {
      const seed = shared.pendingPulses.shift() as number;
      const slot = uniforms.uPulses.value[c.head % MAX_PULSES];
      slot.set(c.clock, seed, (seed * 7.31) % 1, 0);
      c.head += 1;
    }

    uniforms.uTime.value = c.time;
    uniforms.uClock.value = c.clock;
    uniforms.uEnergy.value = energy;
    uniforms.uResolution.value.set(state.size.width, state.size.height);
    uniforms.uBleed.value = shared.bleed;
    uniforms.uRadius.value = shared.radius;
  });

  return (
    <mesh frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

export const AuraInput = forwardRef<HTMLInputElement, AuraInputProps>(
  function AuraInput(
    {
      colors = ["#7f77dd", "#1d9e75", "#d85a30"],
      speed = 3.2,
      intensity = 0.45,
      reactive = true,
      radius = 14,
      surface = "#0d0d12",
      particles = true,
      bleed = 24,
      fps,
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
    const [mounted, setMounted] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);
    const timer = useRef<ReturnType<typeof setTimeout>>();

    const shared = useRef<AuraShared>({
      mode: "idle",
      intensity,
      speed,
      bleed,
      radius,
      fps,
      visible: true,
      reduced: false,
      pendingPulses: [],
    }).current;

    // Sync prop/state snapshots into the render loop without React churn.
    shared.mode = state;
    shared.intensity = intensity;
    shared.speed = speed;
    shared.bleed = bleed;
    shared.radius = radius;
    shared.fps = fps;

    // Canvas mounts client-side only (SSR safety).
    useEffect(() => {
      setMounted(true);
      return () => clearTimeout(timer.current);
    }, []);

    // Pause rendering entirely while the input is offscreen.
    useEffect(() => {
      const el = wrapRef.current;
      if (!mounted || !el || typeof IntersectionObserver === "undefined") return;
      const io = new IntersectionObserver(([entry]) => {
        shared.visible = entry?.isIntersecting ?? true;
      });
      io.observe(el);
      return () => io.disconnect();
    }, [mounted, shared]);

    useEffect(() => {
      if (typeof window === "undefined" || !window.matchMedia) return;
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      const sync = () => {
        shared.reduced = mq.matches;
      };
      sync();
      mq.addEventListener("change", sync);
      return () => mq.removeEventListener("change", sync);
    }, [shared]);

    const handleInput = useCallback(
      (e: React.FormEvent<HTMLInputElement>) => {
        if (reactive) {
          setState("typing");
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setState("focus"), 350);
          if (
            particles &&
            !shared.reduced &&
            shared.pendingPulses.length < MAX_PULSES
          ) {
            shared.pendingPulses.push(Math.random());
          }
        }
        onInput?.(e as React.ChangeEvent<HTMLInputElement>);
      },
      [reactive, particles, shared, onInput],
    );

    return (
      <div
        ref={wrapRef}
        className={["p4ni-aura-wrap", wrapperClassName].filter(Boolean).join(" ")}
        style={{ position: "relative", ...wrapperStyle }}
      >
        {mounted && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: -bleed,
              // decoration only — clicks must reach whatever is underneath
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            <Canvas
              frameloop="never"
              flat
              linear
              dpr={[1, 2]}
              gl={{
                alpha: true,
                antialias: false,
                depth: false,
                stencil: false,
                powerPreference: "low-power",
              }}
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                // R3F's internal wrapper forces pointerEvents: "auto",
                // overriding our wrapper's "none" — re-disable it here so
                // the bleed area never swallows clicks meant for the page.
                pointerEvents: "none",
              }}
            >
              <FrameDriver shared={shared} />
              <AuraScene shared={shared} colors={colors} />
            </Canvas>
          </div>
        )}
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
            position: "relative",
            zIndex: 1,
            display: "block",
            width: "100%",
            boxSizing: "border-box",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            outline: "none",
            borderRadius: radius,
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

/** Parse a #rgb / #rrggbb hex into raw sRGB 0..1 (no color management). */
function hexToVec3(hex: string): THREE.Vector3 {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h.split("").map((c) => c + c).join("")
      : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return new THREE.Vector3(0.5, 0.47, 0.87);
  return new THREE.Vector3(
    ((n >> 16) & 255) / 255,
    ((n >> 8) & 255) / 255,
    (n & 255) / 255,
  );
}
