import type {NoiseSuppressionMode} from '@app-types/settings';

export const audioProcessingService = {
  preprocessChunk(chunk: Uint8Array, mode: NoiseSuppressionMode): Uint8Array {
    switch (mode) {
      case 'deepgram':
        return chunk;
      case 'webrtc':
      case 'rnnoise':
        return chunk;
      default:
        return chunk;
    }
  }
};