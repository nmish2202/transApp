import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Chip, Surface, Text} from 'react-native-paper';
import type {ConversationItem, InterimTranscript} from '@app-types/conversation';
import {formatTimestamp} from '@utils/date';

interface LiveConversationCardProps {
  interimTranscript?: InterimTranscript;
  items: ConversationItem[];
}

export function LiveConversationCard({
  interimTranscript,
  items
}: LiveConversationCardProps) {
  const hasAnyContent = items.length > 0 || Boolean(interimTranscript?.nepaliText);

  if (!hasAnyContent) {
    return (
      <Surface elevation={0} style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No live conversation yet</Text>
        <Text style={styles.emptyBody}>
          Press Start Listening to begin capturing nearby Nepali conversations.
        </Text>
      </Surface>
    );
  }

  return (
    <Surface elevation={1} style={styles.card}>
      <Text style={styles.heading}>Live Conversation</Text>

      {items.map(item => (
        <View key={item.id} style={styles.turn}>
          <View style={styles.headerRow}>
            <Chip compact style={styles.chip}>
              Speaker {item.speakerNumber}
            </Chip>
            <Text style={styles.time}>{formatTimestamp(item.timestamp)}</Text>
          </View>

          <Text style={styles.label}>Nepali</Text>
          <Text style={styles.text}>{item.nepaliText}</Text>

          <Text style={styles.label}>Hindi</Text>
          <Text style={styles.text}>{item.hindiText || 'Translating...'}</Text>
        </View>
      ))}

      {interimTranscript ? (
        <View style={styles.interimTurn}>
          <View style={styles.headerRow}>
            <Chip compact style={styles.interimChip}>
              Speaker {interimTranscript.speakerNumber}
            </Chip>
            <Text style={styles.time}>{formatTimestamp(interimTranscript.timestamp)}</Text>
          </View>
          <Text style={styles.label}>Nepali (live)</Text>
          <Text style={styles.text}>{interimTranscript.nepaliText}</Text>
          <Text style={styles.label}>Hindi (live)</Text>
          <Text style={styles.text}>
            {interimTranscript.hindiText || 'Waiting for live translation...'}
          </Text>
        </View>
      ) : null}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FCF8F1',
    borderRadius: 24,
    padding: 16
  },
  chip: {
    backgroundColor: '#E3D7C6'
  },
  emptyBody: {
    color: '#6D5F4D'
  },
  emptyState: {
    backgroundColor: '#EFE7DA',
    borderRadius: 20,
    padding: 20
  },
  emptyTitle: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6
  },
  heading: {
    color: '#1E4D40',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  interimChip: {
    backgroundColor: '#E7DEF6'
  },
  interimTurn: {
    backgroundColor: '#F4EDF8',
    borderRadius: 16,
    marginTop: 8,
    padding: 12
  },
  label: {
    color: '#6D5F4D',
    fontSize: 12,
    marginBottom: 2,
    marginTop: 4,
    textTransform: 'uppercase'
  },
  text: {
    color: '#1F2937',
    fontSize: 17,
    lineHeight: 25
  },
  time: {
    color: '#6B7280'
  },
  turn: {
    borderBottomColor: '#E9E0D3',
    borderBottomWidth: 1,
    marginBottom: 10,
    paddingBottom: 10
  }
});