const c = (v) => `rgb(var(--${v}-rgb) / <alpha-value>)`;

/** Tokens de tema que usa internamente @joseparedesc/master-crud (clay, moss, ink, line, mist, ...). */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "./node_modules/@joseparedesc/master-crud/dist/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        ink: c("ink"), line: c("line"), surface: c("surface"), mist: c("mist"), slate: c("slate"),
        paper: c("paper"), clay: c("clay"), "clay-light": c("clay-light"), moss: c("moss"), "moss-light": c("moss-light"),
      },
      borderRadius: { xl2: "1rem" },
      boxShadow: {
        soft: "0 1px 2px rgb(0 0 0 / .06)",
        card: "0 8px 30px rgb(0 0 0 / .18)",
      },
    },
  },
};
