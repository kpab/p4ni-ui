/**
 * Shaders for AuraInput.
 *
 * The mesh is a clip-space quad (planeGeometry 2x2, camera ignored), so all
 * spatial math happens in the fragment shader in CSS-pixel coordinates
 * centered on the canvas.
 *
 * Uniforms:
 * - uTime       drift clock in seconds, pre-scaled by `speed` on the CPU.
 *               Drives the noise fog motion. Pauses while offscreen.
 * - uClock      unscaled clock in seconds (same pause behavior as uTime).
 *               Drives pulse expansion/decay so pulses feel identical at
 *               any `speed` setting.
 * - uEnergy     overall glow strength (~0..1.4). Lerped on the CPU toward
 *               the idle/focus/typing target each frame.
 * - uResolution canvas size in CSS px.
 * - uBleed      gap in px between the input rect and the canvas edge
 *               (the canvas extends `bleed` px beyond the input on each side).
 * - uRadius     corner radius of the input rect in px.
 * - uColorA/B/C gradient stops as raw sRGB 0..1 vectors (no color management).
 * - uPulses     ring buffer of typing pulses, one vec4 per pulse:
 *               x = start time on the uClock timeline (-1000 when unused)
 *               y = angle seed 0..1 (skews the ring toward one side)
 *               z = hue seed 0..1 (picks the pulse tint between B and C)
 *               w = unused.
 */

/** Size of the uPulses ring buffer. */
export const MAX_PULSES = 8;

export const auraVertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  // planeGeometry(2, 2) already spans clip space; skip camera transforms.
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const auraFragmentShader = /* glsl */ `
precision highp float;

#define MAX_PULSES ${MAX_PULSES}

varying vec2 vUv;

uniform float uTime;
uniform float uClock;
uniform float uEnergy;
uniform vec2  uResolution;
uniform float uBleed;
uniform float uRadius;
uniform vec3  uColorA;
uniform vec3  uColorB;
uniform vec3  uColorC;
uniform vec4  uPulses[MAX_PULSES];

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// Value noise, smooth-interpolated lattice.
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// 3 octaves keeps it cheap; the look reads as fog, not detail.
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = p * 2.07 + 19.19;
    a *= 0.5;
  }
  return v;
}

// Signed distance to a rounded box centered at the origin.
// b = half-size of the box, r = corner radius. Negative inside.
float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// 3-stop wrapping gradient: A -> B -> C -> A.
vec3 grad(float t) {
  float s = fract(t) * 3.0;
  vec3 c = mix(uColorA, uColorB, smoothstep(0.0, 1.0, s));
  c = mix(c, uColorC, smoothstep(1.0, 2.0, s));
  return mix(c, uColorA, smoothstep(2.0, 3.0, s));
}

void main() {
  vec2 p = (vUv - 0.5) * uResolution;        // px, origin at canvas center
  vec2 halfSize = 0.5 * uResolution - uBleed; // half-size of the input rect
  float r = min(uRadius, min(halfSize.x, halfSize.y));
  float d = sdRoundedBox(p, halfSize, r);     // < 0 behind the input

  // Drifting fog: two fbm layers scrolling in opposite directions.
  vec2 np = p * 0.014;
  float n = fbm(np + vec2(uTime * 0.35, -uTime * 0.22));
  n = 0.5 + 0.9 * (n - 0.5)
        + 0.4 * (fbm(np * 1.9 - vec2(uTime * 0.18, uTime * 0.27)) - 0.5);

  // Concentrate the glow on the border: soft halo outside + thin rim,
  // and fade out the area hidden behind the input itself.
  float halo = exp(-max(d, 0.0) / max(uBleed * 0.55, 6.0));
  float rim = exp(-abs(d) / (3.0 + uBleed * 0.12));
  float insideFade = smoothstep(-14.0, 2.0, d);
  float aura = (halo * 0.85 + rim * 0.9) * insideFade * (0.4 + 0.9 * n);

  // Typing pulses: rings expanding outward from the border.
  float pulse = 0.0;
  vec3 pulseTint = vec3(0.0);
  float theta = atan(p.y, p.x);
  for (int i = 0; i < MAX_PULSES; i++) {
    float age = uClock - uPulses[i].x;
    if (age < 0.0 || age > 1.6) continue;
    float ring = age * 110.0;                 // expansion speed in px/s
    float band = exp(-abs(d - ring) / 7.0);
    float fade = exp(-age * 2.6);
    // Skew each ring toward one side of the input for variety.
    float side = 0.55 + 0.45 * cos(theta - uPulses[i].y * 6.2831853);
    float w = band * fade * side;
    pulse += w;
    pulseTint += w * mix(uColorB, uColorC, uPulses[i].z);
  }

  // Color the aura with the gradient, swept by angle + noise.
  float t = theta / 6.2831853 + uTime * 0.05 + n * 0.3;
  vec3 col = grad(t);
  col = mix(col, pulseTint, clamp(pulse * 0.5, 0.0, 0.6));

  // Fade before the canvas boundary so the aura never ends in a hard
  // rectangular edge where the canvas does.
  float edgeFade = 1.0 - smoothstep(uBleed * 0.45, uBleed * 0.95, max(d, 0.0));

  float a = clamp((aura + pulse * 0.6 * insideFade) * uEnergy, 0.0, 1.0) * edgeFade;
  gl_FragColor = vec4(col, a);
}
`;
