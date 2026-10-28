import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"
export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    allowedHosts: ["mish-laptop.bigscale-velociraptor.ts.net"],
  },
})
