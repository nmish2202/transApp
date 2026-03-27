import React, {useEffect, useState} from 'react';
import {Alert, FlatList, StyleSheet, View} from 'react-native';
import {Button, Surface, Text} from 'react-native-paper';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {TranscriptCard} from '@components/TranscriptCard';
import {exportService} from '@services/exportService';
import {useAppStore} from '@store/useAppStore';
import type {RootStackParamList} from '@app-types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ConversationDetail'>;

export function ConversationDetailScreen({route}: Props) {
  const {sessionId} = route.params;
  const {hydrate, initialized, sessionItems, sessions, settings} = useAppStore();
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!initialized) {
      hydrate();
    }
  }, [hydrate, initialized]);

  const session = sessions.find(item => item.id === sessionId);
  const items = sessionItems[sessionId] ?? [];

  async function handleExport(format: 'txt' | 'pdf') {
    if (!session) {
      return;
    }

    try {
      setIsExporting(true);
      const filePath =
        format === 'txt'
          ? await exportService.exportAsTxt(
              session,
              items,
              settings.defaultExportDirectory
            )
          : await exportService.exportAsPdf(
              session,
              items,
              settings.defaultExportDirectory
            );

      await exportService.shareFile(
        filePath,
        format === 'txt' ? 'text/plain' : 'application/pdf'
      );
    } catch (error) {
      Alert.alert('Export failed', (error as Error).message);
    } finally {
      setIsExporting(false);
    }
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <Surface elevation={0} style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Conversation not found</Text>
          <Text style={styles.emptyBody}>This saved session could not be loaded.</Text>
        </Surface>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.content}
        data={items}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <>
            <Surface elevation={0} style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{session.title}</Text>
              <Text style={styles.summaryBody}>
                Export this session as TXT or PDF, then share through WhatsApp, email, or any installed share target.
              </Text>
              <View style={styles.exportRow}>
                <Button
                  disabled={isExporting}
                  icon="file-document-outline"
                  mode="contained"
                  onPress={() => void handleExport('txt')}>
                  Export TXT
                </Button>
                <Button
                  disabled={isExporting}
                  icon="file-pdf-box"
                  mode="contained-tonal"
                  onPress={() => void handleExport('pdf')}>
                  Export PDF
                </Button>
              </View>
            </Surface>
            <Text style={styles.sectionTitle}>Transcript</Text>
          </>
        }
        renderItem={({item}) => <TranscriptCard item={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F4EFE6',
    flex: 1
  },
  content: {
    padding: 16,
    paddingBottom: 24
  },
  emptyBody: {
    color: '#6D5F4D'
  },
  emptyState: {
    backgroundColor: '#EFE7DA',
    borderRadius: 20,
    margin: 16,
    padding: 20
  },
  emptyTitle: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6
  },
  exportRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16
  },
  sectionTitle: {
    color: '#6D5F4D',
    fontSize: 13,
    marginBottom: 12,
    marginTop: 16,
    textTransform: 'uppercase'
  },
  summaryBody: {
    color: '#4B5563',
    lineHeight: 22
  },
  summaryCard: {
    backgroundColor: '#F9F2E6',
    borderRadius: 24,
    padding: 20
  },
  summaryTitle: {
    color: '#1E4D40',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8
  }
});