import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.business.app',
  appName: 'Business',
  webDir: 'out',
  server: {
    // DEV: serve the Android app over http://localhost so it can call the http://10.0.2.2
    // dev backend without a mixed-content block (https page → http request is rejected by
    // the webview). For a production HTTPS backend this can go back to the default 'https'.
    androidScheme: 'http',
  },
};

export default config;
