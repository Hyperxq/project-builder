import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

import glob from 'glob';
import path from 'node:path';
import copy from 'rollup-plugin-copy';
import cleaner from 'rollup-plugin-cleaner';
import globals from 'rollup-plugin-node-globals';
import builtins from 'rollup-plugin-node-builtins';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import {dts} from 'rollup-plugin-dts';
import {typescriptPaths} from 'rollup-plugin-typescript-paths';
import alias from "@rollup/plugin-alias";

function getInputsFromGlob(pattern) {
    return glob.sync(pattern).reduce((inputs, file) => {
        const name = path.basename(file, path.extname(file));
        if (name === 'public_api') return inputs;
        inputs[name] = file;
        return inputs;
    }, {});
}

const tsFilesSrc = getInputsFromGlob('src/**/**/**/**/*.ts');
console.log(tsFilesSrc);
const buildFolderPathPattern = /^(src\/)(.*?)([\/][^\/]+\.ts)$/gs;
const removeSrcPattern = /^(src[\/\\])(.*?)/gs;

const normalizeUrl = (url) => url.replace(/\\/g, '/');

const removeSrcPath = (string) => normalizeUrl(string).replace(removeSrcPattern, '$2');
const removeSrcFileNamePath = (string) =>
    normalizeUrl(string).replace(buildFolderPathPattern, '$2');

const basePlugins = [
    typescript({outputToFilesystem: false}),
    peerDepsExternal(),
    nodeResolve(),
    commonjs(),
    builtins(),
    globals(),
    typescriptPaths(),
    terser(),
];
const baseExternal = [
    'node:module',
    'ansi-colors',
    'ora',
    'inquirer',
    'tty',
    'node-emoji',
    '@angular-devkit/schematics-cli',
    '@angular-devkit/schematics',
    'ajv'
];

export default [
    {
        input: 'src/public_api.ts', // Replace with the entry point of your CLI
        output: [
            {
                dir: 'dist',
                format: 'cjs',
                preserveModules: true,
            },
        ],
        external: baseExternal,
        plugins: [
            ...basePlugins,
            cleaner({
                targets: ['./dist/'],
                silence: false,
            }),
            copy({
                targets: [
                    {
                        src: 'package.json',
                        dest: 'dist',
                        transform: (contents) => {
                            const packageData = JSON.parse(contents.toString());
                            delete packageData.scripts;
                            delete packageData.devDependencies;
                            delete packageData.keywords;
                            delete packageData.engines;
                            return JSON.stringify(packageData, null, 2);
                        },
                    },
                ],
                hook: 'writeBundle',
            }),
            copy({
                targets: [
                    {
                        src: 'README.md',
                        dest: 'dist',
                    },
                ],
                hook: 'writeBundle',
            }),
            copy({
                targets: [
                    {
                        src: 'src/collection.json',
                        dest: 'dist',
                    },
                ],
                hook: 'writeBundle',
            }),
            copy({
                targets: [
                    {
                        src: 'src/**/**/*.json',
                        dest: 'dist/',
                        rename: (name, extension, fullPath) => {
                            return removeSrcPath(fullPath);
                        },
                    },
                    {
                        src: 'src/builder-generate/**/**/*.template',
                        dest: 'dist/',
                        rename: (name, extension, fullPath) => {
                            return removeSrcPath(fullPath);
                        },
                    },
                ],
                hook: 'writeBundle',
                verbose: true,
            }),
        ],
    },
    ...Object.entries(tsFilesSrc).map(([name, file]) => ({
        input: {[name]: file},
        output: {
            dir: `dist/${removeSrcFileNamePath(file)}`,
        },
        plugins: [...basePlugins,
            alias({
                entries: [
                    {find: 'utils', replacement: '../../../utils'}
                ]
            })],
        external: baseExternal,
    })),

    ...Object.entries(tsFilesSrc).map(([name, file]) => ({
        input: {[name]: file},
        output: {
            dir: `dist/${removeSrcFileNamePath(file)}`,
        },
        plugins: [dts()],
    })),
];
