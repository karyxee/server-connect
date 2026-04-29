/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Montserrat", "sans-serif"],
      },
      colors: {
        brand: {
          dark: "#0052c9",
          light: "#0a91db",
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(168.68deg, #0052c9 1.12%, #0a91db 100%)",
        "send-gradient": "linear-gradient(180deg, #ff9519 0%, #ffba6a 100%)",
        "accept-gradient": "linear-gradient(180deg, #00c920 0%, #2fe24b 100%)",
        "reject-gradient": "linear-gradient(180deg, #ff3b3b 0%, #ff6262 100%)",
      },
    },
  },
  plugins: [],
};
