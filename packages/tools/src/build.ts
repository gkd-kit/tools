import type { RawSubscription } from '@gkd-kit/api';
import JSON5 from 'json5';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getChangelog, getReadme } from './diff';
import { isJsonEqual } from './equal';
import { lazyConfig, resolveConfig } from './config';
import type { GkdConfig } from './config';

/**
 * @param config - default: `'dist'` or `{outDir: 'dist'}`
 */
export async function updateDist(
  subscription: RawSubscription,
  config?: GkdConfig | string,
): Promise<boolean> {
  const defaultConfig =
    config === undefined ? await lazyConfig() : resolveConfig(config);

  if (!(await fs.stat(defaultConfig.outDir).catch(() => null))) {
    await fs.mkdir(defaultConfig.outDir);
    console.log('Created', path.basename(defaultConfig.outDir));
  }
  const oldSubscription = await fs
    .readFile(defaultConfig.file, 'utf-8')
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
    defaultConfig.changelog,
    getChangelog(oldSubscription, subscription) ||
      `# ${subscription.name}\nno changes\n`,
  );
  console.log('Updated', path.basename(defaultConfig.changelog));

  await fs.writeFile(defaultConfig.readme, getReadme(subscription));
  console.log('Updated', path.basename(defaultConfig.readme));

  await fs.writeFile(defaultConfig.file, JSON5.stringify(subscription));
  console.log('Updated', path.basename(defaultConfig.file));

  await fs.writeFile(
    defaultConfig.versionFile,
    JSON5.stringify({ id: subscription.id, version: subscription.version }),
  );
  console.log('Updated', path.basename(defaultConfig.file));

  return true;
}
