import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CampaignPhase, CampaignPhaseName } from '@/types/campaign';

interface PhaseIndicatorProps {
  phases: CampaignPhase[];
  currentPhase: CampaignPhase | null;
  currentWeek: number;
  daysUntilConference: number;
}

const PHASE_COLORS: Record<CampaignPhaseName, string> = {
  'Agitate': '#EF4444',      // Red - create urgency
  'Educate': '#3B82F6',      // Blue - inform
  'Hype': '#F59E0B',         // Amber - excitement
  'Conference': '#10B981',   // Green - live action
  'Follow-Up': '#8B5CF6',    // Purple - nurture
};

const PHASE_ICONS: Record<CampaignPhaseName, keyof typeof MaterialCommunityIcons.glyphMap> = {
  'Agitate': 'fire',
  'Educate': 'school',
  'Hype': 'rocket-launch',
  'Conference': 'map-marker-radius',
  'Follow-Up': 'handshake',
};

export function PhaseIndicator({
  phases,
  currentPhase,
  currentWeek,
  daysUntilConference,
}: PhaseIndicatorProps) {
  const getPhaseStatus = (phase: CampaignPhase): 'past' | 'current' | 'future' => {
    if (currentWeek > phase.week_end) return 'past';
    if (currentWeek >= phase.week_start && currentWeek <= phase.week_end) return 'current';
    return 'future';
  };

  return (
    <Surface style={styles.container}>
      {/* Countdown */}
      <View style={styles.countdownSection}>
        <View style={styles.countdownBadge}>
          <Text style={styles.countdownNumber}>
            {daysUntilConference > 0 ? daysUntilConference : 0}
          </Text>
          <Text style={styles.countdownLabel}>
            {daysUntilConference > 0 ? 'days to go' : daysUntilConference === 0 ? "It's today!" : 'days ago'}
          </Text>
        </View>
        <View style={styles.weekInfo}>
          <Text style={styles.weekLabel}>Week {Math.abs(currentWeek)}</Text>
          <Text style={styles.weekSublabel}>
            {currentWeek < 0 ? 'before conference' : currentWeek === 0 ? 'conference week' : 'after conference'}
          </Text>
        </View>
      </View>

      {/* Current Phase Highlight */}
      {currentPhase && (
        <View style={[styles.currentPhase, { backgroundColor: PHASE_COLORS[currentPhase.name] + '20' }]}>
          <MaterialCommunityIcons
            name={PHASE_ICONS[currentPhase.name]}
            size={24}
            color={PHASE_COLORS[currentPhase.name]}
          />
          <View style={styles.currentPhaseInfo}>
            <Text style={[styles.currentPhaseName, { color: PHASE_COLORS[currentPhase.name] }]}>
              {currentPhase.name} Phase
            </Text>
            {currentPhase.goal && (
              <Text style={styles.currentPhaseGoal} numberOfLines={2}>
                {currentPhase.goal}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Phase Timeline */}
      <View style={styles.timeline}>
        {phases.map((phase, index) => {
          const status = getPhaseStatus(phase);
          const color = PHASE_COLORS[phase.name];

          return (
            <View key={phase.id} style={styles.phaseItem}>
              {/* Connector Line */}
              {index > 0 && (
                <View
                  style={[
                    styles.connector,
                    status === 'past' && styles.connectorPast,
                    status === 'current' && styles.connectorCurrent,
                  ]}
                />
              )}

              {/* Phase Dot */}
              <View
                style={[
                  styles.phaseDot,
                  { borderColor: color },
                  status === 'past' && { backgroundColor: color },
                  status === 'current' && { backgroundColor: color, transform: [{ scale: 1.2 }] },
                ]}
              >
                {status === 'current' && (
                  <View style={styles.pulseRing} />
                )}
              </View>

              {/* Phase Label */}
              <Text
                style={[
                  styles.phaseLabel,
                  status === 'past' && styles.phaseLabelPast,
                  status === 'current' && { color, fontWeight: '700' },
                ]}
                numberOfLines={1}
              >
                {phase.name}
              </Text>

              {/* Week Range */}
              <Text style={styles.phaseWeeks}>
                W{phase.week_start}-{phase.week_end}
              </Text>
            </View>
          );
        })}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 10,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  countdownSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  countdownBadge: {
    backgroundColor: '#0D9488',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  countdownNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  countdownLabel: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  weekInfo: {
    flex: 1,
  },
  weekLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  weekSublabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  currentPhase: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 12,
  },
  currentPhaseInfo: {
    flex: 1,
  },
  currentPhaseName: {
    fontSize: 16,
    fontWeight: '700',
  },
  currentPhaseGoal: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 18,
  },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 8,
  },
  phaseItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    top: 8,
    left: -50,
    right: 50,
    height: 2,
    backgroundColor: '#334155',
    zIndex: 0,
  },
  connectorPast: {
    backgroundColor: '#64748B',
  },
  connectorCurrent: {
    backgroundColor: '#0D9488',
  },
  phaseDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  pulseRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0D9488',
    opacity: 0.3,
  },
  phaseLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  phaseLabelPast: {
    color: '#64748B',
  },
  phaseWeeks: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
  },
});
