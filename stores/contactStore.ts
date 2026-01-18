import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import { Contact } from '@/types/database';

interface ContactFilters {
  search: string;
  followUpStatus: 'all' | 'none' | 'pending' | 'completed';
  capturedBy: string | null;
  dateRange: 'all' | 'today' | 'week';
}

interface ContactState {
  contacts: Contact[];
  pendingContacts: Contact[]; // Offline queue
  isLoading: boolean;
  error: string | null;
  filters: ContactFilters;

  // Actions
  setFilters: (filters: Partial<ContactFilters>) => void;
  loadContacts: (conferenceId: string) => Promise<void>;
  addContact: (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => Promise<Contact>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  syncPendingContacts: () => Promise<void>;
  getFilteredContacts: () => Contact[];
}

export const useContactStore = create<ContactState>()(
  persist(
    (set, get) => ({
      contacts: [],
      pendingContacts: [],
      isLoading: false,
      error: null,
      filters: {
        search: '',
        followUpStatus: 'all',
        capturedBy: null,
        dateRange: 'all',
      },

      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      loadContacts: async (conferenceId: string) => {
        set({ isLoading: true, error: null });

        try {
          const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .eq('conference_id', conferenceId)
            .order('created_at', { ascending: false });

          if (error) throw error;

          set({ contacts: data || [], isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      addContact: async (contactData) => {
        set({ isLoading: true, error: null });

        try {
          const { data, error } = await supabase
            .from('contacts')
            .insert(contactData)
            .select()
            .single();

          if (error) throw error;

          set((state) => ({
            contacts: [data, ...state.contacts],
            isLoading: false,
          }));

          // Log activity
          await supabase.from('team_activities').insert({
            team_id: contactData.conference_id, // Will need to get team_id from conference
            conference_id: contactData.conference_id,
            user_id: contactData.captured_by,
            activity_type: 'contact_captured',
            entity_id: data.id,
            description: `Captured contact: ${contactData.first_name} ${contactData.last_name}`,
          });

          return data;
        } catch (error: any) {
          // If offline, queue for later sync
          if (error.message?.includes('network') || error.message?.includes('offline')) {
            const tempId = `temp-${Date.now()}`;
            const tempContact = {
              ...contactData,
              id: tempId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as Contact;

            set((state) => ({
              contacts: [tempContact, ...state.contacts],
              pendingContacts: [...state.pendingContacts, tempContact],
              isLoading: false,
            }));

            return tempContact;
          }

          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateContact: async (id: string, updates: Partial<Contact>) => {
        set({ isLoading: true, error: null });

        try {
          const { error } = await supabase
            .from('contacts')
            .update(updates)
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            contacts: state.contacts.map((c) =>
              c.id === id ? { ...c, ...updates } : c
            ),
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      deleteContact: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            contacts: state.contacts.filter((c) => c.id !== id),
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      syncPendingContacts: async () => {
        const { pendingContacts } = get();
        if (pendingContacts.length === 0) return;

        for (const contact of pendingContacts) {
          try {
            const { id, created_at, updated_at, ...contactData } = contact;

            const { data, error } = await supabase
              .from('contacts')
              .insert(contactData)
              .select()
              .single();

            if (!error && data) {
              set((state) => ({
                contacts: state.contacts.map((c) =>
                  c.id === id ? data : c
                ),
                pendingContacts: state.pendingContacts.filter(
                  (c) => c.id !== id
                ),
              }));
            }
          } catch (error) {
            console.error('Error syncing contact:', error);
          }
        }
      },

      getFilteredContacts: () => {
        const { contacts, filters } = get();

        return contacts.filter((contact) => {
          // Search filter
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch =
              contact.first_name.toLowerCase().includes(searchLower) ||
              contact.last_name.toLowerCase().includes(searchLower) ||
              contact.company?.toLowerCase().includes(searchLower) ||
              contact.email?.toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
          }

          // Follow-up status filter
          if (filters.followUpStatus !== 'all') {
            if (contact.follow_up_status !== filters.followUpStatus) return false;
          }

          // Captured by filter
          if (filters.capturedBy) {
            if (contact.captured_by !== filters.capturedBy) return false;
          }

          // Date range filter
          if (filters.dateRange !== 'all') {
            const contactDate = new Date(contact.created_at);
            const now = new Date();

            if (filters.dateRange === 'today') {
              const startOfDay = new Date(now.setHours(0, 0, 0, 0));
              if (contactDate < startOfDay) return false;
            } else if (filters.dateRange === 'week') {
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              if (contactDate < weekAgo) return false;
            }
          }

          return true;
        });
      },
    }),
    {
      name: 'contact-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        pendingContacts: state.pendingContacts,
      }),
    }
  )
);
