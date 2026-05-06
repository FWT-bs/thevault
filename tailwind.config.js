/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: "#3C3744",
        cta: "#090C9B",
        "vault-eggplant": "#3C3744",
        "vault-cobalt": "#090C9B",
        "vault-royal": "#3D52D5",
        "vault-mist": "#B4C5E4",
        "vault-ivory": "#FBFFF1",
      },
    },
  },
  plugins: [],
};
