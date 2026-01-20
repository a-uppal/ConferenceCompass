import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/services/supabase';
import { useTeam } from '@/hooks/useTeam';
import {
  ContentLibraryItem,
  ContentLibraryInsert,
  ContentCategory,
  UseContentLibraryReturn,
} from '@/types/campaign';

interface ContentLibraryContextType extends UseContentLibraryReturn {
  updateItem: (id: string, data: Partial<ContentLibraryItem>) => Promise<ContentLibraryItem>;
  deleteItem: (id: string) => Promise<void>;
  searchItems: (query: string) => ContentLibraryItem[];
  getMostUsed: (limit?: number) => ContentLibraryItem[];
}

const ContentLibraryContext = createContext<ContentLibraryContextType | undefined>(undefined);

interface ContentLibraryProviderProps {
  children: ReactNode;
}

export function ContentLibraryProvider({ children }: ContentLibraryProviderProps) {
  const { activeConference } = useTeam();
  const [items, setItems] = useState<ContentLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load items when conference changes
  useEffect(() => {
    if (activeConference) {
      loadItems();
    } else {
      setItems([]);
      setIsLoading(false);
    }
  }, [activeConference]);

  const loadItems = async () => {
    if (!activeConference) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('content_library')
        .select('*')
        .eq('conference_id', activeConference.id)
        .order('category', { ascending: true })
        .order('usage_count', { ascending: false });

      if (fetchError) throw fetchError;
      setItems(data || []);
    } catch (err) {
      console.error('[useContentLibrary] Error loading items:', err);
      setError(err instanceof Error ? err : new Error('Failed to load content library'));
    } finally {
      setIsLoading(false);
    }
  };

  const createItem = async (data: ContentLibraryInsert): Promise<ContentLibraryItem> => {
    const { data: item, error: createError } = await supabase
      .from('content_library')
      .insert(data)
      .select()
      .single();

    if (createError) throw createError;

    await loadItems();
    return item;
  };

  const updateItem = async (
    id: string,
    data: Partial<ContentLibraryItem>
  ): Promise<ContentLibraryItem> => {
    const { data: item, error: updateError } = await supabase
      .from('content_library')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    await loadItems();
    return item;
  };

  const deleteItem = async (id: string): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('content_library')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    await loadItems();
  };

  // Increment usage count when item is used
  const useItem = async (itemId: string): Promise<void> => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    await supabase
      .from('content_library')
      .update({
        usage_count: (item.usage_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId);

    await loadItems();
  };

  const refreshItems = async (): Promise<void> => {
    await loadItems();
  };

  // Filter helpers
  const getByCategory = useCallback(
    (category: ContentCategory): ContentLibraryItem[] => {
      return items.filter((i) => i.category === category);
    },
    [items]
  );

  const searchItems = useCallback(
    (query: string): ContentLibraryItem[] => {
      const lowerQuery = query.toLowerCase();
      return items.filter(
        (i) =>
          i.label.toLowerCase().includes(lowerQuery) ||
          i.content.toLowerCase().includes(lowerQuery) ||
          (i.source && i.source.toLowerCase().includes(lowerQuery))
      );
    },
    [items]
  );

  const getMostUsed = useCallback(
    (limit: number = 5): ContentLibraryItem[] => {
      return [...items]
        .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
        .slice(0, limit);
    },
    [items]
  );

  const value: ContentLibraryContextType = {
    items,
    isLoading,
    error,
    getByCategory,
    useItem,
    createItem,
    updateItem,
    deleteItem,
    refreshItems,
    searchItems,
    getMostUsed,
  };

  return (
    <ContentLibraryContext.Provider value={value}>
      {children}
    </ContentLibraryContext.Provider>
  );
}

export function useContentLibrary() {
  const context = useContext(ContentLibraryContext);
  if (context === undefined) {
    throw new Error('useContentLibrary must be used within a ContentLibraryProvider');
  }
  return context;
}
