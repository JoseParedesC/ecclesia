import { readFileSync } from "node:fs";
import plugin from "tailwindcss/plugin";

const tokens = JSON.parse(readFileSync(new URL("./theme.tokens.json", import.meta.url), "utf8"));

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};
const colorVars = (mode) => Object.fromEntries(Object.entries(tokens.colors[mode]).map(([k, v]) => [`--c-${k}`, rgb(v)]));
const shadowVars = (mode) => Object.fromEntries(Object.entries(tokens.shadows[mode]).map(([k, v]) => [`--shadow-${k}`, v]));
const tw = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;
const m = tokens.motion;

// Colores semánticos + alias que usa internamente @joseparedesc/master-crud
const colors = Object.fromEntries(Object.keys(tokens.colors.light).map((k) => [k, tw(k)]));
Object.assign(colors, {
  paper: tw("bg"), slate: tw("muted"), clay: tw("primary"), "clay-light": tw("primary-soft"),
  moss: tw("success"), "moss-light": tw("success-soft"),
  white: tw("primary-ink"), // el paquete usa text-white sobre bg-clay: así mantiene contraste en ambos temas
});

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}", "./node_modules/@joseparedesc/master-crud/dist/**/*.js"],
  theme: {
    extend: {
      colors,
      fontFamily: { sans: [tokens.fonts.sans], serif: [tokens.fonts.serif] },
      borderRadius: { sm: tokens.radius.sm, DEFAULT: tokens.radius.md, md: tokens.radius.md, lg: tokens.radius.lg, xl: tokens.radius.xl, xl2: tokens.radius.xl2 },
      boxShadow: { soft: "var(--shadow-soft)", card: "var(--shadow-card)" },
      transitionDuration: { fast: m.fast, base: m.base, slow: m.slow },
      transitionTimingFunction: { standard: m.ease },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        slideDown: { from: { opacity: "0", transform: "translateY(-6px)" }, to: { opacity: "1", transform: "none" } },
        scaleIn: { from: { opacity: "0", transform: "scale(.96)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        "fade-in": `fadeIn ${m.slow} ${m.ease} both`,
        "slide-up": `slideUp ${m.slow} ${m.ease} both`,
        "slide-down": `slideDown ${m.base} ${m.ease} both`,
        "scale-in": `scaleIn ${m.base} ${m.ease} both`,
      },
    },
  },
  plugins: [
    plugin(({ addBase }) =>
      addBase({
        ":root": { ...colorVars("light"), ...shadowVars("light"), colorScheme: "light" },
        ':root[data-theme="dark"]': { ...colorVars("dark"), ...shadowVars("dark"), colorScheme: "dark" },
        // Al imprimir siempre se usa la paleta clara, aunque la pantalla esté en oscuro
        "@media print": {
          ':root, :root[data-theme="dark"]': { ...colorVars("light"), ...shadowVars("light"), colorScheme: "light" },
        },
        "@media (prefers-reduced-motion: reduce)": {
          "*, *::before, *::after": { animationDuration: "0.01ms !important", animationIterationCount: "1 !important", transitionDuration: "0.01ms !important", scrollBehavior: "auto !important" },
        },
      }),
    ),
  ],
};
