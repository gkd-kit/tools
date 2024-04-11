import type { RawSubscription } from '@gkd-kit/api';
import JSON5 from 'json5';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getChangelog, getSummary } from './diff';
import { isJsonEqual } from './equal';

export const updateDist = async (
  subscription: RawSubscription,
  distDir: string,
): Promise<boolean> => {
  const gkdFilename = distDir + '/gkd.json5';
  const gkdVersionFilename = distDir + '/gkd.version.json5';
  const changelogFilename = distDir + '/CHANGELOG.md';
  const summaryFilename = distDir + '/README.md';
  if (!(await fs.stat(distDir).catch(() => null))) {
    await fs.mkdir(distDir);
    console.log('Created', path.basename(distDir));
  }
  const oldSubscription = await fs
    .readFile(gkdFilename, 'utf-8')
    .then((text) => JSON5.parse<RawSubscription>(text))
    .catch(() => null);

  if (oldSubscription) {
    if (
      isJsonEqual(oldSubscription, {
        ...subscription,
        version: oldSubscription.version,
      })
    ) {
      console.log('No changes');
      return false;
    }
    subscription.version = oldSubscription.version + 1;
  }

  await fs.writeFile(
    changelogFilename,
    getChangelog(oldSubscription, subscription) ||
      `# ${subscription.name}\nno changes\n`,
  );
  console.log('Updated', path.basename(changelogFilename));

  await fs.writeFile(summaryFilename, getSummary(subscription));
  console.log('Updated', path.basename(summaryFilename));

  await fs.writeFile(gkdFilename, JSON5.stringify(subscription));
  console.log('Updated', path.basename(gkdFilename));

  await fs.writeFile(
    gkdVersionFilename,
    JSON5.stringify({ id: subscription.id, version: subscription.version }),
  );
  console.log('Updated', path.basename(gkdVersionFilename));

  return true;
};
