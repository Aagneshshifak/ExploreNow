export default async () => {
  const plugins = [];

  try {
    const tailwind = await import('tailwindcss');
    plugins.push(tailwind.default ?? tailwind);
  } catch {}

  try {
    const autoprefixer = await import('autoprefixer');
    plugins.push(autoprefixer.default ?? autoprefixer);
  } catch {}

  return { plugins };
};
