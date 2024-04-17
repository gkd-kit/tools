import JSON5 from 'json5';
import fs from 'node:fs/promises';
import process from 'node:process';
import { lazyConfig, lazyPkg } from './config';

export const syncNpmmirror = async () => {
  const pkg = await lazyPkg();
  await fetch(`https://registry-direct.npmmirror.com/${pkg.name}/sync`, {
    method: 'PUT',
  });
};

export const stdoutGkdVersion = async (versionFile?: string) => {
  versionFile ??= (await lazyConfig()).versionFile;
  const version: number = JSON5.parse(
    await fs.readFile(versionFile, 'utf-8'),
  ).version;
  process.stdout.write(version.toString());
};

export const updatePkgVersion = async (versionFile?: string) => {
  versionFile ??= (await lazyConfig()).versionFile;
  const pkg = await lazyPkg();
  const version: number = JSON5.parse(
    await fs.readFile(versionFile, 'utf-8'),
  ).version;
  const pkgFp = process.cwd() + '/package.json';
  pkg.version = [...pkg.version.split('.').splice(0, 2), version].join('.');
  await fs.writeFile(pkgFp, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
};
