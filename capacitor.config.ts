import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.dsautocenter.app',
  appName: 'D&S Auto Center',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
};

export default config;
