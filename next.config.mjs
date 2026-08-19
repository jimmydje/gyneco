/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Keep pdfkit external so its built-in font files (.afm) stay in
    // node_modules. Webpack bundling breaks the __dirname-relative font
    // lookup on serverless (Vercel), causing "ENOENT ... Helvetica.afm".
    serverComponentsExternalPackages: ["pdfkit"],
  },
};

export default nextConfig;
