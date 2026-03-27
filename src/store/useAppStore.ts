import {create} from 'zustand';
import {v4 as uuid} from 'uuid';
import type {
  ConversationItem,
  ConversationSession,
  InterimTranscript
} from '@app-types/conversation';
import type {ConnectionStatus, PermissionStatusValue} from '@app-types/speech';
import {defaultAppSettings, type AppSettings} from '@app-types/settings';
import {storageService} from '@database/storageService';
import {createSessionTitle} from '@utils/date';
import {deriveTitleFromItems} from '@utils/transcript';

interface AppState {
  activeSession?: ConversationSession;
  connectionStatus: ConnectionStatus;
  discardActiveSession: () => void;
  error?: string;
  initialized: boolean;
  interimTranscript?: InterimTranscript;
  isListening: boolean;
  permissionStatus: PermissionStatusValue;
  sessionItems: Record<string, ConversationItem[]>;
  sessions: ConversationSession[];
  settings: AppSettings;
  addLiveItem: (
    item: Omit<ConversationItem, 'id' | 'sessionId'> & {id?: string}
  ) => string;
  clearError: () => void;
  clearInterimTranscript: () => void;
  finalizeActiveSession: () => ConversationSession | undefined;
  hydrate: () => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setError: (message?: string) => void;
  setInterimTranscript: (item?: InterimTranscript) => void;
  setPermissionStatus: (status: PermissionStatusValue) => void;
  setSessionItems: (sessionId: string, items: ConversationItem[]) => void;
  startSession: (title?: string) => ConversationSession;
  updateItem: (itemId: string, patch: Partial<ConversationItem>) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  connectionStatus: 'idle',
  initialized: false,
  isListening: false,
  permissionStatus: 'unknown',
  sessionItems: {},
  sessions: [],
  settings: defaultAppSettings,

  hydrate: () => {
    const sessions = storageService.getSessions();
    const sessionItems = sessions.reduce<Record<string, ConversationItem[]>>(
      (accumulator, session) => {
        accumulator[session.id] = storageService.getConversationItems(session.id);
        return accumulator;
      },
      {}
    );

    set({
      initialized: true,
      sessionItems,
      sessions,
      settings: storageService.getSettings()
    });
  },

  setPermissionStatus: status => set({permissionStatus: status}),
  setConnectionStatus: status => set({connectionStatus: status}),
  setError: message => set({error: message, connectionStatus: message ? 'error' : get().connectionStatus}),
  clearError: () => set({error: undefined}),
  discardActiveSession: () =>
    set(state => {
      const activeSessionId = state.activeSession?.id;
      if (!activeSessionId) {
        return {
          activeSession: undefined,
          connectionStatus: 'idle' as const,
          interimTranscript: undefined,
          isListening: false
        };
      }

      const nextItems = {...state.sessionItems};
      delete nextItems[activeSessionId];

      return {
        activeSession: undefined,
        connectionStatus: 'idle' as const,
        interimTranscript: undefined,
        isListening: false,
        sessionItems: nextItems
      };
    }),
  setInterimTranscript: item => set({interimTranscript: item}),
  clearInterimTranscript: () => set({interimTranscript: undefined}),

  startSession: title => {
    const createdAt = new Date().toISOString();
    const session: ConversationSession = {
      id: uuid(),
      title: title ?? createSessionTitle(createdAt),
      createdAt
    };

    set(state => ({
      activeSession: session,
      connectionStatus: 'connecting',
      error: undefined,
      interimTranscript: undefined,
      isListening: true,
      sessionItems: {...state.sessionItems, [session.id]: []}
    }));

    return session;
  },

  addLiveItem: item => {
    const activeSession = get().activeSession;
    if (!activeSession) {
      throw new Error('Cannot append live item without an active session.');
    }

    const nextItem: ConversationItem = {
      id: item.id ?? uuid(),
      ...item,
      sessionId: activeSession.id,
      translationStatus: item.translationStatus ?? 'pending'
    };

    set(state => ({
      sessionItems: {
        ...state.sessionItems,
        [activeSession.id]: [...(state.sessionItems[activeSession.id] ?? []), nextItem]
      }
    }));

    return nextItem.id;
  },

  updateItem: (itemId, patch) => {
    const activeSession = get().activeSession;
    const sessionId = patch.sessionId ?? activeSession?.id;
    if (!sessionId) {
      return;
    }

    set(state => ({
      sessionItems: {
        ...state.sessionItems,
        [sessionId]: (state.sessionItems[sessionId] ?? []).map(item =>
          item.id === itemId ? {...item, ...patch} : item
        )
      }
    }));
  },

  finalizeActiveSession: () => {
    const {activeSession, sessionItems, settings} = get();
    if (!activeSession) {
      set({connectionStatus: 'idle', isListening: false});
      return undefined;
    }

    const items = sessionItems[activeSession.id] ?? [];
    const firstTranscript = items[0]?.nepaliText ?? '';
    const updatedSession = {
      ...activeSession,
      title:
        settings.autoTitleSessions && firstTranscript
          ? deriveTitleFromItems(firstTranscript)
          : activeSession.title
    };

    const sessions = storageService.saveCompletedConversation(updatedSession, items);

    set(state => ({
      activeSession: undefined,
      connectionStatus: 'idle',
      interimTranscript: undefined,
      isListening: false,
      sessions,
      sessionItems: {
        ...state.sessionItems,
        [updatedSession.id]: items
      }
    }));

    return updatedSession;
  },

  setSessionItems: (sessionId, items) =>
    set(state => ({sessionItems: {...state.sessionItems, [sessionId]: items}})),

  updateSettings: patch => {
    const nextSettings = {...get().settings, ...patch};
    storageService.saveSettings(nextSettings);
    set({settings: nextSettings});
  }
}));