import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],base:process.env.STATIC_BASE||'/',build:{outDir:process.env.BUILD_DIR||'dist',rollupOptions:process.env.SINGLE_FILE?{output:{inlineDynamicImports:true,format:'iife'}}:undefined}});
