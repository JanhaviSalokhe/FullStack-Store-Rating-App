import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const projectCacheId = createHash('sha256')
  .update(process.cwd().toLowerCase())
  .digest('hex')
  .slice(0, 12)

export default defineConfig({
  plugins: [react()],
  cacheDir: join(tmpdir(), `store-rating-app-vite-${projectCacheId}`),
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
