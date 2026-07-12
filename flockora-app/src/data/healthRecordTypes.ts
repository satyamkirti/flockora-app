import { HealthRecordType } from '../types/healthRecord';

export type HealthRecordTypeOption = {
  key: HealthRecordType;
  label: string;
  icon: string;
};

export const healthRecordTypeOptions: HealthRecordTypeOption[] = [
  { key: 'illness', label: 'Illness', icon: '🤒' },
  { key: 'treatment', label: 'Treatment', icon: '🩹' },
  { key: 'vaccination', label: 'Vaccination', icon: '💉' },
  { key: 'deworming', label: 'Deworming', icon: '🪱' },
  { key: 'injury', label: 'Injury', icon: '🚑' },
  { key: 'checkup', label: 'Checkup', icon: '🩺' },
];

export const healthRecordTypeByKey = (key: HealthRecordType): HealthRecordTypeOption =>
  healthRecordTypeOptions.find((option) => option.key === key) ?? healthRecordTypeOptions[healthRecordTypeOptions.length - 1];
