import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Chip, Surface, Text} from 'react-native-paper';
import type {ConversationItem, InterimTranscript} from '@app-types/conversation';
import {formatTimestamp} from '@utils/date';

interface TranscriptCardProps {
  item: ConversationItem | InterimTranscript;
  isInterim?: boolean;
}

function isSavedItem(
  item: ConversationItem | InterimTranscript
): item is ConversationItem {
  return 'hindiText' in item;
}

function hasInterimHindi(item: ConversationItem | InterimTranscript): boolean {
  return !isSavedItem(item) && typeof item.hindiText === 'string' && item.hindiText.length > 0;
}

export function TranscriptCard({item, isInterim = false}: TranscriptCardProps) {
  const translationStatus = isSavedItem(item) ? item.translationStatus : undefined;

  return (
    <Surface elevation={1} style={styles.card}>
      <View style={styles.headerRow}>
        <Chip compact style={styles.chip}>
          Speaker {item.speakerNumber}
        </Chip>
        <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
      </View>

      <Text style={styles.sectionTitle}>Nepali</Text>
      <Text style={styles.body}>{item.nepaliText}</Text>

      <Text style={styles.sectionTitle}>Hindi</Text>
      <Text style={styles.body}>
        {isSavedItem(item)
          ? item.hindiText || 'Translating...'
          : hasInterimHindi(item)
            ? item.hindiText
            : 'Waiting for live translation...'}
      </Text>

      {isInterim ? <Text style={styles.caption}>Live interim transcript</Text> : null}
      {translationStatus === 'failed' ? (
        <Text style={styles.failed}>Translation failed for this utterance.</Text>
      ) : null}
    </Surface>
  );
}

const styles = StyleSheet.create({
  body: {
    color: '#1F2937',
    fontSize: 16,
    lineHeight: 24
  },
  caption: {
    color: '#8C7B68',
    marginTop: 12
  },
  card: {
    backgroundColor: '#FCF8F1',
    borderRadius: 24,
    marginBottom: 12,
    padding: 16
  },
  chip: {
    backgroundColor: '#E3D7C6'
  },
  failed: {
    color: '#B3261E',
    marginTop: 12
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  sectionTitle: {
    color: '#6D5F4D',
    fontSize: 12,
    marginBottom: 4,
    marginTop: 8,
    textTransform: 'uppercase'
  },
  timestamp: {
    color: '#6B7280'
  }
});