import { Redirect } from 'expo-router';

/**
 * Index Screen - Entry Point Redirect
 * 
 * This screen serves as the entry point for the app and immediately
 * redirects to the splash screen. This ensures the splash screen is
 * always shown when the app launches.
 * 
 * The redirect uses Expo Router's <Redirect> component which performs
 * a client-side navigation without adding to the navigation stack.
 */
export default function Index() {
  return <Redirect href="/splash" />;
}
