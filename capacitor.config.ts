import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4a81259f325e4470af9b2106ecf31ea9',
  appName: 'meal-meetup',
  webDir: 'dist',
  server: {
    url: 'https://4a81259f-325e-4470-af9b-2106ecf31ea9.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;