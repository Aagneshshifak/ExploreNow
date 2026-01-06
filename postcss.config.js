module.exports = () => {
  const plugins = [];
  try {
    // include tailwind if present
    require.resolve('tailwindcss');
    plugins.push(require('tailwindcss'));
  } catch {}
  try {
    plugins.push(require('autoprefixer'));
  } catch {}
  return { plugins };
};
