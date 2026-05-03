import { View } from 'react-native';

/**
 * Index Screen - Blank entry point.
 * Initial route is set to 'login' via unstable_settings in _layout.tsx.
 * This file exists only because Expo Router requires an index route.
 */
export default function Index() {
  return <View style={{ flex: 1 }} />;
}
