import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { SecondaryButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Icon, type IconName } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TabScreen } from '@/components/ui/TabScreen';
import { colors, radius, spacing } from '@/constants/theme';
import { useSession } from '@/store/session';

interface SettingRow {
  key: string;
  icon: IconName;
  label: string;
}

const SETTINGS: SettingRow[] = [
  { key: 'edit', icon: 'person-outline', label: 'Edit profile' },
  { key: 'equipment', icon: 'barbell-outline', label: 'Equipment preferences' },
  { key: 'workout', icon: 'options-outline', label: 'Workout preferences' },
  { key: 'notifications', icon: 'notifications-outline', label: 'Notifications' },
  { key: 'theme', icon: 'color-palette-outline', label: 'Theme' },
  { key: 'about', icon: 'information-circle-outline', label: 'About Worthout' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useSession();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of Worthout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          signOut();
          router.replace('/');
        },
      },
    ]);
  };

  const handleSettingPress = (key: string) => {
    switch (key) {
      case 'notifications':
        router.push('/notifications');
        break;
      case 'theme':
        Alert.alert(
          'Theme',
          'Worthout uses a high-contrast Dark Mode (#0A0C10) by default to keep battery draw low and readability sharp.'
        );
        break;
      case 'about':
        Alert.alert(
          'About Worthout',
          'Worthout — Every rep is worth it.\nVersion 0.1.0\nPlanned home workouts, active tracking, and analytics.'
        );
        break;
      case 'edit':
        Alert.alert(
          'Edit Profile',
          `Profile information for ${user?.name ?? 'Athlete'} (${user?.email ?? 'you@worthout.app'}).`
        );
        break;
      case 'equipment':
        Alert.alert(
          'Equipment Preferences',
          `Current equipment: ${user?.preferredEquipment?.join(', ') || 'Bodyweight'}`
        );
        break;
      case 'workout':
        Alert.alert(
          'Workout Preferences',
          `Weekly goal: ${user?.weeklyGoal ?? 5} workouts\nFocus: ${user?.fitnessGoal ?? 'Build strength at home'}`
        );
        break;
      default:
        break;
    }
  };

  return (
    <TabScreen>
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          Profile
        </AppText>
      </View>

      <Card>
        <View style={styles.identity}>
          <Avatar name={user?.name ?? 'Athlete'} size={64} />
          <View style={styles.identityText}>
            <AppText variant="heading" numberOfLines={1}>
              {user?.name ?? 'Athlete'}
            </AppText>
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {user?.email ?? 'you@worthout.app'}
            </AppText>
          </View>
        </View>
        {user?.bio ? <AppText tone="muted">{user.bio}</AppText> : null}
        <View style={styles.equipmentRow}>
          {(user?.preferredEquipment ?? []).map((item) => (
            <Chip key={item} label={item} />
          ))}
        </View>
      </Card>

      <View>
        <SectionHeader title="Settings" />
        <View style={styles.settingsList}>
          {SETTINGS.map((row) => (
            <PressableScale
              key={row.key}
              accessibilityRole="button"
              accessibilityLabel={row.label}
              onPress={() => handleSettingPress(row.key)}
              style={styles.settingRow}
            >
              <View style={styles.settingIcon}>
                <Icon name={row.icon} size={18} color={colors.textMuted} />
              </View>
              <AppText variant="body" style={styles.settingLabel}>
                {row.label}
              </AppText>
              <Icon name="chevron-forward" size={18} color={colors.textSubtle} />
            </PressableScale>
          ))}
        </View>
      </View>

      <SecondaryButton
        title="Sign Out"
        accessibilityHint="Signs out and returns to the welcome screen"
        onPress={handleSignOut}
      />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.sm,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  equipmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  settingsList: {
    gap: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    flex: 1,
  },
});
