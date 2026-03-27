import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Button} from 'react-native-paper';

interface ControlBarProps {
  isListening: boolean;
  onStart: () => void | Promise<void>;
  onStop: () => void | Promise<void>;
}

export function ControlBar({isListening, onStart, onStop}: ControlBarProps) {
  return (
    <View style={styles.container}>
      <Button
        buttonColor="#1E4D40"
        disabled={isListening}
        icon="play"
        mode="contained"
        onPress={onStart}
        style={styles.button}>
        Start Listening
      </Button>
      <Button
        disabled={!isListening}
        icon="stop"
        mode="contained-tonal"
        onPress={onStop}
        style={styles.button}>
        Stop Listening
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16
  },
  button: {
    flex: 1
  }
});