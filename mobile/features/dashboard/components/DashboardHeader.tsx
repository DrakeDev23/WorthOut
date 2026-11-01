import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { spacing } from '@/constants/theme';
import { greetingForHour } from '@/lib/format';

interface DashboardHeaderProps {
  name: string;
  onNotificationsPress: () => void;
  onProfilePress: () => void;
}

export function DashboardHeader({
  name,
  onNotificationsPress,
  onProfilePress,
}: DashboardHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Avatar name={name} size={48} />
        <View style={styles.greeting}>
          <AppText variant="caption" tone="muted">
            {greetingForHour()}
          </AppText>
          <AppText variant="subheading" accessibilityRole="header">
            {name}
          </AppText>
        </View>
      </View>
      <View style={styles.actions}>
        <IconButton
          name="notifications-outline"
          accessibilityLabel="Notifications"
          accessibilityHint="View your notifications"
          badge
          onPress={onNotificationsPress}
        />
        <IconButton
          name="person-circle-outline"
          accessibilityLabel="Profile"
          accessibilityHint="Open your profile"
          onPress={onProfilePress}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexShrink: 1,
  },
  greeting: {
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
