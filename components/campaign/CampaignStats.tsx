import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CampaignStats as CampaignStatsType } from '@/types/campaign';

interface CampaignStatsProps {
  stats: CampaignStatsType | null;
  onPressStats?: () => void;
}

export function CampaignStats({ stats, onPressStats }: CampaignStatsProps) {
  if (!stats) {
    return (
      <Surface style={styles.container}>
        <Text style={styles.emptyText}>Loading campaign stats...</Text>
      </Surface>
    );
  }

  const postProgress = stats.total_posts > 0
    ? stats.posted_posts / stats.total_posts
    : 0;

  return (
    <Surface style={styles.container}>
      <Text style={styles.sectionTitle}>Campaign Progress</Text>

      {/* Post Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="file-document-outline"
          label="Total Posts"
          value={stats.total_posts}
          color="#64748B"
        />
        <StatCard
          icon="pencil-outline"
          label="Drafts"
          value={stats.draft_posts}
          color="#F59E0B"
        />
        <StatCard
          icon="clock-outline"
          label="Scheduled"
          value={stats.scheduled_posts}
          color="#3B82F6"
        />
        <StatCard
          icon="check-circle"
          label="Posted"
          value={stats.posted_posts}
          color="#10B981"
        />
      </View>

      {/* Post Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Publishing Progress</Text>
          <Text style={styles.progressValue}>
            {stats.posted_posts}/{stats.total_posts}
          </Text>
        </View>
        <ProgressBar
          progress={postProgress}
          color="#10B981"
          style={styles.progressBar}
        />
      </View>

      {/* Cross-Pollination Stats */}
      <View style={styles.crossPollSection}>
        <Text style={styles.subSectionTitle}>
          <MaterialCommunityIcons name="account-multiple" size={14} color="#0D9488" />
          {'  '}Cross-Pollination
        </Text>

        <View style={styles.crossPollStats}>
          <View style={styles.crossPollItem}>
            <View style={[styles.crossPollDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.crossPollLabel}>Pending</Text>
            <Text style={styles.crossPollValue}>{stats.cross_pollination_pending}</Text>
          </View>
          <View style={styles.crossPollItem}>
            <View style={[styles.crossPollDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.crossPollLabel}>Completed</Text>
            <Text style={styles.crossPollValue}>{stats.cross_pollination_completed}</Text>
          </View>
          <View style={styles.crossPollItem}>
            <View style={[styles.crossPollDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.crossPollLabel}>Missed</Text>
            <Text style={styles.crossPollValue}>{stats.cross_pollination_missed}</Text>
          </View>
        </View>

        {/* Compliance Rate */}
        <View style={styles.complianceRow}>
          <Text style={styles.complianceLabel}>Team Compliance Rate</Text>
          <Text
            style={[
              styles.complianceValue,
              stats.cross_pollination_compliance_rate >= 80 && styles.complianceGood,
              stats.cross_pollination_compliance_rate >= 50 &&
                stats.cross_pollination_compliance_rate < 80 &&
                styles.complianceWarning,
              stats.cross_pollination_compliance_rate < 50 && styles.complianceBad,
            ]}
          >
            {stats.cross_pollination_compliance_rate.toFixed(0)}%
          </Text>
        </View>
        <ProgressBar
          progress={stats.cross_pollination_compliance_rate / 100}
          color={
            stats.cross_pollination_compliance_rate >= 80
              ? '#10B981'
              : stats.cross_pollination_compliance_rate >= 50
              ? '#F59E0B'
              : '#EF4444'
          }
          style={styles.complianceBar}
        />
      </View>
    </Surface>
  );
}

interface StatCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 10,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  emptyText: {
    color: '#94A3B8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: '#94A3B8',
  },
  progressValue: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E293B',
  },
  crossPollSection: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 16,
  },
  crossPollStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  crossPollItem: {
    alignItems: 'center',
  },
  crossPollDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  crossPollLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  crossPollValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginTop: 2,
  },
  complianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  complianceLabel: {
    fontSize: 13,
    color: '#94A3B8',
  },
  complianceValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  complianceGood: {
    color: '#10B981',
  },
  complianceWarning: {
    color: '#F59E0B',
  },
  complianceBad: {
    color: '#EF4444',
  },
  complianceBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E293B',
  },
});
