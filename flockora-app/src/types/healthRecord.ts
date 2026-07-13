export type HealthRecordType =
  | 'illness'
  | 'treatment'
  | 'vaccination'
  | 'deworming'
  | 'injury'
  | 'checkup'
  | 'supplement'
  | 'other';

export type HealthRecordStatus = 'active' | 'completed';

export type HealthRecord = {
  id: number;
  birdId: number | null;
  flockId: number | null;
  type: HealthRecordType;
  title: string;
  notes: string | null;
  medicine: string | null;
  dosage: string | null;
  startDate: string | null;
  endDate: string | null;
  time: string | null;
  veterinarian: string | null;
  cost: number | null;
  reminderDate: string | null;
  status: HealthRecordStatus;
  notificationId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HealthRecordInput = {
  birdId: number | null;
  flockId: number | null;
  type: HealthRecordType;
  title: string;
  notes: string | null;
  medicine: string | null;
  dosage: string | null;
  startDate: string | null;
  endDate: string | null;
  time: string | null;
  veterinarian: string | null;
  cost: number | null;
  reminderDate: string | null;
  status: HealthRecordStatus;
};

export type BirdHealthStats = {
  treatmentCount: number;
  vaccinationsCompleted: number;
  totalExpenses: number;
  activeMedicineCount: number;
};

export type HealthDashboardStats = {
  activeTreatments: number;
  vaccinationsDue: number;
  healthAlerts: number;
  recentRecordsCount: number;
};

export type HealthRecordFilters = {
  searchText: string;
  birdId: number | null;
  flockId: number | null;
  type: HealthRecordType | null;
  status: HealthRecordStatus | null;
  date: string;
};

export const createEmptyHealthRecordInput = (birdId: number | null): HealthRecordInput => ({
  birdId,
  flockId: null,
  type: 'checkup',
  title: '',
  notes: null,
  medicine: null,
  dosage: null,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: null,
  time: null,
  veterinarian: null,
  cost: null,
  reminderDate: null,
  status: 'active',
});

export const emptyHealthRecordFilters: HealthRecordFilters = {
  searchText: '',
  birdId: null,
  flockId: null,
  type: null,
  status: null,
  date: '',
};
