import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/env';

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export const isSupabaseConfigured = () => {
  return SUPABASE_URL && SUPABASE_ANON_KEY && 
         SUPABASE_URL !== 'https://placeholder.supabase.co';
};

// Auth Service
export const authService = {
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const profile = await this.getProfile(data.user.id);
        return {
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email!,
            name: profile?.name || email.split('@')[0],
            role: profile?.role || 'Operator',
            sector: profile?.sector || 'PROGEP',
            avatarUrl: profile?.avatar_url,
          },
        };
      }

      return { success: false, error: 'Erro desconhecido' };
    } catch (err) {
      return { success: false, error: 'Erro ao conectar com o servidor' };
    }
  },

  async signUp(email: string, password: string, name?: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Erro ao criar conta' };
    }
  },

  async signOut() {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem('uema_user');
  },

  async getProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return data;
  },

  async getCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await this.getProfile(session.user.id);
      return {
        id: session.user.id,
        email: session.user.email!,
        name: profile?.name || session.user.email!.split('@')[0],
        role: profile?.role || 'Operator',
        sector: profile?.sector || 'PROGEP',
        avatarUrl: profile?.avatar_url,
      };
    }
    return null;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },
};

// Realtime Service
export const realtimeService = {
  subscribeToNotifications(userId: string, onNotification: (notification: any) => void) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onNotification(payload.new);
        }
      )
      .subscribe();
  },

  async getUnreadNotifications(userId: string) {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false });
    return data || [];
  },

  async markAsRead(notificationId: string) {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
  },

  unsubscribe(channel: any) {
    supabase.removeChannel(channel);
  },
};
