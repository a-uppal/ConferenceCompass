import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Avatar, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TeamPersona } from '@/types/campaign';

interface TeamPersonasCardProps {
  personas: TeamPersona[];
  onViewPersona?: (persona: TeamPersona) => void;
}

// Persona styling based on name patterns
const PERSONA_STYLES: Record<string, { color: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  'Visionary': { color: '#8B5CF6', icon: 'lightbulb-on' },
  'Architect': { color: '#8B5CF6', icon: 'lightbulb-on' },
  'Expert': { color: '#3B82F6', icon: 'certificate' },
  'Credible': { color: '#3B82F6', icon: 'certificate' },
  'Connector': { color: '#10B981', icon: 'account-network' },
  'Strategist': { color: '#F59E0B', icon: 'chess-knight' },
  'Evangelist': { color: '#EF4444', icon: 'bullhorn' },
  'Analyst': { color: '#06B6D4', icon: 'chart-line' },
  'Default': { color: '#64748B', icon: 'account' },
};

const getPersonaStyle = (personaName: string) => {
  for (const [key, style] of Object.entries(PERSONA_STYLES)) {
    if (personaName.toLowerCase().includes(key.toLowerCase())) {
      return style;
    }
  }
  return PERSONA_STYLES.Default;
};

export function TeamPersonasCard({ personas, onViewPersona }: TeamPersonasCardProps) {
  if (personas.length === 0) {
    return (
      <Card style={styles.container}>
        <Card.Title
          title="Team Personas"
          left={(props) => (
            <MaterialCommunityIcons name="account-group" size={24} color="#64748B" />
          )}
        />
        <Card.Content>
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-question" size={48} color="#64748B" />
            <Text style={styles.emptyText}>No personas defined yet</Text>
            <Text style={styles.emptySubtext}>
              Set up team personas to coordinate your social media voices
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.container}>
      <Card.Title
        title="Team Personas"
        subtitle={`${personas.length} voices coordinated`}
        left={(props) => (
          <MaterialCommunityIcons name="account-group" size={24} color="#0D9488" />
        )}
      />
      <Card.Content>
        {personas.map((persona) => {
          const style = getPersonaStyle(persona.persona_name);

          return (
            <TouchableOpacity
              key={persona.id}
              style={styles.personaCard}
              onPress={() => onViewPersona?.(persona)}
              activeOpacity={0.7}
            >
              <View style={styles.personaHeader}>
                {persona.user?.avatar_url ? (
                  <Avatar.Image size={44} source={{ uri: persona.user.avatar_url }} />
                ) : (
                  <Avatar.Text
                    size={44}
                    label={persona.user?.full_name?.charAt(0) || '?'}
                    style={{ backgroundColor: style.color }}
                  />
                )}
                <View style={styles.personaInfo}>
                  <Text style={styles.personaUserName}>
                    {persona.user?.full_name || 'Team Member'}
                  </Text>
                  <View style={styles.personaNameRow}>
                    <MaterialCommunityIcons
                      name={style.icon}
                      size={14}
                      color={style.color}
                    />
                    <Text style={[styles.personaName, { color: style.color }]}>
                      {persona.persona_name}
                    </Text>
                  </View>
                </View>
              </View>

              {persona.lane && (
                <View style={styles.laneSection}>
                  <Text style={styles.laneLabel}>Content Lane</Text>
                  <Text style={styles.laneValue}>{persona.lane}</Text>
                </View>
              )}

              {persona.tone && (
                <View style={styles.toneSection}>
                  <Text style={styles.toneLabel}>Tone</Text>
                  <Chip
                    style={[styles.toneChip, { backgroundColor: style.color + '20' }]}
                    textStyle={[styles.toneChipText, { color: style.color }]}
                  >
                    {persona.tone}
                  </Chip>
                </View>
              )}

              {persona.key_slides && persona.key_slides.length > 0 && (
                <View style={styles.slidesSection}>
                  <Text style={styles.slidesLabel}>Key Slides</Text>
                  <View style={styles.slidesList}>
                    {persona.key_slides.slice(0, 3).map((slide, index) => (
                      <Chip
                        key={index}
                        style={styles.slideChip}
                        textStyle={styles.slideChipText}
                      >
                        {slide}
                      </Chip>
                    ))}
                    {persona.key_slides.length > 3 && (
                      <Text style={styles.moreSlides}>
                        +{persona.key_slides.length - 3} more
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
  personaCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  personaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  personaInfo: {
    flex: 1,
  },
  personaUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  personaNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  personaName: {
    fontSize: 13,
    fontWeight: '600',
  },
  laneSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  laneLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  laneValue: {
    fontSize: 13,
    color: '#F8FAFC',
    lineHeight: 18,
  },
  toneSection: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toneLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  toneChip: {
    height: 26,
  },
  toneChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  slidesSection: {
    marginTop: 10,
  },
  slidesLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 6,
  },
  slidesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  slideChip: {
    height: 24,
    backgroundColor: '#334155',
  },
  slideChipText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  moreSlides: {
    fontSize: 10,
    color: '#64748B',
    marginLeft: 4,
  },
});
