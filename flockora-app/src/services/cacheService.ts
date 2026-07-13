import { Paths } from 'expo-file-system';

export type ClearCacheResult = {
  fileCount: number;
  bytesFreed: number;
};

/** Clears Flockora's own temporary cache directory — egg CSV exports (`eggExport.ts`), JSON
 *  backup exports, and document-picker copies of a picked backup file (`backupFileService.ts`)
 *  all write here. Never touches the SQLite database or any bird/document photo, since neither
 *  lives in this directory. */
export function clearTemporaryCache(): ClearCacheResult {
  const entries = Paths.cache.list();
  let fileCount = 0;
  let bytesFreed = 0;

  entries.forEach((entry) => {
    const size = entry.size ?? 0;
    try {
      entry.delete();
      fileCount += 1;
      bytesFreed += size;
    } catch (error) {
      // Best-effort: skip an entry that can't be removed rather than aborting the whole clear.
    }
  });

  return { fileCount, bytesFreed };
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) {
    return '0 KB';
  }
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
