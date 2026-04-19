import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * GitHub Pages project sites live at `https://<user>.github.io/<repo>/`, so production
 * assets must be rooted at `/<repo>/`. User/org sites using a `<user>.github.io` repo
 * are served from `/` instead.
 *
 * Override anytime: `VITE_BASE=/my-repo/ npm run build` (leading/trailing slashes optional).
 */
function productionBase(): string {
  const explicit = process.env.VITE_BASE ?? process.env.BASE_PATH;
  if (explicit !== undefined && explicit !== "") {
    const trimmed = explicit.replace(/^\/+|\/+$/g, "");
    return trimmed ? `/${trimmed}/` : "/";
  }

  const full = process.env.GITHUB_REPOSITORY; // "owner/repo" in GitHub Actions
  if (!full) return "/";

  const repo = full.split("/")[1] ?? "";
  if (repo.endsWith(".github.io")) return "/";
  return `/${repo}/`;
}

export default defineConfig(({ mode }) => ({
  // Dev server keeps `/` so local `npm run dev` matches typical setups.
  base: mode === "production" ? productionBase() : "/",
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    assetsDir: "assets",
  },
  publicDir: "public",
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
}));
