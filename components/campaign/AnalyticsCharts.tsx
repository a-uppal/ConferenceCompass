import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Simple Bar Chart Component
interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  title?: string;
  maxValue?: number;
  height?: number;
}

export function BarChart({ data, title, maxValue, height = 200 }: BarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);
  const barWidth = (SCREEN_WIDTH - 80) / data.length - 8;

  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <View style={[styles.barChartArea, { height }]}>
        {data.map((item, index) => {
          const barHeight = (item.value / max) * (height - 40);
          return (
            <View key={index} style={styles.barItem}>
              <Text style={styles.barValue}>{item.value}</Text>
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    width: barWidth,
                    backgroundColor: item.color || '#0D9488',
                  },
                ]}
              />
              <Text style={styles.barLabel} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// Simple Progress Ring Component
interface ProgressRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
  value?: string;
}

export function ProgressRing({
  progress,
  size = 100,
  strokeWidth = 10,
  color = '#0D9488',
  backgroundColor = '#334155',
  label,
  value,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference * (1 - Math.min(progress, 1));

  return (
    <View style={[styles.ringContainer, { width: size, height: size }]}>
      {/* Background Circle */}
      <View
        style={[
          styles.ringBackground,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: backgroundColor,
          },
        ]}
      />
      {/* Progress Arc - simplified as a partial border */}
      <View
        style={[
          styles.ringProgress,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            borderTopColor: progress > 0.25 ? color : 'transparent',
            borderRightColor: progress > 0.5 ? color : 'transparent',
            borderBottomColor: progress > 0.75 ? color : 'transparent',
            borderLeftColor: progress > 0 ? color : 'transparent',
            transform: [{ rotate: '-90deg' }],
          },
        ]}
      />
      {/* Center Content */}
      <View style={styles.ringCenter}>
        {value && <Text style={styles.ringValue}>{value}</Text>}
        {label && <Text style={styles.ringLabel}>{label}</Text>}
      </View>
    </View>
  );
}

// Simple Line/Trend Indicator
interface TrendIndicatorProps {
  current: number;
  previous: number;
  label: string;
  format?: 'number' | 'percent';
}

export function TrendIndicator({ current, previous, label, format = 'number' }: TrendIndicatorProps) {
  const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  const isPositive = change >= 0;

  const displayValue = format === 'percent' ? `${current}%` : current.toString();
  const changeText = `${isPositive ? '+' : ''}${change.toFixed(1)}%`;

  return (
    <View style={styles.trendContainer}>
      <Text style={styles.trendLabel}>{label}</Text>
      <Text style={styles.trendValue}>{displayValue}</Text>
      <View style={[styles.trendBadge, isPositive ? styles.trendPositive : styles.trendNegative]}>
        <Text style={[styles.trendChange, isPositive ? styles.trendChangePositive : styles.trendChangeNegative]}>
          {changeText}
        </Text>
      </View>
    </View>
  );
}

// Horizontal Progress Bar
interface HorizontalProgressProps {
  value: number;
  maxValue: number;
  label: string;
  color?: string;
  showValue?: boolean;
}

export function HorizontalProgress({
  value,
  maxValue,
  label,
  color = '#0D9488',
  showValue = true,
}: HorizontalProgressProps) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <View style={styles.hProgressContainer}>
      <View style={styles.hProgressHeader}>
        <Text style={styles.hProgressLabel}>{label}</Text>
        {showValue && (
          <Text style={styles.hProgressValue}>
            {value} / {maxValue}
          </Text>
        )}
      </View>
      <View style={styles.hProgressTrack}>
        <View
          style={[
            styles.hProgressFill,
            { width: `${Math.min(percentage, 100)}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

// Stats Grid Component
interface StatItem {
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}

interface StatsGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
}

export function StatsGrid({ stats, columns = 2 }: StatsGridProps) {
  return (
    <View style={[styles.statsGrid, { flexWrap: 'wrap' }]}>
      {stats.map((stat, index) => (
        <View
          key={index}
          style={[
            styles.statCard,
            { width: `${100 / columns - 2}%` },
          ]}
        >
          <Text style={[styles.statValue, stat.color ? { color: stat.color } : null]}>
            {stat.value}
          </Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
          {stat.subtext && <Text style={styles.statSubtext}>{stat.subtext}</Text>}
        </View>
      ))}
    </View>
  );
}

// Weekly Activity Heatmap
interface WeeklyHeatmapData {
  day: string;
  posts: number;
  engagement: number;
}

interface WeeklyHeatmapProps {
  data: WeeklyHeatmapData[];
  title?: string;
}

export function WeeklyHeatmap({ data, title }: WeeklyHeatmapProps) {
  const maxPosts = Math.max(...data.map((d) => d.posts), 1);

  const getIntensityColor = (value: number) => {
    const intensity = value / maxPosts;
    if (intensity === 0) return '#1E293B';
    if (intensity < 0.25) return 'rgba(13, 148, 136, 0.25)';
    if (intensity < 0.5) return 'rgba(13, 148, 136, 0.5)';
    if (intensity < 0.75) return 'rgba(13, 148, 136, 0.75)';
    return '#0D9488';
  };

  return (
    <View style={styles.heatmapContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <View style={styles.heatmapGrid}>
        {data.map((item, index) => (
          <View key={index} style={styles.heatmapItem}>
            <View
              style={[
                styles.heatmapCell,
                { backgroundColor: getIntensityColor(item.posts) },
              ]}
            >
              <Text style={styles.heatmapValue}>{item.posts}</Text>
            </View>
            <Text style={styles.heatmapLabel}>{item.day}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  barChartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  barItem: {
    alignItems: 'center',
  },
  bar: {
    borderRadius: 4,
    minHeight: 4,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 8,
    maxWidth: 50,
    textAlign: 'center',
  },
  ringContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringBackground: {
    position: 'absolute',
  },
  ringProgress: {
    position: 'absolute',
  },
  ringCenter: {
    alignItems: 'center',
  },
  ringValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  ringLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  trendContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  trendLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  trendValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  trendBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendPositive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  trendNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  trendChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendChangePositive: {
    color: '#10B981',
  },
  trendChangeNegative: {
    color: '#EF4444',
  },
  hProgressContainer: {
    marginBottom: 12,
  },
  hProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  hProgressLabel: {
    fontSize: 13,
    color: '#CBD5E1',
  },
  hProgressValue: {
    fontSize: 12,
    color: '#94A3B8',
  },
  hProgressTrack: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
  },
  hProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  statSubtext: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  heatmapContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  heatmapGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heatmapItem: {
    alignItems: 'center',
  },
  heatmapCell: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heatmapValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  heatmapLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
});
