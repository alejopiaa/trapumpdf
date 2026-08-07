import { useState, useCallback } from 'react';
import type { CompressFileItem, CompressionOptions } from '../services/pdfService';
import { revokeThumbnailUrl } from '../services/pdfService';

export function usePdfCompress() {
  const [compressItems, setCompressItems] = useState<CompressFileItem[]>([]);
  const [compressViewMode, setCompressViewMode] = useState<'grid' | 'list'>('grid');
  const [draggedCompressIdx, setDraggedCompressIdx] = useState<number | null>(null);
  const [compressionOptions, setCompressionOptions] = useState<CompressionOptions>({
    level: 'recommended',
    jpegQuality: 0.7,
    scaleFactor: 0.85,
  });

  const handleMoveCompressItem = useCallback((idx: number, direction: 'left' | 'right') => {
    setCompressItems((prev) => {
      const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  }, []);

  const handleDropCompress = useCallback((targetIdx: number) => {
    setDraggedCompressIdx((currDragged) => {
      if (currDragged === null || currDragged === targetIdx) return null;
      setCompressItems((prev) => {
        const next = [...prev];
        const temp = next[currDragged];
        next.splice(currDragged, 1);
        next.splice(targetIdx, 0, temp);
        return next;
      });
      return null;
    });
  }, []);

  const handleRemoveCompressItem = useCallback((idx: number) => {
    setCompressItems((prev) => {
      const target = prev[idx];
      if (target?.thumbnailUrl) revokeThumbnailUrl(target.thumbnailUrl);
      return prev.filter((_, i) => i !== idx);
    });
  }, []);

  const clearCompressState = useCallback(() => {
    setCompressItems((prev) => {
      prev.forEach((item) => {
        if (item.thumbnailUrl) revokeThumbnailUrl(item.thumbnailUrl);
      });
      return [];
    });
    setCompressViewMode('grid');
    setDraggedCompressIdx(null);
  }, []);

  return {
    compressItems,
    setCompressItems,
    compressViewMode,
    setCompressViewMode,
    draggedCompressIdx,
    setDraggedCompressIdx,
    compressionOptions,
    setCompressionOptions,
    handleMoveCompressItem,
    handleDropCompress,
    handleRemoveCompressItem,
    clearCompressState,
  };
}
