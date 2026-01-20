import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Card style={styles.card}>
            <Card.Content style={styles.content}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={64}
                color="#EF4444"
              />
              <Text style={styles.title}>Something went wrong</Text>
              <Text style={styles.message}>
                We encountered an unexpected error. Please try again.
              </Text>

              {__DEV__ && this.state.error && (
                <ScrollView style={styles.errorDetails}>
                  <Text style={styles.errorTitle}>Error Details (Dev Only):</Text>
                  <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                  {this.state.errorInfo && (
                    <Text style={styles.stackTrace}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  )}
                </ScrollView>
              )}

              <Button
                mode="contained"
                onPress={this.handleRetry}
                style={styles.retryButton}
                icon="refresh"
              >
                Try Again
              </Button>
            </Card.Content>
          </Card>
        </View>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for screens
interface ScreenErrorBoundaryProps {
  children: ReactNode;
  screenName?: string;
}

export function ScreenErrorBoundary({ children, screenName }: ScreenErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Log to analytics/crash reporting service
    console.error(`[${screenName || 'Screen'}] Error:`, error.message);
  };

  return (
    <ErrorBoundary onError={handleError}>
      {children}
    </ErrorBoundary>
  );
}

// Error display component for API errors
interface ApiErrorProps {
  error: Error | string | null;
  onRetry?: () => void;
  compact?: boolean;
}

export function ApiError({ error, onRetry, compact = false }: ApiErrorProps) {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;

  if (compact) {
    return (
      <View style={styles.compactError}>
        <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
        <Text style={styles.compactErrorText}>{errorMessage}</Text>
        {onRetry && (
          <Button mode="text" onPress={onRetry} compact labelStyle={{ fontSize: 12 }}>
            Retry
          </Button>
        )}
      </View>
    );
  }

  return (
    <Card style={styles.errorCard}>
      <Card.Content style={styles.errorCardContent}>
        <MaterialCommunityIcons name="alert-circle" size={32} color="#EF4444" />
        <Text style={styles.errorCardText}>{errorMessage}</Text>
        {onRetry && (
          <Button mode="outlined" onPress={onRetry} style={styles.errorRetryButton}>
            Retry
          </Button>
        )}
      </Card.Content>
    </Card>
  );
}

// Empty state component
interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function EmptyState({ icon = 'inbox-outline', title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name={icon as any} size={64} color="#64748B" />
      <Text style={styles.emptyTitle}>{title}</Text>
      {message && <Text style={styles.emptyMessage}>{message}</Text>}
      {action && (
        <Button
          mode="contained"
          onPress={action.onPress}
          style={styles.emptyAction}
        >
          {action.label}
        </Button>
      )}
    </View>
  );
}

// Loading state component
interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <View style={styles.loadingState}>
      <MaterialCommunityIcons name="loading" size={48} color="#0D9488" />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1E293B',
    width: '100%',
    maxWidth: 400,
  },
  content: {
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorDetails: {
    maxHeight: 200,
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 11,
    color: '#F87171',
    fontFamily: 'monospace',
  },
  stackTrace: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: 'monospace',
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: '#0D9488',
    minWidth: 120,
  },
  compactError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  compactErrorText: {
    flex: 1,
    fontSize: 12,
    color: '#F87171',
  },
  errorCard: {
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  errorCardContent: {
    alignItems: 'center',
    padding: 16,
  },
  errorCardText: {
    fontSize: 14,
    color: '#F87171',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  errorRetryButton: {
    borderColor: '#EF4444',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  emptyAction: {
    marginTop: 24,
    backgroundColor: '#0D9488',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 16,
  },
});
