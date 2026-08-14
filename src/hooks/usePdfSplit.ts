import { useState, useCallback } from 'react';
import type { PageItem } from '../services/pdfService';
import { revokeThumbnailUrl } from '../services/pdfService';

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
    setPages((prevPages) => {
      setSelectedPageIds(new Set(prevPages.map((p) => p.id)));
      return prevPages;
    });
  }, []);

  const handleDeselectAllPages = useCallback(() => {
    setSelectedPageIds(new Set());
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
  }, []);

  const handleSelectEvenPages = useCallback(() => {
    setPages((prevPages) => {
      const evenIds = prevPages
        .filter((_, idx) => (idx + 1) % 2 === 0)
        .map((p) => p.id);
      setSelectedPageIds((prevSelected) => {
        const isAlreadyAllEven =
          evenIds.length > 0 &&
          prevSelected.size === evenIds.length &&
          evenIds.every((id) => prevSelected.has(id));
        return isAlreadyAllEven ? new Set() : new Set(evenIds);
      });
      return prevPages;
    });
  }, []);

  const handleSelectOddPages = useCallback(() => {
    setPages((prevPages) => {
      const oddIds = prevPages
        .filter((_, idx) => (idx + 1) % 2 !== 0)
        .map((p) => p.id);
      setSelectedPageIds((prevSelected) => {
        const isAlreadyAllOdd =
          oddIds.length > 0 &&
          prevSelected.size === oddIds.length &&
          oddIds.every((id) => prevSelected.has(id));
        return isAlreadyAllOdd ? new Set() : new Set(oddIds);
      });
      return prevPages;
    });
  }, []);

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
    handleUpdateRange,
    handleAddRange,
    handleRemoveRange,
    handleMovePageItem,
    handleDropPage,
    clearSplitState,
  };
}
