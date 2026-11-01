import React from 'react';

import { EmptyState } from '@/components/ui/EmptyState';
import { StackScreenHeader } from '@/components/ui/StackScreenHeader';
import { TabScreen } from '@/components/ui/TabScreen';

export default function NotificationsScreen() {
  return (
    <TabScreen tabBarClearance={false}>
      <StackScreenHeader title="Notifications" />
      <EmptyState
        icon="notifications-outline"
        title="You're all caught up"
        message="Reminders and workout nudges will appear here once notifications are enabled."
      />
    </TabScreen>
  );
}
