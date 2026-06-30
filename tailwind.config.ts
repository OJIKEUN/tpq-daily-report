import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: ["light", "emerald", "corporate"], 
    // We can use 'emerald' or 'corporate' for a clean green/professional look, 
    // or just 'light' and customize it. Let's stick to "emerald" as the primary theme since it matches the TPQ aesthetic.
  },
};
export default config;
