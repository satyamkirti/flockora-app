export type FlockStackParamList = {
  FlockHome: undefined;
  BirdProfile: { birdId: number };
  AddEditBird: { birdId?: number };
  HealthRecordDetail: { recordId: number };
  AddEditHealthRecord: { birdId: number; recordId?: number };
};
