import {MMKV} from 'react-native-mmkv';
import type {ConversationItem, ConversationSession} from '@app-types/conversation';
import {defaultAppSettings, type AppSettings} from '@app-types/settings';

const storage = new MMKV({id: 'transapp-storage'});

const KEYS = {
  sessions: 'sessions',
  settings: 'settings'
} as const;

function readJson<T>(key: string, fallback: T): T {
  const rawValue = storage.getString(key);
  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}

function getItemsKey(sessionId: string): string {
  return `session:${sessionId}:items`;
}

export const storageService = {
  getSessions(): ConversationSession[] {
    const sessions = readJson<ConversationSession[]>(KEYS.sessions, []);
    return sessions.sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  },

  saveSessions(sessions: ConversationSession[]): void {
    writeJson(KEYS.sessions, sessions);
  },

  upsertSession(session: ConversationSession): ConversationSession[] {
    const sessions = this.getSessions().filter(item => item.id !== session.id);
    const updated = [session, ...sessions];
    this.saveSessions(updated);
    return updated;
  },

  getConversationItems(sessionId: string): ConversationItem[] {
    return readJson<ConversationItem[]>(getItemsKey(sessionId), []).sort(
      (left, right) =>
        new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime()
    );
  },

  saveConversationItems(sessionId: string, items: ConversationItem[]): void {
    writeJson(getItemsKey(sessionId), items);
  },

  saveCompletedConversation(
    session: ConversationSession,
    items: ConversationItem[]
  ): ConversationSession[] {
    this.saveConversationItems(session.id, items);
    return this.upsertSession(session);
  },

  getSettings(): AppSettings {
    return {
      ...defaultAppSettings,
      ...readJson<Partial<AppSettings>>(KEYS.settings, {})
    };
  },

  saveSettings(settings: AppSettings): void {
    writeJson(KEYS.settings, settings);
  }
};