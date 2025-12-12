/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@oneplace/calc'],
    output: 'standalone',
    images: {
        domains: ['localhost', 'images.unsplash.com'],
        unoptimized: true,
    },
    experimental: {
        serverComponentsExternalPackages: ['@oneplace/calc'],
    },
    webpack: (config) => {
        // Fixes npm packages that depend on `fs` module
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
        };
        return config;
    },
    // Environment variables
    env: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    },
};

module.exports = nextConfig;
