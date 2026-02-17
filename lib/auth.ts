import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const signOutCompletely = async () => {
  try {
    console.log('Starting complete sign out...');
    
    // First, clear all Supabase auth data
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    
    if (error) {
      console.error('Supabase sign out error:', error);
    }
    
    // Clear AsyncStorage completely as backup
    const keys = await AsyncStorage.getAllKeys();
    const authKeys = keys.filter(key => 
      key.includes('supabase') || 
      key.includes('auth') || 
      key.includes('session')
    );
    
    if (authKeys.length > 0) {
      await AsyncStorage.multiRemove(authKeys);
      console.log('Cleared AsyncStorage keys:', authKeys);
    }
    
    // Clear any remaining session data
    // Note: setSession with null is not available in all versions, so we skip this
    
    console.log('Sign out completed successfully');
    return { success: true, error: null };
    
  } catch (error) {
    console.error('Complete sign out error:', error);
    return { success: false, error };
  }
};
