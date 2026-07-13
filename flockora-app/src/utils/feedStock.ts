import { FeedExpiryState, FeedItem, FeedQuantityByUnit, FeedStockState } from '../types/feed';
import { startOfDay } from './taskSchedule';

export function getFeedStockState(item: Pick<FeedItem, 'quantity' | 'lowStockThreshold'>): FeedStockState {
  if (item.quantity <= 0) {
    return 'out';
  }
  if (item.lowStockThreshold != null && item.quantity <= item.lowStockThreshold) {
    return 'low';
  }
  return 'ok';
}

export function getFeedExpiryState(
  item: Pick<FeedItem, 'expiryDate'>,
  referenceDate: Date = new Date(),
  warningDays = 7
): FeedExpiryState {
  if (!item.expiryDate) {
    return 'none';
  }
  const expiry = new Date(item.expiryDate);
  const today = startOfDay(referenceDate);
  if (expiry < today) {
    return 'expired';
  }
  const warningEnd = new Date(today);
  warningEnd.setDate(warningEnd.getDate() + warningDays);
  if (expiry <= warningEnd) {
    return 'expiring';
  }
  return 'ok';
}

export function formatQuantitiesByUnit(entries: FeedQuantityByUnit[]): string {
  if (entries.length === 0) {
    return '—';
  }
  return entries.map((entry) => `${trimTrailingZero(entry.total)} ${entry.unit}`).join(', ');
}

function trimTrailingZero(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
