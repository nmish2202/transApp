import {useEffect, useMemo, useRef, useState} from 'react'
import type {ChangeEvent, Dispatch, SetStateAction} from 'react'
import './App.css'

type TranslationStatus = 'done' | 'failed'

interface Turn {
  id: string
  speakerNumber: number
  nepaliText: string
  hindiText: string
  translationStatus: TranslationStatus
}

interface Session {
  id: string
  title: string
  createdAt: string
  durationSec: number
  turns: Turn[]
}

interface WhisperSegment {
  id: number
  start: number
  end: number
  text: string
}

interface WhisperResponse {
  text: string
  language: string
  duration: number
  segments?: WhisperSegment[]
}

interface TranscriptionResult {
  attempt: string
  transcript: string
  turns: Array<Omit<Turn, 'hindiText' | 'translationStatus'>>
}

async function translateText(text: string, _googleKey: string): Promise<string> {
  const groqKey = import.meta.env.VITE_GROQ_API_KEY as string
  if (!groqKey) throw new Error('No Groq API key')

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${groqKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'Translate Nepali to casual Hindi (UP style). Rules:\n- Use आम बोलचाल वाली हिंदी like people speak in Lucknow/Kanpur\n- Use तुम/तू instead of आप, बोलो instead of कहिए, ये instead of यह\n- No formal/literary words. No Sanskrit-heavy words.\n- Write in Devanagari script\n- Give ONLY ONE translation. No explanations, no alternatives, no notes.'
        },
        { role: 'user', content: text }
      ],
      temperature: 0.3,
      max_tokens: 1024
    })
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Translation failed: ${body}`)
  }

  const data = (await response.json()) as {
    choices?: Array<{message?: {content?: string}}>
  }

  return data.choices?.[0]?.message?.content?.trim() ?? text
}

async function transcribeWithWhisper(
  blob: Blob,
  groqKey: string,
  language = 'ne'
): Promise<TranscriptionResult> {
  const formData = new FormData()
  formData.append('file', blob, 'audio.wav')
  formData.append('model', 'whisper-large-v3')
  formData.append('language', language)
  formData.append('response_format', 'verbose_json')

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${groqKey}`
    },
    body: formData
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Groq Whisper transcription failed (${response.status}): ${body}`)
  }

  const data = (await response.json()) as WhisperResponse
  const transcript = (data.text ?? '').trim()
  const segments = data.segments ?? []
  const turns: Array<Omit<Turn, 'hindiText' | 'translationStatus'>> = []

  for (const seg of segments) {
    const text = seg.text.trim()
    if (!text) {
      continue
    }

    turns.push({
      id: crypto.randomUUID(),
      speakerNumber: 1,
      nepaliText: text
    })
  }

  if (!turns.length && transcript) {
    turns.push({
      id: crypto.randomUUID(),
      speakerNumber: 1,
      nepaliText: transcript
    })
  }

  return {
    attempt: `whisper-${language}`,
    transcript,
    turns
  }
}

function writePcmToWavBuffer(pcm: Int16Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + pcm.length * 2)
  const view = new DataView(buffer)

  const write = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i))
    }
  }

  write(0, 'RIFF')
  view.setUint32(4, 36 + pcm.length * 2, true)
  write(8, 'WAVE')
  write(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  write(36, 'data')
  view.setUint32(40, pcm.length * 2, true)

  for (let i = 0; i < pcm.length; i += 1) {
    view.setInt16(44 + i * 2, pcm[i], true)
  }

  return buffer
}

function buildNormalizedWav(
  floatChunks: Float32Array[],
  inputSampleRate: number,
  targetSampleRate = 16000
): {blob: Blob} {
  let total = 0
  for (const chunk of floatChunks) {
    total += chunk.length
  }

  const merged = new Float32Array(total)
  let off = 0
  for (const chunk of floatChunks) {
    merged.set(chunk, off)
    off += chunk.length
  }

  // Normalize: find RMS-based gain so quiet playback-near-mic audio is boosted
  let sumSq = 0
  for (let i = 0; i < merged.length; i += 1) {
    sumSq += merged[i] * merged[i]
  }
  const rms = Math.sqrt(sumSq / merged.length)
  const targetRms = 0.15
  const gain = rms > 0 ? Math.min(20, targetRms / rms) : 1

  const ratio = inputSampleRate / targetSampleRate
  const outLen = Math.max(1, Math.floor(merged.length / ratio))
  const pcm = new Int16Array(outLen)

  for (let outIdx = 0; outIdx < outLen; outIdx += 1) {
    const start = Math.floor(outIdx * ratio)
    const end = Math.min(merged.length, Math.floor((outIdx + 1) * ratio))
    let sum = 0
    let count = 0
    for (let i = start; i < end; i += 1) {
      sum += merged[i]
      count += 1
    }
    const val = (count ? sum / count : 0) * gain
    const clamped = Math.max(-1, Math.min(1, val))
    pcm[outIdx] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff
  }

  const wavBuffer = writePcmToWavBuffer(pcm, targetSampleRate)
  const blob = new Blob([wavBuffer], {type: 'audio/wav'})
  return {blob}
}

async function translateTurns(
  turns: Array<Omit<Turn, 'hindiText' | 'translationStatus'>>,
  googleApiKey: string
): Promise<Turn[]> {
  return Promise.all(
    turns.map(async (turn) => {
      if (!googleApiKey) {
        return {
          ...turn,
          hindiText: 'Translation skipped (VITE_GOOGLE_TRANSLATE_API_KEY missing).',
          translationStatus: 'failed' as const
        }
      }

      try {
        const hindiText = await translateText(turn.nepaliText, googleApiKey)
        return {
          ...turn,
          hindiText,
          translationStatus: 'done' as const
        }
      } catch {
        return {
          ...turn,
          hindiText: 'Translation failed for this segment.',
          translationStatus: 'failed' as const
        }
      }
    })
  )
}

function saveSession(
  turns: Turn[],
  startedAt: number,
  setSessions: Dispatch<SetStateAction<Session[]>>,
  setSelectedSessionId: Dispatch<SetStateAction<string>>
) {
  const durationSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000))
  const session: Session = {
    id: crypto.randomUUID(),
    title: `Conversation ${new Date().toLocaleString()}`,
    createdAt: new Date().toISOString(),
    durationSec,
    turns
  }

  setSessions((existing) => [session, ...existing])
  setSelectedSessionId(session.id)
}

function App() {
  const groqKey = (import.meta.env.VITE_GROQ_API_KEY ?? '').trim()
  const googleApiKey = (import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY ?? '').trim()
  const [status, setStatus] = useState('Idle')
  const [error, setError] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [debugInfo, setDebugInfo] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState('')

  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const floatChunksRef = useRef<Float32Array[]>([])
  const sampleRateRef = useRef<number>(16000)
  const startedAtRef = useRef<number>(0)

  useEffect(() => {
    const loadInputs = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const audioInputs = devices.filter((device) => device.kind === 'audioinput')
        setInputDevices(audioInputs)
        setSelectedDeviceId((current) => current || audioInputs[0]?.deviceId || '')
      } catch {
        // Ignore listing failure until microphone permission is granted.
      }
    }

    void loadInputs()
  }, [])

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) ?? sessions[0],
    [selectedSessionId, sessions]
  )

  async function handleStart() {
    setError('')
    setDebugInfo('')

    if (!groqKey) {
      setError('VITE_GROQ_API_KEY is missing in web/.env.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          channelCount: 1,
          deviceId: selectedDeviceId ? {exact: selectedDeviceId} : undefined,
          echoCancellation: false,
          noiseSuppression: false
        }
      })

      const audioContext = new AudioContext()
      const sourceNode = audioContext.createMediaStreamSource(stream)
      const processor = audioContext.createScriptProcessor(4096, 1, 1)

      floatChunksRef.current = []
      sampleRateRef.current = audioContext.sampleRate
      processor.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0)
        const copy = new Float32Array(input.length)
        copy.set(input)
        floatChunksRef.current.push(copy)

        let sum = 0
        for (let index = 0; index < input.length; index += 1) {
          sum += input[index] * input[index]
        }
        const rms = Math.sqrt(sum / input.length)
        setAudioLevel(Math.min(1, rms * 8))
      }

      sourceNode.connect(processor)
      processor.connect(audioContext.destination)

      audioContextRef.current = audioContext
      sourceNodeRef.current = sourceNode
      processorRef.current = processor
      streamRef.current = stream
      startedAtRef.current = Date.now()
      setIsRecording(true)
      setStatus('Recording...')

      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter((device) => device.kind === 'audioinput')
      setInputDevices(audioInputs)
      setSelectedDeviceId((current) => current || audioInputs[0]?.deviceId || '')
    } catch (requestError) {
      setError((requestError as Error).message)
      setStatus('Idle')
    }
  }

  async function handleStop() {
    if (!isRecording) {
      return
    }

    setStatus('Finalizing recording...')
    setError('')
    setIsRecording(false)
    setAudioLevel(0)

    try {
      processorRef.current?.disconnect()
      sourceNodeRef.current?.disconnect()
      processorRef.current = null
      sourceNodeRef.current = null

      await audioContextRef.current?.close()
      audioContextRef.current = null

      const {blob: wavBlob} = buildNormalizedWav(
        floatChunksRef.current,
        sampleRateRef.current,
        16000
      )
      const recordedSec = ((Date.now() - startedAtRef.current) / 1000).toFixed(1)
      setDebugInfo(
        `chunks=${floatChunksRef.current.length}, sampleRate=${sampleRateRef.current}, duration=${recordedSec}s, wavBytes=${wavBlob.size}`
      )

      if (!wavBlob.size) {
        setStatus('Idle')
        setError('Recorded file is empty. Please try again.')
        return
      }

      setStatus('Transcribing with Whisper...')
      const transcription = await transcribeWithWhisper(wavBlob, groqKey)
      const turns = transcription.turns
      setDebugInfo(
        (prev) =>
          `${prev} | attempt=${transcription.attempt}, transcriptChars=${transcription.transcript.length}, turns=${turns.length}`
      )

      if (!turns.length) {
        setStatus('Idle')
        setError('No speech detected. Try speaking louder and closer to microphone.')
        return
      }

      setStatus('Translating...')
      const translatedTurns = await translateTurns(turns, googleApiKey)

      saveSession(translatedTurns, startedAtRef.current, setSessions, setSelectedSessionId)
      setStatus('Done')
    } catch (stopError) {
      setStatus('Idle')
      setError((stopError as Error).message)
    } finally {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      floatChunksRef.current = []
    }
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.currentTarget.value = ''

    if (!file) {
      return
    }

    setError('')

    if (!groqKey) {
      setError('VITE_GROQ_API_KEY is missing in web/.env.')
      return
    }

    try {
      const startedAt = Date.now()
      setStatus('Transcribing uploaded file with Whisper...')
      const transcription = await transcribeWithWhisper(new Blob([file], {type: 'audio/wav'}), groqKey)
      const turns = transcription.turns
      setDebugInfo(
        `uploadBytes=${file.size}, transcriptChars=${transcription.transcript.length}, turns=${turns.length}`
      )

      if (!turns.length) {
        setStatus('Idle')
        setError('No speech detected in uploaded file.')
        return
      }

      setStatus('Translating...')
      const translatedTurns = await translateTurns(turns, googleApiKey)
      saveSession(translatedTurns, startedAt, setSessions, setSelectedSessionId)
      setStatus('Done')
    } catch (uploadError) {
      setStatus('Idle')
      setError((uploadError as Error).message)
    }
  }

  return (
    <div className="page">
      <header className="masthead">
        <h1>Nepali to Hindi Recorder</h1>
        <p>Record first, then transcribe with speaker diarization and translate on stop.</p>
      </header>

      <section className="panel controls">
        <p className="envInfo">Using API keys from web/.env.</p>
        <label>
          Microphone Input
          <select
            disabled={isRecording || inputDevices.length === 0}
            onChange={(event) => setSelectedDeviceId(event.target.value)}
            value={selectedDeviceId}>
            {inputDevices.length === 0 && <option value="">No microphone found</option>}
            {inputDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.slice(0, 6)}`}
              </option>
            ))}
          </select>
        </label>
        <div className="meterWrap">
          <div className="meterLabel">Mic Level</div>
          <div className="meterTrack">
            <div className="meterFill" style={{transform: `scaleX(${audioLevel})`}} />
          </div>
        </div>
        <div className="actions">
          <button disabled={isRecording} onClick={() => void handleStart()}>
            Start Recording
          </button>
          <button className="stop" disabled={!isRecording} onClick={() => void handleStop()}>
            Stop and Process
          </button>
          <label className="uploadButton">
            Upload Audio File
            <input accept="audio/*" onChange={event => void handleFileUpload(event)} type="file" />
          </label>
        </div>
        <div className="status">
          <span>Status: {status}</span>
          {error && <span className="error">{error}</span>}
          {debugInfo && <span className="debug">{debugInfo}</span>}
        </div>
      </section>

      <main className="layout">
        <section className="panel sessions">
          <h2>Saved Sessions</h2>
          {sessions.length === 0 && <p className="muted">No recordings yet.</p>}
          {sessions.map((session) => (
            <button
              className={`sessionRow ${session.id === selectedSession?.id ? 'active' : ''}`}
              key={session.id}
              onClick={() => setSelectedSessionId(session.id)}
              type="button">
              <strong>{session.title}</strong>
              <span>{session.durationSec}s</span>
            </button>
          ))}
        </section>

        <section className="panel transcript">
          <h2>Conversation Detail</h2>
          {!selectedSession && <p className="muted">Stop a recording to see the transcript.</p>}
          {selectedSession && (
            <>
              <p className="meta">
                {new Date(selectedSession.createdAt).toLocaleString()} | {selectedSession.turns.length}{' '}
                turns
              </p>
              <div className="turns">
                {selectedSession.turns.map((turn) => (
                  <article className="turn" key={turn.id}>
                    <h3>Speaker {turn.speakerNumber}</h3>
                    <p className="ne">
                      <span className="langTag neTag">NE</span>
                      {turn.nepaliText}
                    </p>
                    <p className={`hi ${turn.translationStatus === 'failed' ? 'warn' : ''}`}>
                      <span className="langTag hiTag">HI</span>
                      {turn.hindiText}
                    </p>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
