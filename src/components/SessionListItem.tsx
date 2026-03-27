import React from 'react';
import {StyleSheet} from 'react-native';
import {List} from 'react-native-paper';
import type {ConversationSession} from '@app-types/conversation';
import {formatSessionDate} from '@utils/date';

interface SessionListItemProps {
  onPress: () => void;
  session: ConversationSession;
}

export function SessionListItem({onPress, session}: SessionListItemProps) {
  return (
    <List.Item
      description={formatSessionDate(session.createdAt)}
      onPress={onPress}
      style={styles.item}
      title={session.title}
      left={props => <List.Icon {...props} color="#1E4D40" icon="history" />}
      right={props => <List.Icon {...props} icon="chevron-right" />}
    />
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: '#FCF8F1',
    borderRadius: 18,
    marginBottom: 10
  }
});