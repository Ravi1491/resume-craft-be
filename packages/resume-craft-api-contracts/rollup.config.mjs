import del from 'rollup-plugin-delete';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

const input = 'src/main.ts';

export default [
    {
        input,
        plugins: [
            del({
                targets: ['./dist/'],
            }),
            peerDepsExternal(),
            esbuild(),
        ],
        output: [
            {
                file: 'dist/esm/index.mjs',
                format: 'es',
                sourcemap: true,
                inlineDynamicImports: true,
                entryFileNames: '[name].mjs',
                chunkFileNames: '[name]-[hash].mjs',
            },
            {
                file: 'dist/cjs/index.cjs',
                format: 'cjs',
                sourcemap: true,
                inlineDynamicImports: true,
                interop: 'auto',
                entryFileNames: '[name].cjs',
                chunkFileNames: '[name]-[hash].cjs',
            },
        ],
    },
    {
        input,
        plugins: [dts()],
        output: [
            {
                file: 'dist/esm/index.d.ts',
                format: 'es',
                inlineDynamicImports: true,
            },
            {
                file: 'dist/cjs/index.d.ts',
                format: 'cjs',
                inlineDynamicImports: true,
            },
        ],
    },
];
