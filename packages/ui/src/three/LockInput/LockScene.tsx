import * as React from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface LockColors {
  purple: string;
  teal: string;
  coral: string;
  body: string;
  shackle: string;
  /** Particle palette. Defaults to [purple, teal, white, purple]. */
  particles?: string[];
}

export interface SceneApi {
  unlock(): void;
  fail(): void;
  reset(): void;
  setFocus(focused: boolean): void;
}

export type ScenePhaseEvent = "dissolveStart" | "revealStart" | "done";

export interface SlotRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface LockSceneProps {
  api: React.MutableRefObject<SceneApi | null>;
  colors: LockColors;
  reducedMotion: boolean;
  onSlotRect: (rect: SlotRect) => void;
  onPhase: (event: ScenePhaseEvent) => void;
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const G = {
  W: 2.7, H: 1.45, R: 0.26, D: 0.6,
  SLOT_W: 2.05, SLOT_H: 0.52, SLOT_Y: 0.12,
  LEG_X: 0.82, LEG_H: 0.5, TUBE: 0.13,
} as const;

const FRONT_Z = G.D / 2 + 0.06;
const SHACKLE_Y = G.H / 2 - 0.06;
const LOCK_Y = -0.15;

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeOutBack = (x: number) =>
  1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2);

type Phase =
  | "idle" | "shake" | "press" | "pop"
  | "swing" | "hold" | "dissolve" | "revealed";

/* ------------------------------------------------------------------ */
/* Procedural lock builder                                             */
/* ------------------------------------------------------------------ */

interface BuiltLock {
  group: THREE.Group;
  shackle: THREE.Group;
  body: THREE.Mesh;
  obsidian: THREE.MeshStandardMaterial;
  led: THREE.MeshStandardMaterial;
}

function buildLock(colors: LockColors): BuiltLock {
  const group = new THREE.Group();
  group.position.y = LOCK_Y;

  const obsidian = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colors.body), metalness: 0.92, roughness: 0.34,
  });
  const chrome = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colors.shackle), metalness: 1.0, roughness: 0.22,
  });
  const recess = new THREE.MeshStandardMaterial({
    color: 0x07080f, metalness: 0.4, roughness: 0.8,
  });

  // body: rounded extrusion
  const { W, H, R, D } = G;
  const shape = new THREE.Shape();
  shape.moveTo(-W / 2 + R, -H / 2);
  shape.lineTo(W / 2 - R, -H / 2);
  shape.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + R);
  shape.lineTo(W / 2, H / 2 - R);
  shape.quadraticCurveTo(W / 2, H / 2, W / 2 - R, H / 2);
  shape.lineTo(-W / 2 + R, H / 2);
  shape.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - R);
  shape.lineTo(-W / 2, -H / 2 + R);
  shape.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + R, -H / 2);
  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth: D, bevelEnabled: true, bevelThickness: 0.06,
    bevelSize: 0.06, bevelSegments: 5, curveSegments: 20,
  });
  bodyGeo.translate(0, 0, -D / 2);
  const body = new THREE.Mesh(bodyGeo, obsidian);
  group.add(body);

  // recessed dark window behind the CSS gradient frame
  const slotWin = new THREE.Mesh(
    new THREE.BoxGeometry(G.SLOT_W + 0.1, G.SLOT_H + 0.1, 0.06), recess,
  );
  slotWin.position.set(0, G.SLOT_Y, FRONT_Z - 0.005);
  group.add(slotWin);

  // status LED bar
  const led = new THREE.MeshStandardMaterial({
    color: 0x0a0a14, metalness: 0.2, roughness: 0.5,
    emissive: new THREE.Color(colors.purple), emissiveIntensity: 0.9,
  });
  const ledMesh = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.045, 0.04), led);
  ledMesh.position.set(0, -0.42, FRONT_Z + 0.02);
  group.add(ledMesh);

  // shackle, pivoted at the left leg so it can swing open
  const shackle = new THREE.Group();
  shackle.position.set(-G.LEG_X, SHACKLE_Y, 0);
  group.add(shackle);

  const arc = new THREE.Mesh(
    new THREE.TorusGeometry(G.LEG_X, G.TUBE, 18, 44, Math.PI), chrome,
  );
  arc.position.set(G.LEG_X, G.LEG_H, 0);
  shackle.add(arc);
  const legL = new THREE.Mesh(
    new THREE.CylinderGeometry(G.TUBE, G.TUBE, G.LEG_H + 0.25, 18), chrome,
  );
  legL.position.set(0, G.LEG_H / 2 - 0.12, 0);
  shackle.add(legL);
  const legR = new THREE.Mesh(
    new THREE.CylinderGeometry(G.TUBE, G.TUBE, G.LEG_H + 0.25, 18), chrome,
  );
  legR.position.set(G.LEG_X * 2, G.LEG_H / 2 - 0.12, 0);
  shackle.add(legR);

  return { group, shackle, body, obsidian, led };
}

function disposeLock(group: THREE.Group) {
  group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const m = obj as THREE.Mesh;
      m.geometry.dispose();
      (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) =>
        mat.dispose(),
      );
    }
  });
}

/* ------------------------------------------------------------------ */
/* Scene component                                                     */
/* ------------------------------------------------------------------ */

export function LockScene({
  api, colors, reducedMotion, onSlotRect, onPhase,
}: LockSceneProps) {
  const { camera, scene, size } = useThree();

  const col = React.useMemo(
    () => ({
      purple: new THREE.Color(colors.purple),
      teal: new THREE.Color(colors.teal),
      coral: new THREE.Color(colors.coral),
    }),
    [colors],
  );

  const built = React.useMemo(() => buildLock(colors), [colors]);
  React.useEffect(() => () => disposeLock(built.group), [built]);

  const rimP = React.useRef<THREE.PointLight>(null!);
  const rimT = React.useRef<THREE.PointLight>(null!);

  // ---- state machine (refs: no React re-renders inside the loop) ----
  const phase = React.useRef<Phase>("idle");
  const t0 = React.useRef(0);
  const clockNow = React.useRef(0);
  const onPhaseRef = React.useRef(onPhase);
  onPhaseRef.current = onPhase;

  const DUR = React.useMemo(
    () =>
      reducedMotion
        ? { press: 0.05, pop: 0.12, swing: 0.15, hold: 0.1, dissolve: 0.8 }
        : { press: 0.1, pop: 0.28, swing: 0.38, hold: 0.35, dissolve: 1.7 },
    [reducedMotion],
  );

  const setPhase = React.useCallback((p: Phase) => {
    phase.current = p;
    t0.current = clockNow.current;
  }, []);

  // ---- particles ----
  const particles = React.useRef<{
    points: THREE.Points;
    pos: Float32Array;
    vel: Float32Array;
    count: number;
  } | null>(null);

  const buildParticles = React.useCallback(() => {
    const palette = (
      colors.particles ?? [colors.purple, colors.teal, "#e8e6f0", colors.purple]
    ).map((c) => new THREE.Color(c));
    const positions: number[] = [];
    const colorArr: number[] = [];
    const velocities: number[] = [];
    built.group.updateMatrixWorld(true);
    built.group.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      const mesh = obj as THREE.Mesh;
      const attr = mesh.geometry.attributes.position;
      const per = mesh === built.body ? 1700 : 320;
      for (let i = 0; i < per; i++) {
        const vi = (Math.random() * attr.count) | 0;
        const v = new THREE.Vector3().fromBufferAttribute(attr, vi);
        mesh.localToWorld(v);
        positions.push(v.x, v.y, v.z);
        const r = v.clone().sub(new THREE.Vector3(0, 0.15, 0));
        const out = r.clone().normalize().multiplyScalar(0.5 + Math.random() * 1.1);
        const swirl = new THREE.Vector3()
          .crossVectors(r, new THREE.Vector3(0, 1, 0))
          .normalize()
          .multiplyScalar(0.9 + Math.random() * 0.8);
        velocities.push(
          out.x + swirl.x,
          out.y + swirl.y + 0.55 + Math.random() * 0.5,
          out.z + swirl.z,
        );
        const c = palette[(Math.random() * palette.length) | 0];
        colorArr.push(c.r, c.g, c.b);
      }
    });
    const count = positions.length / 3;
    const pos = new Float32Array(positions);
    const vel = new Float32Array(velocities);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colorArr, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.035, vertexColors: true, transparent: true,
      opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);
    particles.current = { points, pos, vel, count };
  }, [built, colors, scene]);

  const removeParticles = React.useCallback(() => {
    const p = particles.current;
    if (!p) return;
    scene.remove(p.points);
    p.points.geometry.dispose();
    (p.points.material as THREE.Material).dispose();
    particles.current = null;
  }, [scene]);

  // ---- imperative API exposed to the React side ----
  React.useEffect(() => {
    api.current = {
      unlock: () => {
        if (phase.current === "idle" || phase.current === "shake") setPhase("press");
      },
      fail: () => {
        if (phase.current === "idle") setPhase("shake");
      },
      reset: () => {
        removeParticles();
        built.shackle.rotation.y = 0;
        built.shackle.position.y = SHACKLE_Y;
        built.obsidian.emissive.setRGB(0, 0, 0);
        built.obsidian.emissiveIntensity = 1;
        built.group.visible = true;
        setPhase("idle");
      },
      setFocus: (focused) => {
        if (rimP.current) rimP.current.intensity = focused ? 4.6 : 3.2;
        if (rimT.current) rimT.current.intensity = focused ? 3.4 : 2.4;
      },
    };
    return () => { api.current = null; };
  }, [api, built, removeParticles, setPhase]);

  // ---- project the slot rect into CSS pixels for the HTML window ----
  React.useEffect(() => {
    camera.lookAt(0, 0.2, 0);
    camera.updateMatrixWorld();
    const proj = (x: number, y: number): [number, number] => {
      const v = new THREE.Vector3(x, y + LOCK_Y, FRONT_Z).project(camera);
      return [(v.x * 0.5 + 0.5) * size.width, (-v.y * 0.5 + 0.5) * size.height];
    };
    const [x1, y1] = proj(-G.SLOT_W / 2, G.SLOT_Y + G.SLOT_H / 2);
    const [x2, y2] = proj(G.SLOT_W / 2, G.SLOT_Y - G.SLOT_H / 2);
    onSlotRect({ left: x1, top: y1, width: x2 - x1, height: y2 - y1 });
  }, [camera, size, onSlotRect]);

  // ---- animation loop ----
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    clockNow.current = t;
    const e = t - t0.current;
    const p = phase.current;
    const { obsidian, led, shackle } = built;

    if (p === "idle") {
      const k = (Math.sin(t * 1.4) + 1) / 2;
      led.emissive.copy(col.purple).lerp(col.teal, k * 0.45);
      led.emissiveIntensity = 0.7 + k * 0.5;
    } else if (p === "shake") {
      const k = Math.max(0, 1 - e / 0.5);
      obsidian.emissive.copy(col.coral);
      obsidian.emissiveIntensity = k * 0.25;
      led.emissive.copy(col.coral);
      led.emissiveIntensity = 1.6 * k + 0.4;
      if (k === 0) {
        obsidian.emissive.setRGB(0, 0, 0);
        obsidian.emissiveIntensity = 1;
        setPhase("idle");
      }
    } else if (p === "press") {
      led.emissive.copy(col.teal);
      led.emissiveIntensity = 2.2;
      const k = Math.min(e / DUR.press, 1);
      shackle.position.y = SHACKLE_Y - 0.06 * Math.sin(k * Math.PI);
      if (k === 1) setPhase("pop");
    } else if (p === "pop") {
      const k = Math.min(e / DUR.pop, 1);
      shackle.position.y = SHACKLE_Y + 0.36 * easeOutBack(k);
      if (k === 1) setPhase("swing");
    } else if (p === "swing") {
      const k = Math.min(e / DUR.swing, 1);
      shackle.rotation.y = -1.25 * easeOutCubic(k);
      if (k === 1) setPhase("hold");
    } else if (p === "hold") {
      if (e >= DUR.hold) {
        buildParticles();
        built.group.visible = false;
        setPhase("dissolve");
        onPhaseRef.current("dissolveStart");
      }
    } else if (p === "dissolve") {
      const pr = particles.current;
      if (pr) {
        const k = Math.min(e / DUR.dissolve, 1);
        const damp = 1 - k * 0.35;
        for (let i = 0; i < pr.count; i++) {
          pr.pos[i * 3] += pr.vel[i * 3] * delta * damp;
          pr.pos[i * 3 + 1] += pr.vel[i * 3 + 1] * delta * damp;
          pr.pos[i * 3 + 2] += pr.vel[i * 3 + 2] * delta * damp;
        }
        pr.points.geometry.attributes.position.needsUpdate = true;
        const mat = pr.points.material as THREE.PointsMaterial;
        mat.opacity = 1 - easeOutCubic(k);
        mat.size = 0.035 * (1 - k * 0.5);
        if (k > 0.25) onPhaseRef.current("revealStart");
        if (k === 1) {
          removeParticles();
          setPhase("revealed");
          onPhaseRef.current("done");
        }
      }
    }
  });

  return (
    <>
      <ambientLight color={0x32344e} intensity={1.1} />
      <directionalLight color={0xdde0ff} intensity={0.55} position={[2, 3, 4]} />
      <pointLight ref={rimP} color={col.purple} intensity={3.2} distance={14} position={[-3.4, 1.6, 2.2]} />
      <pointLight ref={rimT} color={col.teal} intensity={2.4} distance={14} position={[3.4, -0.7, 2.4]} />
      <pointLight color={col.purple} intensity={1.2} distance={12} position={[0, 2.2, -3]} />
      <primitive object={built.group} />
    </>
  );
}
