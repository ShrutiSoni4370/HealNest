/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        opensans: ["Open Sans", "sans-serif"], // 👈 custom font
        story: ["Story Script", "cursive"],      // 👈 for your second font
          manrope: ["Manrope", "sans-serif"],  
          quicksand: ["Quicksand", "sans-serif"],  
          libre: ["Libre Franklin", "sans-serif"],
          epunda: ["Epunda Slab", "serif"],
          exo: ["Exo 2", "sans-serif"],
          josefin: ["Josefin Sans", "sans-serif"],

      },
    },
  },
  plugins: [],
}
