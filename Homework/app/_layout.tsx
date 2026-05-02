import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import Toast, { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from "@/hooks/useTheme";
import { View, Text } from "react-native";

export default function RootLayout() {
  const { theme, isDark } = useTheme();

  const toastConfig = {
    success: (props: any) => (
      <BaseToast
        {...props}
        style={{ 
          borderLeftColor: theme.colors.primary,
          backgroundColor: theme.colors.card,
          borderRadius: 16,
          height: 70,
          borderLeftWidth: 6,
          width: '90%',
          marginTop: 10,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 16,
          fontWeight: '800',
          color: theme.colors.text
        }}
        text2Style={{
          fontSize: 13,
          color: theme.colors.textSecondary,
          fontWeight: '500'
        }}
      />
    ),
    error: (props: any) => (
      <ErrorToast
        {...props}
        style={{ 
          borderLeftColor: theme.colors.error,
          backgroundColor: theme.colors.card,
          borderRadius: 16,
          height: 70,
          borderLeftWidth: 6,
          width: '90%',
          marginTop: 10,
        }}
        text1Style={{
          fontSize: 16,
          fontWeight: '800',
          color: theme.colors.text
        }}
        text2Style={{
          fontSize: 13,
          color: theme.colors.textSecondary,
          fontWeight: '500'
        }}
      />
    ),
    info: (props: any) => (
      <InfoToast
        {...props}
        style={{ 
          borderLeftColor: theme.colors.primary,
          backgroundColor: theme.colors.card,
          borderRadius: 16,
          height: 70,
          borderLeftWidth: 6,
          width: '90%',
          marginTop: 10,
        }}
        text1Style={{
          fontSize: 16,
          fontWeight: '800',
          color: theme.colors.text
        }}
        text2Style={{
          fontSize: 13,
          color: theme.colors.textSecondary,
          fontWeight: '500'
        }}
      />
    )
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 300,
        }}
      >
        <Stack.Screen 
          name="splash" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="login" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
      <Toast config={toastConfig} />
    </GestureHandlerRootView>
  );
}
