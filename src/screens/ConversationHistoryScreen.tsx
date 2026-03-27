import React, {useEffect} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Surface, Text} from 'react-native-paper';
import {SessionListItem} from '@components/SessionListItem';
import {useAppStore} from '@store/useAppStore';
import type {RootStackParamList} from '@app-types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

export function ConversationHistoryScreen({navigation}: Props) {
  const {hydrate, initialized, sessions} = useAppStore();

  useEffect(() => {
    if (!initialized) {
      hydrate();
    }
  }, [hydrate, initialized]);

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.content}
        data={sessions}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <Surface elevation={0} style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No saved conversations</Text>
            <Text style={styles.emptyBody}>
              Completed sessions appear here after you stop live listening.
            </Text>
          </Surface>
        }
        renderItem={({item}) => (
          <SessionListItem
            onPress={() => navigation.navigate('ConversationDetail', {sessionId: item.id})}
            session={item}
          />
        )}
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
    padding: 16
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
  }
});