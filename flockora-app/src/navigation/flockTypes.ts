export type FlockStackParamList = {
  FlockHome: undefined;
  BirdProfile: { birdId: number };
  AddEditBird: { birdId?: number };
  HealthRecordDetail: { recordId: number };
  AddEditHealthRecord: { birdId: number; recordId?: number };
  EggDashboard: undefined;
  EggHistory: undefined;
  AddEditEggRecord: { recordId?: number };
  FeedInventory: undefined;
  AddEditFeedItem: { itemId?: number };
  LogFeedUsage: { feedItemId?: number; logId?: number };
  FeedHistory: undefined;
};
