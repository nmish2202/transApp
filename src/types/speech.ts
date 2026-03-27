export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'stopping'
  | 'error';

export type PermissionStatusValue =
  | 'unknown'
  | 'granted'
  | 'denied'
  | 'blocked'
  | 'unavailable';

export interface DeepgramWord {
  speaker?: number;
  punctuated_word?: string;
  word?: string;
}

export interface DeepgramAlternative {
  transcript: string;
  confidence?: number;
  words?: DeepgramWord[];
}

export interface DeepgramResultMessage {
  type?: string;
  is_final?: boolean;
  channel?: {
    alternatives?: DeepgramAlternative[];
  };
  created?: string;
}

export interface SpeechTranscriptEvent {
  isFinal: boolean;
  speakerNumber: number;
  transcript: string;
  timestamp: string;
}

export interface SpeechServiceCallbacks {
  onOpen: () => void;
  onClose: () => void;
  onError: (error: Error) => void;
  onTranscript: (event: SpeechTranscriptEvent) => void;
}