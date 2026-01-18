import { Stack } from 'expo-router';

export default function SessionLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0F172A' },
        headerTintColor: '#F8FAFC',
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{ title: 'Session Details' }}
      />
    </Stack>
  );
}
