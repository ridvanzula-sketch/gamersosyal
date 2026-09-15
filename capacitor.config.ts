import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gamerhub.app',
  appName: 'GamerHub',
  webDir: 'www',
  server: {
    // Canlıya aldığın Vercel adresini buraya yaz.
    // Örn: https://gamerhub-xxxx.vercel.app
    url: process.env.GAMERHUB_URL || 'https://YOUR-GAMERHUB-VERCEL-URL.vercel.app',
    cleartext: false,
  },
};

export default config;
