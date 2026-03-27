import type {DeepgramWord} from '@app-types/speech';

export function normalizeSpeakerNumber(value?: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 1;
  }

  return Math.max(1, Math.min(3, value + 1));
}

export function getDominantSpeaker(words?: DeepgramWord[]): number {
  if (!words?.length) {
    return 1;
  }

  const counts = words.reduce<Record<number, number>>((accumulator, word) => {
    const normalizedSpeaker = normalizeSpeakerNumber(word.speaker);
    accumulator[normalizedSpeaker] = (accumulator[normalizedSpeaker] ?? 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0]
    ? Number(Object.entries(counts).sort((left, right) => right[1] - left[1])[0][0])
    : 1;
}

export function sanitizeTranscript(transcript: string): string {
  return transcript.replace(/\s+/g, ' ').trim();
}

export function deriveTitleFromItems(transcript: string): string {
  const trimmed = sanitizeTranscript(transcript);
  if (!trimmed) {
    return 'Untitled conversation';
  }

  return trimmed.length > 40 ? `${trimmed.slice(0, 40).trim()}...` : trimmed;
}