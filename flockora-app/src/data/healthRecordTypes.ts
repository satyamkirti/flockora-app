import { HealthRecordType } from '../types/healthRecord';

export type HealthRecordTypeOption = {
  key: HealthRecordType;
  label: string;
  icon: string;
};

export const healthRecordTypeOptions: HealthRecordTypeOption[] = [
  { key: 'vaccination', label: 'Vaccination', icon: '💉' },
  { key: 'treatment', label: 'Medication', icon: '💊' },
  { key: 'deworming', label: 'Deworming', icon: '🪱' },
  { key: 'supplement', label: 'Supplement', icon: '🌿' },
  { key: 'checkup', label: 'Health Check', icon: '🩺' },
  { key: 'injury', label: 'Injury Care', icon: '🚑' },
  { key: 'other', label: 'Other', icon: '📋' },
  { key: 'illness', label: 'Illness', icon: '🤒' },
];

export const healthRecordTypeByKey = (key: HealthRecordType): HealthRecordTypeOption =>
  healthRecordTypeOptions.find((option) => option.key === key) ?? healthRecordTypeOptions[healthRecordTypeOptions.length - 1];
