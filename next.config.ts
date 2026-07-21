import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // A stray bun.lock at C:\Users\user\ (outside this project) was confusing
  // Turbopack's automatic workspace-root detection — pin it explicitly.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
