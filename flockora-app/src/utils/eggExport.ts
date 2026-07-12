import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { EggRecord } from '../types/eggRecord';

const CSV_HEADER = ['Date', 'Flock', 'Bird', 'Total Eggs', 'Fertile', 'Cracked', 'Dirty', 'Double Yolk', 'Notes'];

function escapeCsvValue(value: string | number | null): string {
  const text = value == null ? '' : String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildEggRecordsCsv(
  records: EggRecord[],
  flockNameById: Map<number, string>,
  birdNameById: Map<number, string>
): string {
  const lines = [CSV_HEADER.join(',')];

  records.forEach((record) => {
    const flockName = record.flockId != null ? flockNameById.get(record.flockId) ?? '' : '';
    const birdName = record.birdId != null ? birdNameById.get(record.birdId) ?? '' : '';
    const row = [
      record.date,
      flockName,
      birdName,
      record.totalEggs,
      record.fertileEggs,
      record.crackedEggs,
      record.dirtyEggs,
      record.doubleYolkEggs,
      record.notes ?? '',
    ];
    lines.push(row.map(escapeCsvValue).join(','));
  });

  return lines.join('\n');
}

export async function exportEggRecordsToCsv(
  records: EggRecord[],
  flockNameById: Map<number, string>,
  birdNameById: Map<number, string>
): Promise<boolean> {
  const csv = buildEggRecordsCsv(records, flockNameById, birdNameById);
  const file = new File(Paths.cache, `egg-production-${Date.now()}.csv`);
  file.create();
  file.write(csv);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    return false;
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export Egg Production',
  });
  return true;
}
