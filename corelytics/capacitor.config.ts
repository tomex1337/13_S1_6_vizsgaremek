import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'eu.corelytics.app',
  appName: 'Corelytics',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    url: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined,
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      splashFullScreen: true,
      layoutName: 'launch_screen',
      useDialog: true,
    },
  },
};

export default config;
