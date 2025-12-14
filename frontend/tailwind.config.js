/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "grid-3d": "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 25%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.05), transparent 20%), linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 40%)",
      },
      boxShadow: {
        glass: "0 25px 50px -12px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};









