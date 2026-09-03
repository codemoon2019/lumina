/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      screens: {
        xs: "480px",
      },
      fontFamily: {
        display: ["'DM Serif Display'", "'Georgia'", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      colors: {
        lumina: {
          canvas: "#0b1220",
          mist: "#101a2f",
          sky: "#6bb6ff",
          orchid: "#c084fc",
          dawn: "#fb923c",
          rose: "#f472b6",
          aqua: "#2dd4bf",
          glass: "rgba(255,255,255,0.06)",
          glassStrong: "rgba(255,255,255,0.12)",
        },
      },
      backgroundImage: {
        "radiant-dark":
          "radial-gradient(1050px_720px_at_48%_-22%,rgba(139,92,246,0.42),transparent),radial-gradient(780px_520px_at_108%_8%,rgba(45,212,191,0.14),transparent),radial-gradient(620px_480px_at_8%_68%,rgba(244,114,182,0.09),transparent),linear-gradient(180deg,#050810 0%,#0b1020 42%,#11182d 100%)",
        "radiant-light":
          "radial-gradient(980px_680px_at_22%_18%,rgba(190,242,180,0.42),transparent 58%),radial-gradient(900px_640px_at_82%_28%,rgba(216,180,254,0.38),transparent 62%),radial-gradient(720px_520px_at_50%_100%,rgba(251,207,232,0.28),transparent 70%),linear-gradient(180deg,#f7f5f2 0%,#f3f1f8 100%)",
        /** Warm dawn / sunrise — for light theme when local time is “night” so UI still feels like a gentle morning */
        "radiant-light-dawn":
          "radial-gradient(1050px_720px_at_42%_-14%,rgba(253,186,116,0.45),transparent),radial-gradient(820px_at_105%_18%,rgba(251,207,232,0.4),transparent),radial-gradient(680px_at_12%_72%,rgba(254,249,231,0.75),transparent),linear-gradient(180deg,#fffaf4,#fdecd4)",
      },
      boxShadow: {
        lift: "0 18px 50px rgba(13,35,71,0.35)",
        soft: "0 10px 40px rgba(15,23,42,0.12)",
      },
    },
  },
  plugins: [],
};
