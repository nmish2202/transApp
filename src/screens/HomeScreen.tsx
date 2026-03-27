import React, {useEffect} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {Appbar, Surface, Text} from 'react-native-paper';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ConnectionBanner} from '@components/ConnectionBanner';
import {ControlBar} from '@components/ControlBar';
import {LiveConversationCard} from '@components/LiveConversationCard';
import {useLiveConversation} from '@hooks/useLiveConversation';
import {useAppStore} from '@store/useAppStore';
import type {RootStackParamList} from '@app-types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({navigation}: Props) {
  const {
    activeSession,
    connectionStatus,
    error,
    hydrate,
    initialized,
    interimTranscript,
    isListening,
    sessionItems
  } = useAppStore();
  const {startListening, stopListening} = useLiveConversation();

  useEffect(() => {
    if (!initialized) {
      hydrate();
    }
  }, [hydrate, initialized]);

  const liveItems = activeSession ? sessionItems[activeSession.id] ?? [] : [];

  async function handleStop() {
    const sessionId = await stopListening();
    if (sessionId) {
      navigation.navigate('ConversationDetail', {sessionId});
    }
  }

  return (
    <View style={styles.container}>
      <Appbar.Header elevated={false} style={styles.appbar}>
        <Appbar.Content subtitle="Nepali to Hindi in real time" title="Nearby Speech" />
        <Appbar.Action icon="history" onPress={() => navigation.navigate('History')} />
        <Appbar.Action icon="cog-outline" onPress={() => navigation.navigate('Settings')} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <ConnectionBanner error={error} status={connectionStatus} />
        <ControlBar
          isListening={isListening}
          onStart={() => void startListening()}
          onStop={() => void handleStop()}
        />
        <Surface elevation={0} style={styles.heroCard}>
          <Text style={styles.heroTitle}>Continuous speaker-aware translation</Text>
          <Text style={styles.heroBody}>
            Start listening and the app will stream Nepali speech, separate speakers,
            translate each finalized utterance into Hindi, and save the session when you stop.
          </Text>
        </Surface>
        <Text style={styles.sectionTitle}>Live transcript</Text>
        <LiveConversationCard interimTranscript={interimTranscript} items={liveItems} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  appbar: {
    backgroundColor: '#F4EFE6'
  },
  container: {
    backgroundColor: '#F4EFE6',
    flex: 1
  },
  content: {
    padding: 16,
    paddingBottom: 24
  },
  heroBody: {
    color: '#4B5563',
    fontSize: 15,
    lineHeight: 22
  },
  heroCard: {
    backgroundColor: '#F9F2E6',
    borderRadius: 28,
    marginBottom: 16,
    padding: 20
  },
  heroTitle: {
    color: '#1E4D40',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8
  },
  sectionTitle: {
    color: '#6D5F4D',
    fontSize: 13,
    marginBottom: 12,
    textTransform: 'uppercase'
  }
});