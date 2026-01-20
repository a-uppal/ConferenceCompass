import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MessageStyle } from '@/types/database';

interface StyleOption {
  style: MessageStyle;
  label: string;
  description: string;
  icon: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    style: 'professional',
    label: 'Professional',
    description: 'Formal but warm, business-focused',
    icon: 'briefcase-outline',
  },
  {
    style: 'casual',
    label: 'Casual',
    description: 'Friendly and personable',
    icon: 'emoticon-happy-outline',
  },
  {
    style: 'brief',
    label: 'Brief',
    description: '2-3 sentences, straight to the point',
    icon: 'lightning-bolt-outline',
  },
];

interface Props {
  selected: MessageStyle;
  onSelect: (style: MessageStyle) => void;
  disabled?: boolean;
}

export function MessageStyleSelector({ selected, onSelect, disabled }: Props) {
  return (
    <View style={styles.container}>
      <Text variant="labelLarge" style={styles.label}>
        Message Style
      </Text>
      <View style={styles.optionsRow}>
        {STYLE_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.style}
            onPress={() => onSelect(option.style)}
            disabled={disabled}
            activeOpacity={0.7}
            style={styles.optionWrapper}
          >
            <Surface
              style={[
                styles.option,
                selected === option.style && styles.optionSelected,
                disabled && styles.optionDisabled,
              ]}
            >
              <MaterialCommunityIcons
                name={option.icon as any}
                size={24}
                color={selected === option.style ? '#0D9488' : '#94A3B8'}
              />
              <Text
                variant="labelMedium"
                style={[
                  styles.optionLabel,
                  selected === option.style && styles.optionLabelSelected,
                ]}
              >
                {option.label}
              </Text>
            </Surface>
          </TouchableOpacity>
        ))}
      </View>
      <Text variant="bodySmall" style={styles.description}>
        {STYLE_OPTIONS.find((o) => o.style === selected)?.description}
      </Text>
    </View>
  );
}

interface ChannelOption {
  channel: 'linkedin' | 'email';
  label: string;
  icon: string;
}

const CHANNEL_OPTIONS: ChannelOption[] = [
  {
    channel: 'linkedin',
    label: 'LinkedIn',
    icon: 'linkedin',
  },
  {
    channel: 'email',
    label: 'Email',
    icon: 'email-outline',
  },
];

interface ChannelSelectorProps {
  selected: 'linkedin' | 'email';
  onSelect: (channel: 'linkedin' | 'email') => void;
  disabled?: boolean;
  hasEmail?: boolean;
  hasLinkedIn?: boolean;
}

export function ChannelSelector({
  selected,
  onSelect,
  disabled,
  hasEmail,
  hasLinkedIn,
}: ChannelSelectorProps) {
  return (
    <View style={styles.container}>
      <Text variant="labelLarge" style={styles.label}>
        Send via
      </Text>
      <View style={styles.channelRow}>
        {CHANNEL_OPTIONS.map((option) => {
          const isDisabled =
            disabled ||
            (option.channel === 'email' && !hasEmail) ||
            (option.channel === 'linkedin' && hasLinkedIn === false);

          return (
            <TouchableOpacity
              key={option.channel}
              onPress={() => onSelect(option.channel)}
              disabled={isDisabled}
              activeOpacity={0.7}
              style={styles.channelWrapper}
            >
              <Surface
                style={[
                  styles.channelOption,
                  selected === option.channel && styles.channelSelected,
                  isDisabled && styles.optionDisabled,
                ]}
              >
                <MaterialCommunityIcons
                  name={option.icon as any}
                  size={20}
                  color={
                    isDisabled
                      ? '#475569'
                      : selected === option.channel
                      ? '#0D9488'
                      : '#94A3B8'
                  }
                />
                <Text
                  variant="labelMedium"
                  style={[
                    styles.channelLabel,
                    selected === option.channel && styles.optionLabelSelected,
                    isDisabled && styles.labelDisabled,
                  ]}
                >
                  {option.label}
                </Text>
              </Surface>
            </TouchableOpacity>
          );
        })}
      </View>
      {!hasEmail && selected === 'email' && (
        <Text variant="bodySmall" style={styles.warningText}>
          No email address for this contact
        </Text>
      )}
    </View>
  );
}

interface ReminderOption {
  value: number | null;
  label: string;
}

const REMINDER_OPTIONS: ReminderOption[] = [
  { value: null, label: 'None' },
  { value: 3, label: '3 days' },
  { value: 7, label: '1 week' },
  { value: 14, label: '2 weeks' },
];

interface ReminderSelectorProps {
  selected: number | null;
  onSelect: (days: number | null) => void;
  disabled?: boolean;
}

export function ReminderSelector({
  selected,
  onSelect,
  disabled,
}: ReminderSelectorProps) {
  return (
    <View style={styles.container}>
      <Text variant="labelLarge" style={styles.label}>
        Reminder if no response
      </Text>
      <View style={styles.reminderRow}>
        {REMINDER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.label}
            onPress={() => onSelect(option.value)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Surface
              style={[
                styles.reminderOption,
                selected === option.value && styles.reminderSelected,
                disabled && styles.optionDisabled,
              ]}
            >
              <Text
                variant="labelSmall"
                style={[
                  styles.reminderLabel,
                  selected === option.value && styles.optionLabelSelected,
                ]}
              >
                {option.label}
              </Text>
            </Surface>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: '#F8FAFC',
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionWrapper: {
    flex: 1,
  },
  option: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: '#0D9488',
    backgroundColor: '#0D948810',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionLabel: {
    marginTop: 4,
    color: '#94A3B8',
  },
  optionLabelSelected: {
    color: '#0D9488',
  },
  description: {
    marginTop: 8,
    color: '#94A3B8',
    textAlign: 'center',
  },
  channelRow: {
    flexDirection: 'row',
    gap: 12,
  },
  channelWrapper: {
    flex: 1,
  },
  channelOption: {
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  channelSelected: {
    borderColor: '#0D9488',
    backgroundColor: '#0D948810',
  },
  channelLabel: {
    color: '#94A3B8',
  },
  labelDisabled: {
    color: '#475569',
  },
  warningText: {
    marginTop: 4,
    color: '#F59E0B',
  },
  reminderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  reminderOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reminderSelected: {
    borderColor: '#0D9488',
    backgroundColor: '#0D948810',
  },
  reminderLabel: {
    color: '#94A3B8',
  },
});

export default MessageStyleSelector;
