import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import path from 'path'

// Local Vite dev may proxy to a same-machine backend by default.
// Shared environments and deployment-like runs should always set VITE_PROXY_TARGET explicitly.
const apiProxyTarget = process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:8080'
const prebundledClientDeps = [
  '@element-plus/icons-vue',
  'element-plus/es/components/avatar/style/css',
  'element-plus/es/components/badge/style/css',
  'element-plus/es/components/button/style/css',
  'element-plus/es/components/button-group/style/css',
  'element-plus/es/components/cascader/style/css',
  'element-plus/es/components/checkbox/style/css',
  'element-plus/es/components/date-picker/style/css',
  'element-plus/es/components/dialog/style/css',
  'element-plus/es/components/divider/style/css',
  'element-plus/es/components/dropdown/style/css',
  'element-plus/es/components/dropdown-item/style/css',
  'element-plus/es/components/dropdown-menu/style/css',
  'element-plus/es/components/form/style/css',
  'element-plus/es/components/form-item/style/css',
  'element-plus/es/components/icon/style/css',
  'element-plus/es/components/image/style/css',
  'element-plus/es/components/input/style/css',
  'element-plus/es/components/input-number/style/css',
  'element-plus/es/components/loading/style/css',
  'element-plus/es/components/option/style/css',
  'element-plus/es/components/pagination/style/css',
  'element-plus/es/components/radio/style/css',
  'element-plus/es/components/radio-group/style/css',
  'element-plus/es/components/select/style/css',
  'element-plus/es/components/slider/style/css',
  'element-plus/es/components/switch/style/css',
  'element-plus/es/components/tab-pane/style/css',
  'element-plus/es/components/table/style/css',
  'element-plus/es/components/table-column/style/css',
  'element-plus/es/components/tabs/style/css',
  'element-plus/es/components/tag/style/css',
  'element-plus/es/components/upload/style/css'
]

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isTest = mode === 'test'

  return {
    plugins: [
      vue(),
      AutoImport({
        dts: 'src/auto-imports.d.ts',
        imports: ['vue', 'vue-router'],
        resolvers: [ElementPlusResolver()],
        eslintrc: {
          enabled: false
        }
      }),
      ...(
        isTest
          ? []
          : [
              Components({
                dts: 'src/components.d.ts',
                resolvers: [ElementPlusResolver({ importStyle: 'css' })]
              })
            ]
      )
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    optimizeDeps: {
      include: prebundledClientDeps
    },
    server: {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true
        },
        '/uploads': {
          target: `${apiProxyTarget}/api`,
          changeOrigin: true
        }
      }
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      exclude: ['tests/**', 'node_modules/**', 'dist/**']
    },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined
            }

            if (id.includes('echarts') || id.includes('zrender') || id.includes('vue-echarts')) {
              return 'charts'
            }

            if (
              id.includes('/vue/') ||
              id.includes('/vue-router/') ||
              id.includes('/pinia/')
            ) {
              return 'vue-core'
            }

            if (id.includes('/axios/')) {
              return 'network'
            }

            return 'vendor'
          }
        }
      }
    }
  }
})
