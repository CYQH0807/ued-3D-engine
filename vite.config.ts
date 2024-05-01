import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { visualizer } from 'rollup-plugin-visualizer';
import { terser } from 'rollup-plugin-terser';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig(({ command, mode }) => {
  const isLibrary = command === 'build' && mode === 'lib';
  const isDemo = command === 'build' && mode === 'demo';
  let build = {};

  if (isLibrary) {
    build = {
      target: 'esnext',
      cssCodeSplit: true,
      lib: {
        entry: './lib/main.ts',
        name: 'UED-3D-Engine',
        fileName: 'UED-3D-Engine',
      },
      external: ['three'],
      rollupOptions: {
        plugins: [terser(), visualizer()],
        external: ['three', 'axios', 'vue', './src/**/*'],
        input: {
          main: './lib/main.ts',
        },
        output: {
          globals: {
            three: 'THREE',
            axios: 'axios',
          },
        },
      },
    };
  }
  if (isDemo) {
    build = {
      outDir: 'UED-3D-Engine-Demo',
    };
  }

  return {
    plugins: [vue(), cssInjectedByJsPlugin()],
    server: {
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:7001',
          changeOrigin: true,
        },
        '/eplat': {
          target: 'http://eplat.baocloud.cn',
          changeOrigin: true,
        },
      },
    },
    build,
  };
});
