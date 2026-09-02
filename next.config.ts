import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  errorHandler: (err) => {
    console.warn(err);
  },
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
