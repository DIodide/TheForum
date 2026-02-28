// Validate env vars at build time — throws if required vars are missing.
import "./src/env.ts";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Next.js to transpile the workspace database package (TypeScript sources)
  transpilePackages: ["@the-forum/database"],
};

export default nextConfig;
