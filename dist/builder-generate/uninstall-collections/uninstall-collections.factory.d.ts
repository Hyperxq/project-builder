import { Rule } from '@angular-devkit/schematics';

declare function uninstallPackages(options: {
    packageNames: string[];
    packageManager?: 'npm' | 'pnpm' | 'yarn' | 'cnpm' | 'bun';
    dryRun: boolean;
}): Rule;

export { uninstallPackages };
