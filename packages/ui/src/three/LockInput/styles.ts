const STYLE_ID = "p4ni-lockinput-styles";

const css = `
@property --p4ni-li-a {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}
.p4ni-li-root {
  position: relative;
  width: 100%;
  aspect-ratio: 12 / 11;
  --p4ni-li-purple: #7f77dd;
  --p4ni-li-teal: #1d9e75;
  --p4ni-li-coral: #d85a30;
  --p4ni-li-text: #e8e6f0;
}
.p4ni-li-lock {
  position: absolute;
  inset: 0;
  animation: p4ni-li-float 4.5s ease-in-out infinite;
}
.p4ni-li-lock.is-shake { animation: p4ni-li-shake .5s; }
.p4ni-li-lock.is-still { animation: none; }
.p4ni-li-lock > canvas { display: block; width: 100%; height: 100%; }
@keyframes p4ni-li-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-7px); }
}
@keyframes p4ni-li-shake {
  0%,100% { transform: translateX(0); }
  15% { transform: translateX(-10px) rotate(-0.6deg); }
  35% { transform: translateX(8px) rotate(0.5deg); }
  55% { transform: translateX(-6px); }
  75% { transform: translateX(3px); }
}
.p4ni-li-win {
  position: absolute;
  padding: 1.5px;
  border-radius: 11px;
  background: conic-gradient(from var(--p4ni-li-a),
    var(--p4ni-li-purple), var(--p4ni-li-teal),
    var(--p4ni-li-purple), var(--p4ni-li-coral), var(--p4ni-li-purple));
  animation: p4ni-li-spin 3.2s linear infinite;
  filter: drop-shadow(0 0 10px rgba(127,119,221,.28));
  transition: opacity .3s, filter .3s;
}
@keyframes p4ni-li-spin { to { --p4ni-li-a: 360deg; } }
.p4ni-li-win:focus-within {
  filter: drop-shadow(0 0 18px rgba(127,119,221,.55));
}
.p4ni-li-win.is-error {
  background: conic-gradient(from var(--p4ni-li-a),
    var(--p4ni-li-coral), #8a2f14, var(--p4ni-li-coral));
  filter: drop-shadow(0 0 16px rgba(216,90,48,.55));
}
.p4ni-li-win.is-gone { opacity: 0; pointer-events: none; }
.p4ni-li-input {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  background: rgba(9, 11, 20, 0.92);
  border: none;
  border-radius: 9.5px;
  color: var(--p4ni-li-text);
  font-family: inherit;
  text-align: center;
  letter-spacing: 0.18em;
  caret-color: var(--p4ni-li-purple);
}
.p4ni-li-input:focus { outline: none; }
.p4ni-li-input::placeholder { color: #4a4d66; letter-spacing: 0.1em; }
.p4ni-li-secret {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transform: scale(0.92);
  transition: opacity 1.1s ease .4s, transform 1.1s cubic-bezier(.2,.8,.2,1) .4s;
}
.p4ni-li-secret.is-show {
  opacity: 1;
  pointer-events: auto;
  transform: scale(1);
}
@media (prefers-reduced-motion: reduce) {
  .p4ni-li-lock, .p4ni-li-lock.is-shake, .p4ni-li-win { animation: none; }
  .p4ni-li-secret { transition-duration: .2s; transition-delay: 0s; }
}
`;

/** Inject component CSS once per document. SSR-safe (no-op outside the browser). */
export function injectStyles(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = css;
  document.head.appendChild(el);
}
