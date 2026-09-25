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
  safelist: [
    'bg-blue-500',
    'bg-orange-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-teal-600',
    'bg-teal-500',
    'bg-cyan-600',
  ],
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
