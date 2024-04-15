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

export const stdoutGkdVersion = async () => {
  const version: number = JSON5.parse(
    await fs.readFile(process.cwd() + '/dist/gkd.version.json5', 'utf-8'),
  ).version;
  process.stdout.write(version.toString());
};

export const updatePkgVersion = async () => {
  const version: number = JSON5.parse(
    await fs.readFile(process.cwd() + '/dist/gkd.version.json5', 'utf-8'),
  ).version;
  const pkg: typeof PkgT = JSON.parse(
    await fs.readFile(process.cwd() + '/package.json', 'utf-8'),
  );
  pkg.version = [...pkg.version.split('.').splice(0, 2), version].join('.');
  await fs.writeFile(
    process.cwd() + '/package.json',
    JSON.stringify(pkg, null, 2),
    'utf-8',
  );
};
