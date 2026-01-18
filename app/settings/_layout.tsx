import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0F172A' },
        headerTintColor: '#F8FAFC',
      }}
    >
      <Stack.Screen
        name="report"
        options={{ title: 'Trip Report' }}
      />
    </Stack>
  );
}
