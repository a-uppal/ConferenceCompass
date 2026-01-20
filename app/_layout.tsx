import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@react-navigation/native';
import { AppTheme, NavTheme } from '@/constants/theme';

// Suppress AbortError from Supabase's Web Locks API on web
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.name === 'AbortError' ||
        event.reason?.message?.includes('aborted')) {
      event.preventDefault();
    }
  });
}
import { AuthProvider } from '@/hooks/useAuth';
import { TeamProvider } from '@/hooks/useTeam';
import { CampaignProvider } from '@/hooks/useCampaign';
import { SocialPostsProvider } from '@/hooks/useSocialPosts';
import { CrossPollinationProvider } from '@/hooks/useCrossPollination';
import { ContentLibraryProvider } from '@/hooks/useContentLibrary';
import { ConferenceScheduleProvider } from '@/hooks/useConferenceSchedule';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TeamProvider>
          <CampaignProvider>
            <SocialPostsProvider>
              <CrossPollinationProvider>
                <ContentLibraryProvider>
                  <ConferenceScheduleProvider>
                    <ThemeProvider value={NavTheme}>
                      <PaperProvider theme={AppTheme}>
                        <StatusBar style="light" />
                        <Stack
                          screenOptions={{
                            headerShown: false,
                          }}
                        >
                          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                          <Stack.Screen name="contact" options={{ headerShown: false }} />
                          <Stack.Screen name="session" options={{ headerShown: false }} />
                          <Stack.Screen name="post" options={{ headerShown: false }} />
                        </Stack>
                      </PaperProvider>
                    </ThemeProvider>
                  </ConferenceScheduleProvider>
                </ContentLibraryProvider>
              </CrossPollinationProvider>
            </SocialPostsProvider>
          </CampaignProvider>
        </TeamProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
