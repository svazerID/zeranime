import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default {
  ...defineCloudflareConfig(),
  // Critical: without this, the CLI runs `npm run build`, whose script is
  // `opennextjs-cloudflare build` -> infinite recursion -> OOM "Killed".
  buildCommand: "next build",
};