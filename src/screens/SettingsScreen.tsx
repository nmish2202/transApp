import React, {useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {
  Button,
  SegmentedButtons,
  Surface,
  Switch,
  Text,
  TextInput
} from 'react-native-paper';
import {useAppStore} from '@store/useAppStore';

export function SettingsScreen() {
  const {settings, updateSettings} = useAppStore();
  const [deepgramApiKey, setDeepgramApiKey] = useState(
    settings.deepgramApiKeyOverride ?? ''
  );
  const [groqApiKey, setGroqApiKey] = useState(
    settings.groqApiKeyOverride ?? ''
  );
  const [googleApiKey, setGoogleApiKey] = useState(
    settings.googleTranslateApiKeyOverride ?? ''
  );
  const [directory, setDirectory] = useState(settings.defaultExportDirectory);

  function handleSave() {
    updateSettings({
      deepgramApiKeyOverride: deepgramApiKey,
      defaultExportDirectory: directory,
      googleTranslateApiKeyOverride: googleApiKey,
      groqApiKeyOverride: groqApiKey
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <Surface elevation={0} style={styles.card}>
        <Text style={styles.title}>API configuration</Text>
        <TextInput
          label="Groq API key (free — console.groq.com)"
          mode="outlined"
          onChangeText={setGroqApiKey}
          secureTextEntry
          value={groqApiKey}
        />
        <TextInput
          label="Deepgram API key (live streaming)"
          mode="outlined"
          onChangeText={setDeepgramApiKey}
          secureTextEntry
          style={styles.inputSpacing}
          value={deepgramApiKey}
        />
        <TextInput
          label="Google Translate API key override"
          mode="outlined"
          onChangeText={setGoogleApiKey}
          secureTextEntry
          style={styles.inputSpacing}
          value={googleApiKey}
        />
      </Surface>

      <Surface elevation={0} style={styles.card}>
        <Text style={styles.title}>Export options</Text>
        <TextInput
          label="Export directory"
          mode="outlined"
          onChangeText={setDirectory}
          value={directory}
        />
        <Text style={styles.sectionLabel}>Default format</Text>
        <SegmentedButtons
          buttons={[
            {label: 'TXT', value: 'txt'},
            {label: 'PDF', value: 'pdf'}
          ]}
          onValueChange={value =>
            updateSettings({defaultExportFormat: value as 'txt' | 'pdf'})
          }
          value={settings.defaultExportFormat}
        />
      </Surface>

      <Surface elevation={0} style={styles.card}>
        <Text style={styles.title}>Noise reduction</Text>
        <Text style={styles.body}>
          Deepgram server-side suppression is the default path. WebRTC or RNNoise modes can be swapped in later if you add a native DSP module.
        </Text>
        <SegmentedButtons
          buttons={[
            {label: 'Deepgram', value: 'deepgram'},
            {label: 'WebRTC', value: 'webrtc'},
            {label: 'RNNoise', value: 'rnnoise'}
          ]}
          onValueChange={value =>
            updateSettings({noiseSuppressionMode: value as 'deepgram' | 'webrtc' | 'rnnoise'})
          }
          style={styles.segmentedSpacing}
          value={settings.noiseSuppressionMode}
        />
      </Surface>

      <Surface elevation={0} style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text style={styles.title}>Auto-title sessions</Text>
            <Text style={styles.body}>
              Use the first finalized Nepali utterance as the saved conversation title.
            </Text>
          </View>
          <Switch
            onValueChange={value => updateSettings({autoTitleSessions: value})}
            value={settings.autoTitleSessions}
          />
        </View>
      </Surface>

      <Button mode="contained" onPress={handleSave}>
        Save settings
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: {
    color: '#4B5563',
    lineHeight: 22
  },
  card: {
    backgroundColor: '#FCF8F1',
    borderRadius: 24,
    marginBottom: 16,
    padding: 16
  },
  container: {
    backgroundColor: '#F4EFE6',
    flex: 1
  },
  content: {
    padding: 16,
    paddingBottom: 24
  },
  inputSpacing: {
    marginTop: 12
  },
  sectionLabel: {
    color: '#6D5F4D',
    fontSize: 12,
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase'
  },
  segmentedSpacing: {
    marginTop: 16
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  switchText: {
    flex: 1,
    paddingRight: 16
  },
  title: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8
  }
});