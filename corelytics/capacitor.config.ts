import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'eu.corelytics',
  appName: 'Corelytics',
  webDir: '.next', // Point to Next.js build directory
  server: {
    // For development - point to your local Next.js dev server
    // Use 10.0.2.2 for Android emulator to access host machine's localhost
    url: 'http://10.0.2.2:3000',
    cleartext: true,
  }
};

export default config;
