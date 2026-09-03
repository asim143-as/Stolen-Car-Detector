import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: { DEFAULT: "var(--primary)", foreground: "var(--primary-foreground)" },
        secondary: { DEFAULT: "var(--secondary)", foreground: "var(--secondary-foreground)" },
        destructive: { DEFAULT: "var(--destructive)", foreground: "var(--destructive-foreground)" },
        muted: { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" },
        accent: { DEFAULT: "var(--accent)", foreground: "var(--accent-foreground)" },
        popover: { DEFAULT: "var(--popover)", foreground: "var(--popover-foreground)" },
        card: { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" },
        amber: { DEFAULT: "var(--amber)", foreground: "var(--amber-foreground)" },
        crimson: { DEFAULT: "var(--crimson)", foreground: "var(--crimson-foreground)" },
        cyan: { DEFAULT: "var(--cyan)", foreground: "var(--cyan-foreground)" },
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, var(--primary) 0%, var(--cyan) 50%, var(--crimson) 100%)",
        "gradient-mesh": "radial-gradient(at 0% 0%, hsla(258,90%,70%,0.20) 0px, transparent 50%), radial-gradient(at 100% 0%, hsla(189,90%,60%,0.20) 0px, transparent 50%), radial-gradient(at 100% 100%, hsla(346,90%,70%,0.16) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(38,95%,65%,0.16) 0px, transparent 50%)",
      },
      boxShadow: {
        glow: "0 0 40px -10px hsla(38,92%,50%,0.45)",
        "glow-crimson": "0 0 40px -10px hsla(0,72%,50%,0.45)",
        premium: "0 20px 60px -15px rgba(2, 8, 23, 0.5)",
      },
      keyframes: {
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        float: { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-10px)" } },
        pulseDot: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.3" } },
      },
      animation: {
        shimmer: "shimmer 2.5s linear infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-dot": "pulseDot 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
