import type { NextConfig } from "next";
const path = require('path');

const nextConfig: NextConfig = {
  // Core Performance Optimizations
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: './tsconfig.json',
  },
  
  reactStrictMode: true,
  
  // Experimental optimizations
  experimental: {
    // Optimize package imports for tree-shaking
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-icons',
      'recharts',
      'date-fns',
      'clsx',
      'tailwind-merge'
    ],
  },
  
  // Advanced Webpack Configuration for High-Performance Financial Apps
  webpack: (config, { dev, isServer, webpack }) => {
    // Enable webpack filesystem caching for dramatic build speed improvements
    if (!dev) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        cacheDirectory: path.resolve('.next/cache/webpack'),
        name: 'production-cache',
        compression: 'gzip',
        maxAge: 604800000, // 7 days
      };
    }
    
    // Development-specific optimizations
    if (dev) {
      config.watchOptions = {
        ignored: /node_modules/,
        aggregateTimeout: 300,
        poll: 1000,
      };
    }
    
    // Production-specific optimizations
    if (!dev && !isServer) {
      // Optimize for production builds
      config.optimization = {
        ...config.optimization,
        
        // Advanced chunk splitting for financial dashboard
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Critical vendor chunks for financial libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 20,
              reuseExistingChunk: true,
            },
            
            // React and related libraries
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|react-router|@react)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 15,
              reuseExistingChunk: true,
            },
            
            // Chart and visualization libraries
            charts: {
              test: /[\\/]node_modules[\\/](recharts|d3|chart\.js|vis)[\\/]/,
              name: 'charts',
              chunks: 'all',
              priority: 12,
              reuseExistingChunk: true,
            },
            
            // Financial and data processing libraries
            financial: {
              test: /[\\/]node_modules[\\/](date-fns|moment|lodash|decimal\.js)[\\/]/,
              name: 'financial',
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
            },
            
            // UI component libraries
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|@headlessui|framer-motion)[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 8,
              reuseExistingChunk: true,
            },
            
            // Common application code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
            
            // Dashboard-specific components
            dashboard: {
              test: /[\\/]src[\\/](components|lib|hooks)[\\/]/,
              name: 'dashboard',
              chunks: 'all',
              priority: 7,
              reuseExistingChunk: true,
            },
          },
        },
        
        // Module concatenation for better performance
        concatenateModules: true,
        
        // Side effects optimization
        sideEffects: false,
        
        // Used exports optimization
        usedExports: true,
      };
      
      // Resolve optimizations for financial applications
      config.resolve = {
        ...config.resolve,
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      };
    }
    
    // Image optimization for financial charts and icons
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg|webp)$/i,
      type: 'asset',
      parser: {
        dataUrlCondition: {
          maxSize: 10 * 1024, // 10kb
        },
      },
      generator: {
        filename: 'images/[hash][ext][query]',
      },
    });
    
    return config;
  },
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  
  // HTTP/2 Server Push optimization
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  
  // ESLint configuration for financial applications
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src'],
  },
  
  // Images optimization for financial dashboards
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    // Enable styled-components SSR optimization
    styledComponents: true,
  },
  
  // Experimental features for financial applications
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  
  // Asset prefix for CDN support
  assetPrefix: process.env.NODE_ENV === 'production' ? (process.env.CDN_URL || '') : '',
  
  // Generate source maps for debugging in production
  productionBrowserSourceMaps: false,
  
  // HTTP Agent optimization for external API calls
  httpAgentOptions: {
    keepAlive: true,
  },
};

export default nextConfig;