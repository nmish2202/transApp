import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ConversationDetailScreen} from '@screens/ConversationDetailScreen';
import {ConversationHistoryScreen} from '@screens/ConversationHistoryScreen';
import {HomeScreen} from '@screens/HomeScreen';
import {SettingsScreen} from '@screens/SettingsScreen';
import type {RootStackParamList} from '@app-types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          animation: 'slide_from_right',
          contentStyle: {backgroundColor: '#F4EFE6'},
          headerShadowVisible: false,
          headerStyle: {backgroundColor: '#F4EFE6'},
          headerTitleStyle: {color: '#1F2937', fontWeight: '700'}
        }}>
        <Stack.Screen component={HomeScreen} name="Home" options={{title: 'Live Translator'}} />
        <Stack.Screen
          component={ConversationHistoryScreen}
          name="History"
          options={{title: 'Conversation History'}}
        />
        <Stack.Screen
          component={ConversationDetailScreen}
          name="ConversationDetail"
          options={{title: 'Conversation Detail'}}
        />
        <Stack.Screen component={SettingsScreen} name="Settings" options={{title: 'Settings'}} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}