import type {NextConfig} from 'next';

const isProd = process.env.NODE_ENV === 'production';
// Dedicated var so an inherited PORT (e.g. code-server's 8900) can't poison the
// asset prefix at build time and white-screen the app. Defaults to her real port.
const proxyPort = process.env.SAGE_UI_PROXY_PORT || '3001';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  assetPrefix: isProd ? `/proxy/${proxyPort}` : undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
