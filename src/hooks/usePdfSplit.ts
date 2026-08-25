import { useState, useCallback } from 'react';
import type { PageItem } from '../services/pdfService';
import { revokeThumbnailUrl, clearFileBufferMap, syncFileBufferMap } from '../services/pdfService';

export function usePdfSplit() {
  const [splitMode, setSplitMode] = useState<'individual' | 'custom' | 'fixed'>('custom');
  const [splitViewMode, setSplitViewMode] = useState<'grid' | 'list'>('grid');
  const [customRanges, setCustomRanges] = useState<Array<{ start: number; end: number }>>([]);
  const [fixedSize, setFixedSize] = useState<number>(10);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
  const [draggedPageIdx, setDraggedPageIdx] = useState<number | null>(null);

  const initPages = useCallback((newPages: PageItem[]) => {
    setPages(newPages);
    setSelectedPageIds(new Set(newPages.map((p) => p.id)));
    setCustomRanges([{ start: 1, end: newPages.length }]);
    syncFileBufferMap(new Set(newPages.map((p) => p.fileId)));
  }, []);

  const handleTogglePageSelection = useCallback((pageId: string) => {
    setSelectedPageIds((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) next.delete(pageId);
      else next.add(pageId);
      return next;
    });
  }, []);

  const handleSelectAllPages = useCallback(() => {
    setSelectedPageIds(new Set(pages.map((p) => p.id)));
  }, [pages]);

  const handleDeselectAllPages = useCallback(() => {
    setSelectedPageIds(new Set());
  }, []);

  const handleRotatePage = useCallback((pageId: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId ? { ...p, rotation: ((p.rotation || 0) + 90) % 360 } : p
      )
    );
  }, []);

  const handleUpdateRange = useCallback((idx: number, range: { start: number; end: number }) => {
    setCustomRanges((prev) => {
      const next = [...prev];
      next[idx] = range;
      return next;
    });
  }, []);

  const handleAddRange = useCallback((range: { start: number; end: number }) => {
    setCustomRanges((prev) => [...prev, range]);
  }, []);

  const handleRemoveRange = useCallback((idx: number) => {
    setCustomRanges((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleSplitModeChange = useCallback((mode: string) => {
    setSplitMode(mode as 'individual' | 'custom' | 'fixed');
    setCustomRanges((prev) => {
      if (mode === 'custom' && prev.length === 0) {
        setPages((currentPages) => {
          if (currentPages.length > 0) {
            setCustomRanges([{ start: 1, end: currentPages.length }]);
          }
          return currentPages;
        });
      }
      return prev;
    });
  }, []);

  const handleMovePageItem = useCallback((idx: number, direction: 'left' | 'right') => {
    setPages((prev) => {
      const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  }, []);

  const handleDropPage = useCallback((targetIdx: number) => {
    setDraggedPageIdx((currDragged) => {
      if (currDragged === null || currDragged === targetIdx) return null;
      setPages((prev) => {
        const next = [...prev];
        const temp = next[currDragged];
        next.splice(currDragged, 1);
        next.splice(targetIdx, 0, temp);
        return next;
      });
      return null;
    });
  }, []);

  const clearSplitState = useCallback(() => {
    setPages((prev) => {
      prev.forEach((p) => {
        if (p.thumbnailUrl) revokeThumbnailUrl(p.thumbnailUrl);
      });
      return [];
    });
    setSelectedPageIds(new Set());
    setSplitMode('custom');
    setCustomRanges([]);
    setFixedSize(10);
    setDraggedPageIdx(null);
    clearFileBufferMap();
  }, []);

  const handleSelectEvenPages = useCallback(() => {
    const evenIds = pages
      .filter((_, idx) => (idx + 1) % 2 === 0)
      .map((p) => p.id);
    setSelectedPageIds((prev) => {
      const isAlreadyEven =
        evenIds.length > 0 &&
        prev.size === evenIds.length &&
        evenIds.every((id) => prev.has(id));
      return isAlreadyEven ? new Set() : new Set(evenIds);
    });
  }, [pages]);

  const handleSelectOddPages = useCallback(() => {
    const oddIds = pages
      .filter((_, idx) => (idx + 1) % 2 !== 0)
      .map((p) => p.id);
    setSelectedPageIds((prev) => {
      const isAlreadyOdd =
        oddIds.length > 0 &&
        prev.size === oddIds.length &&
        oddIds.every((id) => prev.has(id));
      return isAlreadyOdd ? new Set() : new Set(oddIds);
    });
  }, [pages]);

  return {
    splitMode,
    splitViewMode,
    setSplitViewMode,
    setSplitMode: handleSplitModeChange,
    customRanges,
    fixedSize,
    setFixedSize,
    pages,
    setPages,
    initPages,
    selectedPageIds,
    draggedPageIdx,
    setDraggedPageIdx,
    handleTogglePageSelection,
    handleSelectAllPages,
    handleDeselectAllPages,
    handleSelectEvenPages,
    handleSelectOddPages,
    handleRotatePage,
    handleMovePageItem,
    handleDropPage,
    handleAddRange,
    handleRemoveRange,
    handleUpdateRange,
    clearSplitState,
  };
}
