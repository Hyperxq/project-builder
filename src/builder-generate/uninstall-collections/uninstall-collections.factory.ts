import { Rule } from '@angular-devkit/schematics';
import { colors, logger } from '../../utils';
import { execSync } from 'node:child_process';
// import {execSync} from 'child_process';
// import {colors, getPackageJsonDependency, Spinner} from '../../utils';

export function uninstallPackages(options: {
  packageNames: string[];
  packageManager?: 'npm' | 'pnpm' | 'yarn' | 'cnpm' | 'bun';
  dryRun: boolean;
}): Rule {
  logger.log({
    level: 'info',
    message: colors.bold('The uninstallation of collections began'),
  });
  const ignores: string[] = [];
  const { packageNames, dryRun, packageManager } = options;
  return () => {
    try {
      for (const packageName of packageNames) {
        if (ignores.some((ignore) => ignore === packageName)) continue;
        if (!dryRun)
          execSync(`${packageManager ?? 'npm'} uninstall ${packageName}`, { stdio: 'inherit' });
      }
    } catch (error) {
      logger.error('Collection uninstallation error:', error.message);
      process.exit(1);
    }
  };
}
