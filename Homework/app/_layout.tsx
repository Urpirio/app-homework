import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import Toast, { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React from 'react';

// Tell Expo Router to start on 'login' instead of 'index'
export const unstable_settings = {
  initialRouteName: 'login',
};

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ 
        borderLeftColor: '#007AFF',
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        height: 70,
        borderLeftWidth: 6,
        width: '90%',
        marginTop: 10,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}
      text2Style={{ fontSize: 13, color: '#AEAEB2', fontWeight: '500' }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ 
        borderLeftColor: '#FF3B30',
        backgroundColor: '#FF3B30',
        borderRadius: 16,
        height: 70,
        borderLeftWidth: 6,
        width: '90%',
        marginTop: 10,
      }}
      text1Style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}
      text2Style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.8)', fontWeight: '500' }}
    />
  ),
  info: (props: any) => (
    <InfoToast
      {...props}
      style={{ 
        borderLeftColor: '#007AFF',
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        height: 70,
        borderLeftWidth: 6,
        width: '90%',
        marginTop: 10,
      }}
      text1Style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}
      text2Style={{ fontSize: 13, color: '#AEAEB2', fontWeight: '500' }}
    />
  )
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
      <Toast config={toastConfig} />
    </GestureHandlerRootView>
  );
}
