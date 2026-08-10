import { useState, useCallback } from 'react';
import type { MergeFileItem } from '../services/pdfService';
import { revokeThumbnailUrl } from '../services/pdfService';

export function usePdfMerge() {
  const [mergeFiles, setMergeFiles] = useState<MergeFileItem[]>([]);
  const [mergeViewMode, setMergeViewMode] = useState<'grid' | 'list'>('grid');
  const [draggedMergeIdx, setDraggedMergeIdx] = useState<number | null>(null);

  const handleMoveMergeItem = useCallback((idx: number, direction: 'left' | 'right') => {
    setMergeFiles((prev) => {
      const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  }, []);

  const handleDropMerge = useCallback((fromIdx: number, toIdx: number) => {
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) {
      setDraggedMergeIdx(null);
      return;
    }
    setMergeFiles((prev) => {
      if (fromIdx >= prev.length || toIdx >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, item);
      return next;
    });
    setDraggedMergeIdx(null);
  }, []);

  const handleRemoveMergeItem = useCallback((idx: number) => {
    setMergeFiles((prev) => {
      const target = prev[idx];
      if (target?.thumbnailUrl) {
        revokeThumbnailUrl(target.thumbnailUrl);
      }
      return prev.filter((_, i) => i !== idx);
    });
  }, []);

  const handleSortMergeFilesAZ = useCallback(() => {
    setMergeFiles((prev) =>
      [...prev].sort((a, b) => a.file.name.localeCompare(b.file.name, undefined, { numeric: true }))
    );
  }, []);

  const handleSortMergeFilesZA = useCallback(() => {
    setMergeFiles((prev) =>
      [...prev].sort((a, b) => b.file.name.localeCompare(a.file.name, undefined, { numeric: true }))
    );
  }, []);

  const handleInvertMergeFiles = useCallback(() => {
    setMergeFiles((prev) => [...prev].reverse());
  }, []);

  const handleResetMergeFiles = useCallback(() => {
    setMergeFiles((prev) =>
      [...prev].sort((a, b) => a.originalIndex - b.originalIndex)
    );
  }, []);

  const clearMergeState = useCallback(() => {
    setMergeFiles((prev) => {
      prev.forEach((item) => {
        if (item.thumbnailUrl) revokeThumbnailUrl(item.thumbnailUrl);
      });
      return [];
    });
    setDraggedMergeIdx(null);
    setMergeViewMode('grid');
  }, []);

  return {
    mergeFiles,
    setMergeFiles,
    mergeViewMode,
    setMergeViewMode,
    draggedMergeIdx,
    setDraggedMergeIdx,
    handleMoveMergeItem,
    handleDropMerge,
    handleRemoveMergeItem,
    handleSortMergeFilesAZ,
    handleSortMergeFilesZA,
    handleInvertMergeFiles,
    handleResetMergeFiles,
    clearMergeState,
  };
}
