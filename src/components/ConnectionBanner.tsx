import React from 'react';
import {StyleSheet} from 'react-native';
import {Surface, Text} from 'react-native-paper';
import type {ConnectionStatus} from '@app-types/speech';

const statusLabelMap: Record<ConnectionStatus, string> = {
  idle: 'Idle',
  connecting: 'Connecting to Deepgram',
  listening: 'Listening live',
  stopping: 'Stopping stream',
  error: 'Attention needed'
};

interface ConnectionBannerProps {
  error?: string;
  status: ConnectionStatus;
}

export function ConnectionBanner({error, status}: ConnectionBannerProps) {
  return (
    <Surface elevation={0} style={styles.container}>
      <Text style={styles.label}>Status</Text>
      <Text style={styles.value}>{statusLabelMap[status]}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E9E0D3',
    borderRadius: 20,
    marginBottom: 16,
    padding: 16
  },
  error: {
    color: '#B3261E',
    marginTop: 8
  },
  label: {
    color: '#6D5F4D',
    fontSize: 12,
    textTransform: 'uppercase'
  },
  value: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '700'
  }
});