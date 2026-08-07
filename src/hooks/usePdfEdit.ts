import { useState, useCallback } from 'react';
import type { EditFileGroup } from '../services/pdfService';
import { revokeThumbnailUrl } from '../services/pdfService';

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
      return prev.filter((g) => g.id !== groupId);
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

  const handleDropEditPage = useCallback((groupId: string, sourceIdx: number, targetIdx: number) => {
    setEditGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        if (sourceIdx < 0 || sourceIdx >= g.pages.length || targetIdx < 0 || targetIdx >= g.pages.length) return g;
        const updated = [...g.pages];
        const [moved] = updated.splice(sourceIdx, 1);
        updated.splice(targetIdx, 0, moved);
        return { ...g, pages: updated };
      })
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
    clearEditState,
  };
}
