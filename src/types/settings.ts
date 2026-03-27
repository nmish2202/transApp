export type ExportFormat = 'txt' | 'pdf';
export type NoiseSuppressionMode = 'deepgram' | 'webrtc' | 'rnnoise';

export interface AppSettings {
  groqApiKeyOverride?: string;
  deepgramApiKeyOverride?: string;
  googleTranslateApiKeyOverride?: string;
  defaultExportFormat: ExportFormat;
  defaultExportDirectory: string;
  noiseSuppressionMode: NoiseSuppressionMode;
  autoTitleSessions: boolean;
}

export const defaultAppSettings: AppSettings = {
  defaultExportFormat: 'txt',
  defaultExportDirectory: 'TransAppExports',
  noiseSuppressionMode: 'deepgram',
  autoTitleSessions: true
};