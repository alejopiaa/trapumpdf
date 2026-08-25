import { useState, useCallback } from 'react';
import type { EditFileGroup } from '../services/pdfService';
import { revokeThumbnailUrl, clearFileBufferMap, syncFileBufferMap } from '../services/pdfService';

export function usePdfEdit() {
  const [editGroups, setEditGroups] = useState<EditFileGroup[]>([]);
  const [editViewMode, setEditViewMode] = useState<'grid' | 'list'>('grid');

  const handleToggleEditPageExcluded = useCallback((groupId: string, pageId: string) => {
    setEditGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          pages: g.pages.map((p) => (p.id === pageId ? { ...p, excluded: !p.excluded } : p)),
        };
      })
    );
  }, []);

  const handleRotateEditPage = useCallback((groupId: string, pageId: string) => {
    setEditGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          pages: g.pages.map((p) =>
            p.id === pageId ? { ...p, rotation: ((p.rotation || 0) + 90) % 360 } : p
          ),
        };
      })
    );
  }, []);

  const handleRemoveGroup = useCallback((groupId: string) => {
    setEditGroups((prev) => {
      const targetGroup = prev.find((g) => g.id === groupId);
      if (targetGroup) {
        targetGroup.pages.forEach((p) => {
          if (p.thumbnailUrl) revokeThumbnailUrl(p.thumbnailUrl);
        });
      }
      const remaining = prev.filter((g) => g.id !== groupId);
      const activeFileIds = new Set<string>();
      remaining.forEach((g) => g.pages.forEach((p) => activeFileIds.add(p.fileId)));
      syncFileBufferMap(activeFileIds);
      return remaining;
    });
  }, []);

  const handleMoveEditPage = useCallback((groupId: string, pageIdx: number, direction: 'left' | 'right') => {
    setEditGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const targetIdx = direction === 'left' ? pageIdx - 1 : pageIdx + 1;
        if (targetIdx < 0 || targetIdx >= g.pages.length) return g;
        const updated = [...g.pages];
        const [moved] = updated.splice(pageIdx, 1);
        updated.splice(targetIdx, 0, moved);
        return { ...g, pages: updated };
      })
    );
  }, []);

  const handleDropEditPage = useCallback((groupId: string, sourceIdx: number, targetIdx: number, position?: 'before' | 'after') => {
    setEditGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        if (sourceIdx < 0 || sourceIdx >= g.pages.length || targetIdx < 0 || targetIdx >= g.pages.length) return g;
        const updated = [...g.pages];
        const [moved] = updated.splice(sourceIdx, 1);
        let insertIdx = position === 'after' ? targetIdx + 1 : targetIdx;
        if (sourceIdx < insertIdx) insertIdx--;
        if (insertIdx < 0) insertIdx = 0;
        if (insertIdx > updated.length) insertIdx = updated.length;
        updated.splice(insertIdx, 0, moved);
        return { ...g, pages: updated };
      })
    );
  }, []);

  const handleSortEditPagesAZ = useCallback(() => {
    setEditGroups((prev) =>
      prev.map((g) => ({
        ...g,
        pages: [...g.pages].sort((a, b) => a.fileName.localeCompare(b.fileName, undefined, { numeric: true })),
      }))
    );
  }, []);

  const handleSortEditPagesZA = useCallback(() => {
    setEditGroups((prev) =>
      prev.map((g) => ({
        ...g,
        pages: [...g.pages].sort((a, b) => b.fileName.localeCompare(a.fileName, undefined, { numeric: true })),
      }))
    );
  }, []);

  const handleInvertEditPagesOrder = useCallback(() => {
    setEditGroups((prev) =>
      prev.map((g) => ({
        ...g,
        pages: [...g.pages].reverse(),
      }))
    );
  }, []);

  const handleResetEditPagesOrder = useCallback(() => {
    setEditGroups((prev) =>
      prev.map((g) => ({
        ...g,
        pages: [...g.pages].sort((a, b) => (a.originalIndex ?? 0) - (b.originalIndex ?? 0)),
      }))
    );
  }, []);

  const handleRemoveBlankPages = useCallback(() => {
    setEditGroups((prev) =>
      prev.map((g) => ({
        ...g,
        pages: g.pages.map((p) => (p.isBlank ? { ...p, excluded: true } : p)),
      }))
    );
  }, []);

  const handleRestoreAllPages = useCallback(() => {
    setEditGroups((prev) =>
      prev.map((g) => ({
        ...g,
        pages: g.pages.map((p) => ({ ...p, excluded: false, rotation: 0 })),
      }))
    );
  }, []);

  const clearEditState = useCallback(() => {
    setEditGroups((prev) => {
      prev.forEach((g) => {
        g.pages.forEach((p) => {
          if (p.thumbnailUrl) revokeThumbnailUrl(p.thumbnailUrl);
        });
      });
      return [];
    });
    setEditViewMode('grid');
    clearFileBufferMap();
  }, []);

  return {
    editGroups,
    setEditGroups,
    editViewMode,
    setEditViewMode,
    handleToggleEditPageExcluded,
    handleRotateEditPage,
    handleMoveEditPage,
    handleDropEditPage,
    handleRemoveGroup,
    handleSortEditPagesAZ,
    handleSortEditPagesZA,
    handleInvertEditPagesOrder,
    handleResetEditPagesOrder,
    handleRemoveBlankPages,
    handleRestoreAllPages,
    clearEditState,
  };
}
