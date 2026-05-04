import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

const isProd = process.env.NODE_ENV === "production";

export default isProd
  ? withSerwistInit({
      swSrc: "src/app/sw.ts",
      swDest: "public/sw.js",
      cacheOnNavigation: true,
      reloadOnOnline: true,
    })(nextConfig)
  : nextConfig;
