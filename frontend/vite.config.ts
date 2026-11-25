import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        id: "/",
        name: "shopSquare Clothing Store",
        short_name: "shopSquare",
        description: "Modern clothing and streetwear shopping application",
        theme_color: "#111111",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        scope: "/",

        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          }
        ]
      },

      workbox: {
        // Connect push notification service worker
        importScripts: ["/push-sw.js"],

        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,webp,woff2}"
        ],

        cleanupOutdatedCaches: true,

        runtimeCaching: [
          {
            urlPattern: /^http:\/\/localhost:5000\/api\/products(?:\/[^?]*)?(?:\?.*)?$/,
            handler: "NetworkFirst",
            method: "GET",

            options: {
              cacheName: "shopsquare-products-cache",
              networkTimeoutSeconds: 5,

              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 86400
              },

              cacheableResponse: {
                statuses: [200]
              }
            }
          }
        ]
      }
    })
  ]
});