import fs from 'node:fs/promises';
import process from 'node:process';
import JSON5 from 'json5';
import type PkgT from '../package.json';

export const syncNpmmirror = async () => {
  const pkg: typeof PkgT = JSON.parse(
    await fs.readFile(process.cwd() + '/package.json', 'utf-8'),
  );
  await fetch(`https://registry-direct.npmmirror.com/${pkg.name}/sync`, {
    method: 'PUT',
  });
};

const distDirDefault = (json5FilePath?: string) => {
  if (json5FilePath) {
    return json5FilePath;
  } else {
    return process.cwd() + '/dist/gkd.version.json5';
  }
};

export const stdoutGkdVersion = async (json5FilePath?: string) => {
  const distDir = distDirDefault(json5FilePath);
  const { version } = JSON5.parse(await fs.readFile(distDir, 'utf-8'));
  process.stdout.write(version.toString());
};

export const updatePkgVersion = async (json5FilePath?: string) => {
  const distDir = distDirDefault(json5FilePath);
  const { version } = JSON5.parse(await fs.readFile(distDir, 'utf-8'));
  const pkgFp = process.cwd() + '/package.json';
  const pkg: typeof PkgT = JSON.parse(await fs.readFile(pkgFp, 'utf-8'));
  pkg.version = [...pkg.version.split('.').splice(0, 2), version].join('.');
  await fs.writeFile(pkgFp, JSON.stringify(pkg, null, 2), 'utf-8');
};
