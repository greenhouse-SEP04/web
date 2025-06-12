const postcssImport = await import("postcss-import");
const tailwindcss    = await import("tailwindcss");
const autoprefixer   = await import("autoprefixer");

export default {
  plugins: [
    postcssImport.default,
    tailwindcss.default,
    autoprefixer.default,
  ],
};
