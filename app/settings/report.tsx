import { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Surface, ProgressBar, Chip, Divider, RadioButton, List } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTeam } from '@/hooks/useTeam';
import {
  generateTripReport,
  exportReport,
  TripReportData,
} from '@/services/tripReport';

export default function TripReportScreen() {
  const { user } = useAuth();
  const { activeConference } = useTeam();

  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<TripReportData | null>(null);
  const [exportFormat, setExportFormat] = useState<'markdown' | 'csv'>('markdown');

  const handleGenerateReport = async () => {
    if (!activeConference || !user) {
      Alert.alert('Error', 'No active conference or user');
      return;
    }

    setIsGenerating(true);
    try {
      const reportData = await generateTripReport(activeConference.id, user.id);
      setReport(reportData);
    } catch (err) {
      console.error('Error generating report:', err);
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportReport = async () => {
    if (!report) return;

    try {
      await exportReport(report, exportFormat);
    } catch (err) {
      console.error('Error exporting report:', err);
      Alert.alert('Error', 'Failed to export report');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="file-document-outline" size={48} color="#0D9488" />
        <Text variant="headlineSmall" style={styles.title}>
          Trip Report Generator
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Compile all your conference data into a shareable report
        </Text>
      </View>

      {!report ? (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Generate Your Report
            </Text>
            <Text style={styles.description}>
              This will compile all your captured contacts, attended sessions, published posts, and team activities into a comprehensive trip report.
            </Text>

            <List.Section>
              <List.Item
                title="Contacts captured"
                description="All contacts you've captured with notes"
                left={(props) => <List.Icon {...props} icon="account-multiple" color="#0D9488" />}
              />
              <List.Item
                title="Sessions attended"
                description="Session attendance and key takeaways"
                left={(props) => <List.Icon {...props} icon="calendar-check" color="#8B5CF6" />}
              />
              <List.Item
                title="Social media posts"
                description="Your scheduled and published posts"
                left={(props) => <List.Icon {...props} icon="linkedin" color="#0A66C2" />}
              />
              <List.Item
                title="Activity timeline"
                description="Your complete activity history"
                left={(props) => <List.Icon {...props} icon="history" color="#F59E0B" />}
              />
            </List.Section>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="contained"
              onPress={handleGenerateReport}
              loading={isGenerating}
              disabled={isGenerating}
              style={styles.generateButton}
              icon="file-document-edit"
            >
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </Button>
          </Card.Actions>
        </Card>
      ) : (
        <>
          {/* Report Preview */}
          <Card style={styles.card}>
            <Card.Title
              title="Report Preview"
              subtitle={report.conference.name}
              left={(props) => <MaterialCommunityIcons name="check-circle" size={24} color="#10B981" />}
            />
            <Card.Content>
              <View style={styles.summaryGrid}>
                <SummaryItem
                  icon="account-multiple"
                  label="Contacts"
                  value={report.summary.totalContacts}
                  color="#0D9488"
                />
                <SummaryItem
                  icon="calendar-check"
                  label="Sessions"
                  value={`${report.summary.attendedSessions}/${report.summary.totalSessions}`}
                  color="#8B5CF6"
                />
                <SummaryItem
                  icon="linkedin"
                  label="Posts"
                  value={`${report.summary.publishedPosts}/${report.summary.totalPosts}`}
                  color="#0A66C2"
                />
                <SummaryItem
                  icon="handshake"
                  label="Engagements"
                  value={report.summary.teamEngagements}
                  color="#F59E0B"
                />
              </View>
            </Card.Content>
          </Card>

          {/* Export Options */}
          <Card style={styles.card}>
            <Card.Title title="Export Format" />
            <Card.Content>
              <RadioButton.Group
                value={exportFormat}
                onValueChange={(v) => setExportFormat(v as 'markdown' | 'csv')}
              >
                <RadioButton.Item
                  label="Markdown (.md) - Readable format with tables"
                  value="markdown"
                  style={styles.radioItem}
                />
                <RadioButton.Item
                  label="CSV (.csv) - Import into Excel or Google Sheets"
                  value="csv"
                  style={styles.radioItem}
                />
              </RadioButton.Group>
            </Card.Content>
            <Card.Actions>
              <Button onPress={handleGenerateReport}>Regenerate</Button>
              <Button
                mode="contained"
                onPress={handleExportReport}
                icon="share-variant"
                style={styles.exportButton}
              >
                Export & Share
              </Button>
            </Card.Actions>
          </Card>

          {/* Quick Stats */}
          <Card style={styles.card}>
            <Card.Title title="Report Contents" />
            <Card.Content>
              <List.Item
                title={`${report.contacts.length} Contacts`}
                description={`${report.contacts.filter((c) => c.followUpStatus === 'pending').length} pending follow-up`}
                left={(props) => <List.Icon {...props} icon="account-multiple" />}
              />
              <Divider />
              <List.Item
                title={`${report.sessions.length} Sessions Tracked`}
                description={`${report.sessions.filter((s) => s.takeaways).length} with takeaways recorded`}
                left={(props) => <List.Icon {...props} icon="calendar" />}
              />
              <Divider />
              <List.Item
                title={`${report.posts.length} Posts`}
                description={`${report.posts.filter((p) => p.linkedinUrl).length} with LinkedIn links`}
                left={(props) => <List.Icon {...props} icon="post" />}
              />
              <Divider />
              <List.Item
                title={`${report.activities.length} Activities Logged`}
                description="Complete activity timeline included"
                left={(props) => <List.Icon {...props} icon="history" />}
              />
            </Card.Content>
          </Card>
        </>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

interface SummaryItemProps {
  icon: string;
  label: string;
  value: number | string;
  color: string;
}

function SummaryItem({ icon, label, value, color }: SummaryItemProps) {
  return (
    <View style={styles.summaryItem}>
      <MaterialCommunityIcons name={icon as any} size={24} color={color} />
      <Text variant="titleLarge" style={[styles.summaryValue, { color }]}>
        {value}
      </Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    color: '#F8FAFC',
    marginTop: 12,
    fontWeight: '600',
  },
  subtitle: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
  card: {
    margin: 16,
    marginTop: 0,
  },
  cardTitle: {
    marginBottom: 12,
  },
  description: {
    color: '#94A3B8',
    lineHeight: 22,
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: '#0D9488',
    flex: 1,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    minWidth: '40%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  summaryValue: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  summaryLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  radioItem: {
    paddingVertical: 4,
  },
  exportButton: {
    backgroundColor: '#0D9488',
  },
  bottomPadding: {
    height: 40,
  },
});
