import AudioRecord from 'react-native-audio-record';
import {DeviceEventEmitter, type EmitterSubscription} from 'react-native';
import {toByteArray} from 'base64-js';
import {audioProcessingService} from '@services/audioProcessingService';
import type {
  DeepgramResultMessage,
  SpeechServiceCallbacks
} from '@app-types/speech';
import type {NoiseSuppressionMode} from '@app-types/settings';
import {getDominantSpeaker, sanitizeTranscript} from '@utils/transcript';

interface SpeechStartConfig {
  apiKey: string;
  noiseSuppressionMode: NoiseSuppressionMode;
}

class SpeechService {
  private audioSubscription?: EmitterSubscription;
  private callbacks?: SpeechServiceCallbacks;
  private currentNoiseMode: NoiseSuppressionMode = 'deepgram';
  private initialized = false;
  private isStreaming = false;
  private keepAliveInterval?: ReturnType<typeof setInterval>;
  private socket?: WebSocket;

  constructor() {
    this.audioSubscription = DeviceEventEmitter.addListener('data', (data: string) => {
      if (!this.isStreaming || this.socket?.readyState !== WebSocket.OPEN) {
        return;
      }

      const processed = audioProcessingService.preprocessChunk(
        toByteArray(data),
        this.currentNoiseMode
      );

      const payload = processed.slice().buffer;
      this.socket.send(payload);
    });
  }

  private initializeRecorder(): void {
    if (this.initialized) {
      return;
    }

    AudioRecord.init({
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 1,
      wavFile: 'transapp-live-stream.wav'
    });
    this.initialized = true;
  }

  private buildUrl(): string {
    const queryParams = [
      'encoding=linear16',
      'sample_rate=16000',
      'channels=1',
      'model=nova-2',
      'diarize=true',
      'interim_results=true',
      'punctuate=true',
      'smart_format=true',
      'endpointing=1000',
      'vad_events=true'
    ].join('&');

    return `wss://api.deepgram.com/v1/listen?${queryParams}`;
  }

  start(config: SpeechStartConfig, callbacks: SpeechServiceCallbacks): void {
    if (this.isStreaming) {
      return;
    }

    this.initializeRecorder();
    this.callbacks = callbacks;
    this.currentNoiseMode = config.noiseSuppressionMode;

    this.socket = new WebSocket(this.buildUrl(), undefined, {
      headers: {
        Authorization: `Token ${config.apiKey}`
      }
    });

    this.socket.onopen = async () => {
      try {
        this.isStreaming = true;
        await AudioRecord.start();

        this.keepAliveInterval = setInterval(() => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({type: 'KeepAlive'}));
          }
        }, 10000);

        this.callbacks?.onOpen();
      } catch (error) {
        this.callbacks?.onError(error as Error);
      }
    };

    this.socket.onmessage = event => {
      try {
        const message = JSON.parse(event.data) as DeepgramResultMessage;

        if (message.type === 'Error') {
          const details = JSON.stringify(message);
          this.callbacks?.onError(
            new Error(`Deepgram rejected the stream: ${details}`)
          );
          return;
        }

        const alternative = message.channel?.alternatives?.[0];
        const transcript = sanitizeTranscript(alternative?.transcript ?? '');

        if (!transcript) {
          return;
        }

        this.callbacks?.onTranscript({
          isFinal: Boolean(message.is_final),
          speakerNumber: getDominantSpeaker(alternative?.words),
          timestamp: message.created ?? new Date().toISOString(),
          transcript
        });
      } catch (error) {
        this.callbacks?.onError(error as Error);
      }
    };

    this.socket.onerror = (event: Event) => {
      const maybeErrorEvent = event as Event & {message?: string};
      const detail = maybeErrorEvent.message
        ? ` (${maybeErrorEvent.message})`
        : '';
      this.callbacks?.onError(
        new Error(`Deepgram streaming connection failed${detail}.`)
      );
    };

    this.socket.onclose = event => {
      if (this.keepAliveInterval) {
        clearInterval(this.keepAliveInterval);
        this.keepAliveInterval = undefined;
      }

      if (!this.isStreaming && event.code !== 1000) {
        const detail = event.reason
          ? `${event.code}: ${event.reason}`
          : `${event.code}`;
        this.callbacks?.onError(
          new Error(`Deepgram stream closed before start (${detail}).`)
        );
      }
      this.isStreaming = false;
      this.callbacks?.onClose();
    };
  }

  async stop(): Promise<string | undefined> {
    if (!this.socket && !this.isStreaming) {
      return undefined;
    }

    this.isStreaming = false;

    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = undefined;
    }

    const stopAudioPromise = AudioRecord.stop().catch(() => undefined);

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({type: 'Finalize'}));
      this.socket.send(JSON.stringify({type: 'CloseStream'}));
    }

    this.socket?.close();
    this.socket = undefined;

    try {
      const stopResult = await Promise.race([
        stopAudioPromise,
        new Promise<void>(resolve => {
          // Large recordings can take a few seconds to flush on some devices.
          setTimeout(() => resolve(), 12000);
        })
      ]);
      return typeof stopResult === 'string' ? stopResult : undefined;
    } catch {
      // Ignore duplicate stop attempts from the native module.
      return undefined;
    }
  }
}

export const speechService = new SpeechService();