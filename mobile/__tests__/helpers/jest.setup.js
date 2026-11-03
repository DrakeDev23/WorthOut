jest.mock('expo-sqlite', () => ({
  openDatabaseSync: () => ({
    execSync: () => undefined,
    runSync: () => undefined,
    getAllSync: () => [],
    prepareSync: () => ({ executeSync: () => ({ getAllSync: () => [] }) }),
  }),
}));
