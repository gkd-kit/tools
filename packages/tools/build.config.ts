import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['./src/index'],
  sourcemap: true,
  declaration: 'node16',
  externals: ['@gkd-kit/api', 'json5'],
});
