export interface ConversationSession {
  id: string;
  title: string;
  createdAt: string;
}

export interface ConversationItem {
  id: string;
  sessionId: string;
  speakerNumber: number;
  nepaliText: string;
  hindiText: string;
  timestamp: string;
  translationStatus?: 'pending' | 'done' | 'failed';
}

export interface InterimTranscript {
  speakerNumber: number;
  nepaliText: string;
  hindiText?: string;
  timestamp: string;
}