import { Stack } from 'expo-router';

export default function ContactLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0F172A' },
        headerTintColor: '#F8FAFC',
      }}
    >
      <Stack.Screen
        name="new"
        options={{ title: 'New Contact' }}
      />
      <Stack.Screen
        name="capture"
        options={{ title: 'Capture Badge' }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: 'Contact Details' }}
      />
    </Stack>
  );
}
