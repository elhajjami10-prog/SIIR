import { ConfigContext, ExpoConfig } from 'expo/config';

// Clés Google Maps Platform (voir mobile/README.md). Sans clé, Expo Go Android affiche
// quand même Google Maps ; la clé est indispensable pour les builds publiés sur les stores.
const ANDROID_KEY = process.env.GOOGLE_MAPS_ANDROID_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const IOS_KEY = process.env.GOOGLE_MAPS_IOS_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'SIIR!',
  slug: 'siir',
  scheme: 'siir',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    bundleIdentifier: 'ma.siir.app',
    supportsTablet: false,
    infoPlist: { LSApplicationQueriesSchemes: ['comgooglemaps', 'waze'] },
  },
  android: {
    package: 'ma.siir.app',
    adaptiveIcon: { foregroundImage: './assets/android-icon-foreground.png', backgroundColor: '#FFFFFF', monochromeImage: './assets/android-icon-monochrome.png' },
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
  },
  plugins: [
    'expo-localization',
    ['expo-splash-screen', { image: './assets/splash-icon.png', backgroundColor: '#FFFFFF', imageWidth: 220 }],
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'SIIR! utilise votre position pour vous localiser sur la carte et indiquer votre point de prise en charge au chauffeur.',
      },
    ],
    ['react-native-maps', { androidGoogleMapsApiKey: ANDROID_KEY || undefined, iosGoogleMapsApiKey: IOS_KEY || undefined }],
  ],
  extra: { supportsRTL: true },
});
