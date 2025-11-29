/**
 * Types related to export operations
 */

export interface ExportProgress {
  current: number;
  total: number;
  stage: 'rendering' | 'assembling' | 'finalizing';
  percentComplete: number;
  estimatedTimeRemaining?: number; // milliseconds
}

export interface ExportOptions {
  concurrency?: number;
  backgroundColor?: string;
  onProgress?: (progress: ExportProgress) => void;
  onStageChange?: (stage: ExportProgress['stage']) => void;
  abortSignal?: AbortSignal;
}

export interface BatchExportResult {
  images: string[];
  duration: number;
  cardsProcessed: number;
  errorCount: number;
}
