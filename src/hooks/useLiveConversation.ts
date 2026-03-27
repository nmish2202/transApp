import {useRef} from 'react';
import {batchTranscriptionService} from '@services/batchTranscriptionService';
import {speechService} from '@services/speechService';
import {translationService} from '@services/translationService';
import {useMicrophonePermission} from '@hooks/useMicrophonePermission';
import {useAppStore} from '@store/useAppStore';
import {env} from '@utils/env';

export function useLiveConversation() {
  const permission = useMicrophonePermission();
  const finalTranslateTokenRef = useRef<Record<string, number>>({});
  const interimTranslateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interimTranslateTokenRef = useRef(0);
  const {
    addLiveItem,
    clearInterimTranscript,
    discardActiveSession,
    finalizeActiveSession,
    setConnectionStatus,
    setError,
    setInterimTranscript,
    setPermissionStatus,
    settings,
    startSession,
    updateItem
  } = useAppStore();

  function queueFinalTranslation(itemId: string, nepaliText: string, googleApiKey: string) {
    const nextToken = (finalTranslateTokenRef.current[itemId] ?? 0) + 1;
    finalTranslateTokenRef.current[itemId] = nextToken;

    translationService
      .translateNepaliToHindi({apiKey: googleApiKey, text: nepaliText})
      .then(translatedText => {
        if (finalTranslateTokenRef.current[itemId] !== nextToken) {
          return;
        }
        updateItem(itemId, {
          hindiText: translatedText,
          translationStatus: 'done'
        });
      })
      .catch(() => {
        if (finalTranslateTokenRef.current[itemId] !== nextToken) {
          return;
        }
        updateItem(itemId, {
          hindiText: 'Translation failed. Tap export later to keep source text.',
          translationStatus: 'failed'
        });
      });
  }

  async function ensurePermission(): Promise<boolean> {
    const current = await permission.checkPermission();
    if (current === 'granted') {
      setPermissionStatus(current);
      return true;
    }

    const next = await permission.requestPermission();
    setPermissionStatus(next);
    return next === 'granted';
  }

  async function startListening(): Promise<void> {
    const granted = await ensurePermission();
    if (!granted) {
      setError('Microphone permission is required to start live listening.');
      return;
    }

    const deepgramApiKey =
      settings.deepgramApiKeyOverride?.trim() || env.deepgramApiKey;
    const groqApiKey =
      settings.groqApiKeyOverride?.trim() || env.groqApiKey;

    if (!groqApiKey) {
      setError('Add a Groq API key in Settings or the .env file (GROQ_API_KEY). Get one free at console.groq.com.');
      return;
    }

    if (!deepgramApiKey) {
      setError('Add a Deepgram API key in Settings or the .env file for live streaming.');
      return;
    }

    startSession();

    try {
      speechService.start(
        {
          apiKey: deepgramApiKey,
          noiseSuppressionMode: settings.noiseSuppressionMode
        },
        {
          onOpen: () => {
            setConnectionStatus('listening');
            setError(undefined);
          },
          onClose: () => {
            setConnectionStatus('idle');
          },
          onError: error => {
            void speechService.stop();
            discardActiveSession();
            setError(error.message);
          },
          onTranscript: event => {
            if (!event.isFinal) {
              const googleApiKey =
                settings.googleTranslateApiKeyOverride?.trim() || env.googleTranslateApiKey;

              setInterimTranscript({
                nepaliText: event.transcript,
                speakerNumber: event.speakerNumber,
                timestamp: event.timestamp,
                hindiText: googleApiKey ? 'Translating live...' : 'Google Translate API key missing.'
              });

              if (interimTranslateDebounceRef.current) {
                clearTimeout(interimTranslateDebounceRef.current);
              }

              if (googleApiKey) {
                const token = ++interimTranslateTokenRef.current;
                interimTranslateDebounceRef.current = setTimeout(() => {
                  translationService
                    .translateNepaliToHindi({apiKey: googleApiKey, text: event.transcript})
                    .then(translatedText => {
                      if (token !== interimTranslateTokenRef.current) {
                        return;
                      }
                      setInterimTranscript({
                        nepaliText: event.transcript,
                        speakerNumber: event.speakerNumber,
                        timestamp: event.timestamp,
                        hindiText: translatedText
                      });
                    })
                    .catch(() => {
                      if (token !== interimTranslateTokenRef.current) {
                        return;
                      }
                      setInterimTranscript({
                        nepaliText: event.transcript,
                        speakerNumber: event.speakerNumber,
                        timestamp: event.timestamp,
                        hindiText: 'Live translation failed.'
                      });
                    });
                }, 450);
              }

              return;
            }

            clearInterimTranscript();
            interimTranslateTokenRef.current += 1;
            if (interimTranslateDebounceRef.current) {
              clearTimeout(interimTranslateDebounceRef.current);
            }

            const googleApiKey =
              settings.googleTranslateApiKeyOverride?.trim() || env.googleTranslateApiKey;

            const storeState = useAppStore.getState();
            const activeSession = storeState.activeSession;
            const currentItems = activeSession
              ? storeState.sessionItems[activeSession.id] ?? []
              : [];
            const lastItem = currentItems[currentItems.length - 1];
            const shouldMergeWithLast =
              Boolean(lastItem) &&
              lastItem.speakerNumber === event.speakerNumber &&
              new Date(event.timestamp).getTime() - new Date(lastItem.timestamp).getTime() <= 6000;

            const targetItemId = shouldMergeWithLast
              ? (lastItem as NonNullable<typeof lastItem>).id
              : addLiveItem({
                  hindiText: '',
                  nepaliText: event.transcript,
                  speakerNumber: event.speakerNumber,
                  timestamp: event.timestamp,
                  translationStatus: 'pending'
                });

            if (shouldMergeWithLast && lastItem) {
              const mergedNepaliText = `${lastItem.nepaliText} ${event.transcript}`
                .replace(/\s+/g, ' ')
                .trim();
              updateItem(targetItemId, {
                nepaliText: mergedNepaliText,
                timestamp: event.timestamp,
                translationStatus: 'pending'
              });
            }

            if (!googleApiKey) {
              updateItem(targetItemId, {
                hindiText: 'Google Translate API key missing.',
                translationStatus: 'failed'
              });
              return;
            }

            const latestState = useAppStore.getState();
            const latestSession = latestState.activeSession;
            const latestItems = latestSession
              ? latestState.sessionItems[latestSession.id] ?? []
              : [];
            const targetItem = latestItems.find(item => item.id === targetItemId);
            queueFinalTranslation(
              targetItemId,
              targetItem?.nepaliText ?? event.transcript,
              googleApiKey
            );
          }
        }
      );
    } catch (error) {
      discardActiveSession();
      setError((error as Error).message);
    }
  }

  async function stopListening(): Promise<string | undefined> {
    setConnectionStatus('stopping');

    const recordingPath = await speechService.stop();

    const activeState = useAppStore.getState();
    const activeSession = activeState.activeSession;
    const groqApiKey =
      activeState.settings.groqApiKeyOverride?.trim() || env.groqApiKey;
    const googleApiKey =
      activeState.settings.googleTranslateApiKeyOverride?.trim() || env.googleTranslateApiKey;

    if (activeSession && !recordingPath) {
      setError('Recorded audio was not finalized. Please try again and wait 1-2 seconds before pressing Stop.');
    }

    if (activeSession && recordingPath && groqApiKey) {
      try {
        const turns = await batchTranscriptionService.transcribeSessionAudio({
          apiKey: groqApiKey,
          filePath: recordingPath,
          sessionId: activeSession.id
        });

        if (!turns.length) {
          setError('No speech was detected in the recording. Try speaking louder or closer to the microphone.');
          const session = finalizeActiveSession();
          return session?.id;
        }

        const translatedTurns = await Promise.all(
          turns.map(async turn => {
            if (!googleApiKey) {
              return {
                ...turn,
                hindiText: 'Google Translate API key missing.',
                translationStatus: 'failed' as const
              };
            }

            try {
              const hindiText = await translationService.translateNepaliToHindi({
                apiKey: googleApiKey,
                text: turn.nepaliText
              });
              return {
                ...turn,
                hindiText,
                translationStatus: 'done' as const
              };
            } catch {
              return {
                ...turn,
                hindiText: 'Translation failed for this segment.',
                translationStatus: 'failed' as const
              };
            }
          })
        );

        if (translatedTurns.length) {
          useAppStore.getState().setSessionItems(activeSession.id, translatedTurns);
        }
      } catch (error) {
        setError((error as Error).message);
      }
    }

    const session = finalizeActiveSession();
    return session?.id;
  }

  return {
    startListening,
    stopListening
  };
}