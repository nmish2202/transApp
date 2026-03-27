import RNFS from 'react-native-fs';
import type {ConversationItem} from '@app-types/conversation';

interface WhisperSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface WhisperResponse {
  text: string;
  language: string;
  duration: number;
  segments?: WhisperSegment[];
}

interface BatchTranscribeParams {
  apiKey: string;
  filePath: string;
  sessionId: string;
}

export const batchTranscriptionService = {
  async transcribeSessionAudio({
    apiKey,
    filePath,
    sessionId
  }: BatchTranscribeParams): Promise<Array<Omit<ConversationItem, 'hindiText'>>> {
    // Verify file exists and has content
    const stat = await RNFS.stat(filePath);
    if (!stat.size) {
      throw new Error('Recorded audio file is empty.');
    }

    // React Native FormData with file URI
    const formData = new FormData();
    formData.append('file', {
      uri: filePath.startsWith('file://') ? filePath : `file://${filePath}`,
      type: 'audio/wav',
      name: 'audio.wav'
    } as unknown as Blob);
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'ne');
    formData.append('response_format', 'verbose_json');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Groq Whisper transcription failed (${response.status}): ${errorBody}`);
    }

    const data = (await response.json()) as WhisperResponse;
    const transcript = (data.text ?? '').trim();

    // Use the full transcript as a single turn instead of segments
    // Whisper segments often overlap/repeat content
    if (!transcript) {
      return [];
    }

    return [
      {
        id: `${sessionId}-1`,
        nepaliText: transcript,
        sessionId,
        speakerNumber: 1,
        timestamp: new Date().toISOString(),
        translationStatus: 'pending' as const
      }
    ];
  }
};