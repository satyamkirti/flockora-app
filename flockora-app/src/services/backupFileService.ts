import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { BackupData } from '../types/backup';

export async function writeAndShareBackup(data: BackupData): Promise<boolean> {
  const json = JSON.stringify(data, null, 2);
  const file = new File(Paths.cache, `flockora-backup-${Date.now()}.json`);
  file.create();
  file.write(json);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    return false;
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export Flockora Backup',
  });
  return true;
}

export type PickBackupFileOutcome =
  | { status: 'success'; uri: string; name: string }
  | { status: 'canceled' }
  | { status: 'error'; message: string };

/** Accepts any file type rather than filtering to a JSON MIME type — many Android file providers
 *  report .json files as text/plain or application/octet-stream, so a MIME filter here would
 *  unpredictably hide valid backup files. The picked file's content is validated after reading. */
export async function pickBackupFile(): Promise<PickBackupFileOutcome> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || result.assets.length === 0) {
      return { status: 'canceled' };
    }
    const asset = result.assets[0];
    return { status: 'success', uri: asset.uri, name: asset.name };
  } catch (error) {
    return { status: 'error', message: 'Could not open the file picker.' };
  }
}

export async function readBackupFile(uri: string): Promise<unknown> {
  const file = new File(uri);
  const text = await file.text();
  return JSON.parse(text);
}
