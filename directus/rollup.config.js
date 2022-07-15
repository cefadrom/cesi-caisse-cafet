import glob from 'glob';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import typescript from 'rollup-plugin-typescript2';
import styles from 'rollup-plugin-styles';
import vue from 'rollup-plugin-vue';
import del from 'rollup-plugin-delete';


const APP_EXTENSION_TYPES = ['interface', 'display', 'layout', 'module', 'panel'];
const API_EXTENSION_TYPES = ['hook', 'endpoint'];
const APP_EXTENSION_TYPES_PLURAL = APP_EXTENSION_TYPES.map(t => t + 's');
const API_EXTENSION_TYPES_PLURAL = API_EXTENSION_TYPES.map(t => t + 's');
const APP_SHARED_DEPS = ['@directus/extensions-sdk', 'vue', 'vue-router', 'vue-i18n', 'pinia'];
const API_SHARED_DEPS = ['directus', 'node-fetch'];


const getExtensionNameFromPath = path => path.split('/').at(-3) + '/' + path.split('/').at(-2);

function getExtensions(extensionsTypes) {
    return glob
        .sync(`./src/@(${extensionsTypes.join('|')})/*/index.ts`)
        .reduce((list, path) => ({ ...list, [getExtensionNameFromPath(path)]: path }), {});
}


/** @type { import('rollup').RollupOptions } */
export default [
    {
        input: getExtensions(APP_EXTENSION_TYPES_PLURAL),
        output: {
            dir: 'extensions',
            entryFileNames: '[name]/index.js',
            format: 'es',
        },
        external: APP_SHARED_DEPS,
        plugins: [
            del({ targets: APP_EXTENSION_TYPES_PLURAL.map(e => `extensions/${e}/*`), runOnce: true }),
            vue({ preprocessStyles: true }),
            typescript({ check: false }),
            styles(),
            nodeResolve({ browser: true }),
            commonjs({ esmExternals: true, sourceMap: false }),
            json(),
            replace({
                values: {
                    'process.env.NODE_ENV': JSON.stringify('production'),
                },
                preventAssignment: true,
            }),
        ],
        watch: {
            include: `src/@(${APP_EXTENSION_TYPES_PLURAL.join('|')})/**/*`,
        },
    },
    {
        input: getExtensions(API_EXTENSION_TYPES_PLURAL),
        output: {
            dir: 'extensions',
            entryFileNames: '[name]/index.js',
            format: 'cjs',
            exports: 'default',
        },
        external: API_SHARED_DEPS,
        plugins: [
            del({ targets: API_EXTENSION_TYPES_PLURAL.map(e => `extensions/${e}/*`), runOnce: true }),
            typescript({ check: false }),
            nodeResolve(),
            commonjs({ sourceMap: false }),
            json(),
            replace({
                values: {
                    'process.env.NODE_ENV': JSON.stringify('production'),
                },
                preventAssignment: true,
            }),
        ],
        watch: {
            include: `src/@(${API_EXTENSION_TYPES_PLURAL.join('|')})/**/*`,
        },
    }
];
