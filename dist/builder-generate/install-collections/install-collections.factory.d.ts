import { Rule } from '@angular-devkit/schematics';

declare function installPackages(options: {
    packages: {
        packageName: string;
        version?: string;
    }[];
    packageManager?: 'npm' | 'pnpm' | 'yarn' | 'cnpm' | 'bun';
    dryRun: boolean;
}): Rule;

export { installPackages };
