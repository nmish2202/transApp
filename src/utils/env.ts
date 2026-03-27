import Config from 'react-native-config';

export const env = {
  groqApiKey: Config.GROQ_API_KEY ?? '',
  deepgramApiKey: Config.DEEPGRAM_API_KEY ?? '',
  googleTranslateApiKey: Config.GOOGLE_TRANSLATE_API_KEY ?? '',
  googleTranslateBaseUrl:
    Config.GOOGLE_TRANSLATE_BASE_URL ??
    'https://translation.googleapis.com/language/translate/v2',
  defaultExportDirectory: Config.DEFAULT_EXPORT_DIRECTORY ?? 'TransAppExports',
  verboseLogging: Config.ENABLE_VERBOSE_LOGGING === 'true'
};