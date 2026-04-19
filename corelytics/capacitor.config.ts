import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'eu.corelytics',
  appName: 'Corelytics',
  webDir: '.next',
  server: {
    url: 'https://corelytics.tomex.xyz',
    cleartext: false,
  }
};

export default config;
