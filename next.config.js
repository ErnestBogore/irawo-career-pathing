/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Empêche l'import de pdfjs côté server (où fs n'existe pas)
      config.externals.push('pdfjs-dist/legacy/build/pdf');
    }
    return config;
  },
};

export default nextConfig; 