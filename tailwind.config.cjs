/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // example brand colors
      colors: {
        primary: "#1E40AF",
        "primary-foreground": "#ffffff",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
