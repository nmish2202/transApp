declare module 'react-native-config' {
  export interface NativeConfig {
    GROQ_API_KEY: string;
    DEEPGRAM_API_KEY: string;
    GOOGLE_TRANSLATE_API_KEY: string;
    GOOGLE_TRANSLATE_BASE_URL: string;
    DEFAULT_EXPORT_DIRECTORY: string;
    ENABLE_VERBOSE_LOGGING: string;
  }

  export const Config: NativeConfig;
  export default Config;
}