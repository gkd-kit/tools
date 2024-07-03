import type {
  RawApp,
  RawAppGroup,
  RawCategory,
  RawGlobalGroup,
  RawSubscription,
} from '@gkd-kit/api';
import { isJsonEqual } from './equal';

export type DiffType<T> = {
  changed: {
    newItem: T;
    oldItem: T;
  }[];
  added: T[];
  removed: T[];
};

export type AppGroupDiffType = {
  newItem: RawApp;
  oldItem: RawApp;
  groupDiff: DiffType<RawAppGroup>;
};

const isEmptyDiff = (diff: DiffType<any>): boolean => {
  return (
    diff.added.length === 0 &&
    diff.changed.length === 0 &&
    diff.removed.length === 0
  );
};

const buildEmptyDiff = <T>(): DiffType<T> => {
  return {
    added: [],
    changed: [],
    removed: [],
  };
};

const getListDiff = <T>(
  oldList: T[] = [],
  newList: T[] = [],
  getKey: (t: T) => unknown,
): DiffType<T> => {
  const diff = buildEmptyDiff<T>();
  for (const newItem of newList) {
    const key = getKey(newItem);
    const oldItem = oldList.find((v) => getKey(v) === key);
    if (!oldItem) {
      diff.added.push(newItem);
    } else if (!isJsonEqual(newItem, oldItem)) {
      diff.changed.push({
        newItem,
        oldItem,
      });
    }
  }
  for (const oldItem of oldList) {
    const key = getKey(oldItem);
    if (newList.every((v) => getKey(v) !== key)) {
      diff.removed.push(oldItem);
    }
  }
  return diff;
};

export type SubscriptionDiffType = {
  categoriesDiff: DiffType<RawCategory>;
  globalGroupsDiff: DiffType<RawGlobalGroup>;
  appDiff: DiffType<RawApp>;
  appGroupDiffs: AppGroupDiffType[];
  groupDiff: DiffType<RawAppGroup>;
};

export const getSubscriptionDiff = (
  oldSubscription: RawSubscription | undefined | null,
  newSubscription: RawSubscription,
): SubscriptionDiffType | undefined => {
  if (isJsonEqual(oldSubscription, newSubscription)) {
    return;
  }
  const categoriesDiff = getListDiff(
    oldSubscription?.categories,
    newSubscription.categories,
    (v) => v.key,
  );
  const globalGroupsDiff = getListDiff(
    oldSubscription?.globalGroups,
    newSubscription.globalGroups,
    (v) => v.key,
  );
  const appDiff = getListDiff(
    oldSubscription?.apps,
    newSubscription.apps,
    (v) => v.id,
  );
  const appGroupDiffs: AppGroupDiffType[] = [];
  appDiff.changed.forEach(({ oldItem, newItem }) => {
    appGroupDiffs.push({
      newItem,
      oldItem,
      groupDiff: getListDiff(oldItem.groups, newItem.groups, (v) => v.key),
    });
  });
  const groupDiff = buildEmptyDiff<RawAppGroup>();
  appDiff.added.forEach((app) => {
    groupDiff.added.push(...app.groups);
  });
  appDiff.removed.forEach((app) => {
    groupDiff.removed.push(...app.groups);
  });
  appGroupDiffs.forEach((d) => {
    groupDiff.added.push(...d.groupDiff.added);
    groupDiff.changed.push(...d.groupDiff.changed);
    groupDiff.removed.push(...d.groupDiff.removed);
  });
  return {
    categoriesDiff,
    globalGroupsDiff,
    appDiff,
    appGroupDiffs,
    groupDiff,
  };
};

const getDiffString = <T>(diff: DiffType<T>): string[] => {
  return [
    diff.added.length ? `+${diff.added.length}` : '',
    diff.changed.length ? `~${diff.changed.length}` : '',
    diff.removed.length ? `-${diff.removed.length}` : '',
  ];
};

const getGroupSize = (
  subscription: RawSubscription | null | undefined,
): number => {
  return (
    subscription?.apps?.reduce((acc, app) => acc + app.groups.length, 0) || 0
  );
};

const getDiffNameString = <T>(
  diff: DiffType<T>,
  getName: (v: T) => string,
): string => {
  if (isEmptyDiff(diff)) return '';
  return (
    '|' +
    [diff.added, diff.changed.map((c) => c.newItem), diff.removed]
      .map((list) => list.map((c) => `<li>${getName(c)}`).join(''))
      .join('|') +
    '|'
  );
};

const getCategoryGroupsMap = (
  subscription: RawSubscription | null | undefined,
  categories?: RawCategory[],
): Map<RawCategory, RawAppGroup[]> => {
  categories ||= subscription?.categories || [];
  const map = new Map<RawCategory, RawAppGroup[]>();
  categories.forEach((c) => map.set(c, []));
  subscription?.apps?.forEach((app) => {
    app.groups.forEach((g) => {
      const category = categories.find((c) => g.name.startsWith(c.name));
      if (category) {
        map.get(category)!.push(g);
      }
    });
  });
  return map;
};

const getNumChange = (n1 = 0, n2 = 0) => {
  if (n1 === n2 && n2 === 0) return '';
  return `${n1} -> ${n2}`;
};

type TextNodeType = {
  prefix?: string;
  children: (TextNodeType | string)[];
};

const removeEmptyNode = (node: TextNodeType) => {
  if (node.children.length === 0) return;
  node.children = node.children.filter((v) => {
    if (typeof v === 'string') return v;
    removeEmptyNode(v);
    return v.children.length > 0;
  });
};
const nodeToStringList = (node: TextNodeType): string[] => {
  return [
    node.prefix || '',
    node.children.map((v) => (typeof v === 'string' ? v : nodeToStringList(v))),
  ]
    .flat(2)
    .filter(Boolean);
};

export const getChangelog = (
  oldSubscription: RawSubscription | undefined | null,
  newSubscription: RawSubscription,
): string | undefined => {
  const subsDiff = getSubscriptionDiff(oldSubscription, newSubscription);
  if (!subsDiff) {
    return;
  }
  const {
    categoriesDiff,
    globalGroupsDiff,
    appDiff,
    groupDiff,
    appGroupDiffs,
  } = subsDiff;

  const categories = newSubscription.categories || [];
  const categoryDiffMap = new Map<RawCategory, DiffType<RawAppGroup>>();
  categories.forEach((c) => categoryDiffMap.set(c, buildEmptyDiff()));
  groupDiff.added.forEach((g) => {
    const category = categories.find((c) => g.name.startsWith(c.name));
    if (category) {
      categoryDiffMap.get(category)!.added.push(g);
    }
  });
  groupDiff.removed.forEach((g) => {
    const category = categories.find((c) => g.name.startsWith(c.name));
    if (category) {
      categoryDiffMap.get(category)!.removed.push(g);
    }
  });
  groupDiff.changed.forEach((v) => {
    const newCategory = categories.find((c) =>
      v.newItem.name.startsWith(c.name),
    );
    const oldCategory = categories.find((c) =>
      v.oldItem.name.startsWith(c.name),
    );
    if (newCategory && newCategory === oldCategory) {
      categoryDiffMap.get(newCategory)!.changed.push(v);
    } else if (newCategory && !oldCategory) {
      categoryDiffMap.get(newCategory)!.added.push(v.newItem);
    } else if (!newCategory && oldCategory) {
      categoryDiffMap.get(oldCategory)!.added.push(v.newItem);
    }
  });

  const oldCategoryMap = getCategoryGroupsMap(oldSubscription, categories);
  const newCategoryMap = getCategoryGroupsMap(newSubscription, categories);
  const changedCategories = categories.filter(
    (c) => !isEmptyDiff(categoryDiffMap.get(c)!),
  );
  const node: TextNodeType = {
    prefix: '# 变更记录\n',
    children: [
      oldSubscription
        ? `v${oldSubscription.version} -> v${newSubscription.version}`
        : `v${newSubscription.version}`,
      {
        prefix: '\n||||||\n|-|:-:|:-:|:-:|:-:|',
        children: [
          {
            name: '类别',
            display: !isEmptyDiff(categoriesDiff),
            list: [
              ...getDiffString(categoriesDiff),
              getNumChange(
                oldSubscription?.categories?.length,
                newSubscription.categories?.length,
              ),
            ],
          },
          {
            name: '全局规则',
            display: !isEmptyDiff(globalGroupsDiff),
            list: [
              ...getDiffString(globalGroupsDiff),
              getNumChange(
                oldSubscription?.globalGroups?.length,
                newSubscription.globalGroups?.length,
              ),
            ],
          },
          {
            name: '应用',
            display: !isEmptyDiff(appDiff),
            list: [
              ...getDiffString(appDiff),
              getNumChange(
                oldSubscription?.apps?.length,
                newSubscription.apps?.length,
              ),
            ],
          },
          {
            name: '应用规则',
            display: !isEmptyDiff(groupDiff),
            list: [
              ...getDiffString(groupDiff),
              getNumChange(
                getGroupSize(oldSubscription),
                getGroupSize(newSubscription),
              ),
            ],
          },
        ]
          .filter((v) => v.display)
          .map((v) => `|${v.name}|${v.list.join('|')}|`),
      },
      {
        prefix: '\n## 规则类别',
        children: [
          {
            prefix: '\n|+|~|-|\n|-|-|-|',
            children: [getDiffNameString(categoriesDiff, (c) => c.name)],
          },
          {
            prefix: '\n||||||\n|-|:-:|:-:|:-:|:-:|',
            children: changedCategories.map(
              (c) =>
                `|${c.name}|${getDiffString(categoryDiffMap.get(c)!).join('|')}|${oldCategoryMap.get(c)!.length} -> ${newCategoryMap.get(c)!.length}|`,
            ),
          },
        ],
      },
      {
        prefix: '\n## 全局规则',
        children: [
          {
            prefix: '\n|+|~|-|\n|-|-|-|',
            children: [getDiffNameString(globalGroupsDiff, (g) => g.name)],
          },
        ],
      },
      {
        prefix: '\n## 应用规则',
        children: [
          {
            prefix: '\n||+|~|-|\n|:-:|-|-|-|',
            children: [
              appDiff.added
                .map(
                  (a) =>
                    `|${a.name || a.id}<br>+${a.groups.length}|${a.groups.map((g) => `<li>${g.name}`)}|||`,
                )
                .join('\n'),
              appGroupDiffs
                .map(
                  (d) =>
                    `|${d.newItem.name || d.newItem.id}<br>${getDiffString(d.groupDiff).filter(Boolean).join(',')}|${d.groupDiff.added.map((g) => `<li>${g.name}`)}|${d.groupDiff.changed.map((g) => `<li>${g.newItem.name}`)}|${d.groupDiff.removed.map((g) => `<li>${g.name}`)}|`,
                )
                .join('\n'),
              appDiff.removed
                .map(
                  (a) =>
                    `|${a.name || a.id}<br>-${a.groups.length}|||${a.groups.map((g) => `<li>${g.name}`)}|`,
                )
                .join('\n'),
            ],
          },
        ],
      },
    ],
  };

  removeEmptyNode(node);
  return nodeToStringList(node).join('\n') + '\n';
};

/**
 * @deprecated use `getReadme` instead
 */
export const getSummary = (subscription: RawSubscription): string => {
  console.warn('getSummary is deprecated, use getReadme instead');
  return getReadme(subscription);
};

export const getReadme = (subscription: RawSubscription): string => {
  const categories = subscription.categories || [];
  const globalGroups = subscription.globalGroups || [];
  const apps = subscription.apps || [];
  const appGroups = apps.flatMap((app) => app.groups);
  const sizeMap = getCategoryGroupsMap(subscription);
  return `# 订阅

v${subscription.version}

|||
| - |:-:|
|类别|${categories.length}|
|全局规则|${globalGroups.length}|
|应用|${apps.length}|
|应用规则|${appGroups.length}|

## 规则类别

|||
| - |:-:|
${categories.map((c) => `|${c.name}|${sizeMap.get(c)!.length}|`).join('\n')}

## 全局规则

${globalGroups.map((g) => `- ${g.name}`).join('\n')}

## 应用规则

||||
| - |:-:|-|
${apps.map((a) => `|${a.name}|${a.groups.length}|${a.groups.map((g) => `<li>${g.name}`).join('')}|`).join('\n')}
`;
};
