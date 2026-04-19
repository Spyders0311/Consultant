const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // pdfkit loads built-in AFM font metrics from its package at runtime.
  // Ensure those files are included in the serverless bundle (Vercel output tracing).
  outputFileTracingIncludes: {
    '/api/pdf': ['node_modules/pdfkit/js/data/*.afm'],
  },
};

module.exports = nextConfig;
