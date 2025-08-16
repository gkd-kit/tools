export const checkApiVersion = async () => {
  const pkg = await import('@gkd-kit/api/package.json', {
    with: { type: 'json' },
  });
  const latestApiVersion = await fetch(
    'https://registry.npmmirror.com/@gkd-kit/api/latest/files/package.json',
  )
    .then((r) => r.json())
    .then((d) => String(d.version));
  if (latestApiVersion !== pkg.version) {
    console.warn(
      `Warning: The @gkd-kit/api version in your project (${pkg.version}) does not match the latest version (${latestApiVersion}). Please update to ensure compatibility.\n`,
    );
  }
};
