export type BackupRow = Record<string, unknown>;

export type BackupData = {
  schemaVersion: number;
  exportedAt: string;
  flocks: BackupRow[];
  birds: BackupRow[];
  tasks: BackupRow[];
  healthRecords: BackupRow[];
  eggRecords: BackupRow[];
  feedItems: BackupRow[];
  feedLogs: BackupRow[];
  breedingPairs: BackupRow[];
  clutches: BackupRow[];
  candlingRecords: BackupRow[];
  hatchRecords: BackupRow[];
};

export type BackupTableKey = keyof Omit<BackupData, 'schemaVersion' | 'exportedAt'>;
