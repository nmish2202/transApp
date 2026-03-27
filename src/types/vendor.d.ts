declare module 'react-native-html-to-pdf' {
  interface PdfOptions {
    html: string;
    fileName: string;
    directory?: string;
  }

  interface PdfResult {
    filePath?: string;
  }

  const RNHTMLtoPDF: {
    convert: (options: PdfOptions) => Promise<PdfResult>;
  };

  export default RNHTMLtoPDF;
}

declare module 'react-native-audio-record' {
  interface AudioRecordOptions {
    sampleRate: number;
    channels: number;
    bitsPerSample: number;
    audioSource?: number;
    wavFile?: string;
  }

  const AudioRecord: {
    init: (options: AudioRecordOptions) => void;
    on: (event: 'data', callback: (data: string) => void) => void;
    start: () => Promise<void>;
    stop: () => Promise<string>;
  };

  export default AudioRecord;
}