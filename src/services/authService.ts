import { UserProfile, CategoryId, TrustProfile } from '../types';
import { CURRENT_USER } from '../data/mockData';
import { supabase } from '../lib/supabase';
import type { TablesUpdate } from '../types/supabase';

const AUTH_STORAGE_KEY = 'swaloop_auth_user';
const ONBOARDING_COMPLETED_KEY = 'swaloop_onboarding_done';

export interface PhoneCheckResult {
  exists: boolean;
  message: string;
}

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('90')) {
    return `+${cleaned}`;
  }

  if (cleaned.startsWith('0')) {
    return `+90${cleaned.slice(1)}`;
  }

  if (cleaned.startsWith('5')) {
    return `+90${cleaned}`;
  }

  return `+${cleaned}`;
}

function formatPhone(phone: string): string {
  const digits = normalizePhone(phone).replace(/\D/g, '');

  if (digits.startsWith('90') && digits.length === 12) {
    const tr = digits.slice(2);

    return `+90 ${tr.slice(0, 3)} ${tr.slice(3, 6)} ${tr.slice(6, 8)} ${tr.slice(8, 10)}`;
  }

  return phone;
}

// public.trust_profiles satırı, her profile INSERT'inde DB tetikleyicisi
// (create_trust_profile) tarafından otomatik oluşturuluyor. Önceden bu veri
// hiç okunmuyor, her kullanıcı için sabit "score: 5" gösteriliyordu.
async function getTrustProfileRow(userId: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('trust_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Trust profile alınamadı:', error);
    return null;
  }

  return data;
}

function trustLevelFromScore(
  score: number
): TrustProfile['level'] {
  if (score >= 4.5) return 'Topluluk Lideri';
  if (score >= 3.5) return 'Çok Güvenilir';
  if (score >= 2.5) return 'Güvenilir';
  return 'Başlangıç';
}

function mapProfile(row: any, trust?: any | null): UserProfile {
  const completedTrades = trust?.completed_trades ?? 0;
  const cancelledTrades = trust?.cancelled_trades ?? 0;
  const totalTrades = completedTrades + cancelledTrades;
  const score = trust?.trust_score ?? 5;

  return {
    id: row.id,
    phone: formatPhone(row.phone ?? ''),
    fullName: row.full_name ?? '',
    avatarUrl:
      row.avatar_url ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    city: row.city ?? '',
    district: row.district ?? '',
    bio: row.bio ?? undefined,
    memberSince: row.created_at
      ? new Date(row.created_at).toLocaleDateString('tr-TR')
      : 'Bugün',

    interests: [],
    wantedCategories: [],

    isVerified: true,

    trustProfile: {
      score,
      level: trustLevelFromScore(score),
      phoneVerified: true,
      idVerified: trust?.verification_level === 'id_verified',
      successfulTradesCount: completedTrades,
      cancellationRate:
        totalTrades > 0 ? cancelledTrades / totalTrades : 0,
      responseRate: trust?.response_rate ?? 1,
      // DB'de reviews tablosu var ama ortalama puan/adet henüz burada
      // agregе edilmiyor; bu iki alan hâlâ placeholder.
      averageRating: 5,
      reviewCount: 0,
      reportCount: 0,
      accountAgeDays: row.created_at
        ? Math.max(
            1,
            Math.floor(
              (Date.now() - new Date(row.created_at).getTime()) /
                86400000
            )
          )
        : 1,
      positiveHighlights: ['Telefon doğrulandı'],
    },

    stats: {
      totalTrades: completedTrades,
      activeListings: 0,
      completedLoops: 0,
      totalCo2Prevented: 0,
      totalWaterSaved: 0,
      totalEnergySaved: 0,
      totalRawMaterialsSaved: 0,
      totalItemsReused: 0,
      responseRatePercent: Math.round((trust?.response_rate ?? 1) * 100),
      avgResponseTimeMinutes: 0,
      cancellationRatePercent:
        totalTrades > 0
          ? Math.round((cancelledTrades / totalTrades) * 100)
          : 0,
    },
  };
}

export const authService = {
  async getSupabaseSession() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Supabase session error:', error);
      return null;
    }

    return data.session;
  },

  formatPhoneNumber(raw: string): string {
    const cleaned = raw.replace(/\D/g, '');

    let digits = cleaned;

    if (digits.startsWith('90')) {
      digits = digits.slice(2);
    }

    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }

    digits = digits.slice(0, 10);

    if (!digits) return '';

    if (digits.length <= 3) {
      return `+90 ${digits}`;
    }

    if (digits.length <= 6) {
      return `+90 ${digits.slice(0, 3)} ${digits.slice(3)}`;
    }

    if (digits.length <= 8) {
      return `+90 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }

    return `+90 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  },

  isValidPhone(phone: string): boolean {
    const digits = phone.replace(/\D/g, '');

    const normalized = digits.startsWith('90')
      ? digits.slice(2)
      : digits.startsWith('0')
        ? digits.slice(1)
        : digits;

    return normalized.length === 10 && normalized.startsWith('5');
  },

  async checkPhoneRegistered(
    formattedPhone: string
  ): Promise<PhoneCheckResult> {
    const phone = normalizePhone(formattedPhone);

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (error) {
      console.error('Telefon kontrolü başarısız:', error);

      return {
        exists: false,
        message: 'Telefon kontrolü yapılamadı.',
      };
    }

    return {
      exists: !!data,
      message: data
        ? 'Bu telefon numarasına ait aktif bir Swaloop hesabı zaten bulunmaktadır. Lütfen giriş yapınız.'
        : 'Telefon numarası kullanılabilir.',
    };
  },

  async sendOtp(
    phone: string
  ): Promise<{ success: boolean; demoCode?: string; error?: string }> {
    const normalizedPhone = normalizePhone(phone);

    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
    });

    if (error) {
      console.error('OTP gönderilemedi:', error);

      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  },

  async verifyOtp(
    phone: string,
    otpCode: string
  ): Promise<{
    success: boolean;
    isNewUser: boolean;
    user?: UserProfile;
    error?: string;
  }> {
    const normalizedPhone = normalizePhone(phone);

    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalizedPhone,
      token: otpCode,
      type: 'sms',
    });

    if (error || !data.user) {
      console.error('OTP doğrulama başarısız:', error);

      return {
        success: false,
        isNewUser: false,
        error: error?.message || 'Kod doğrulanamadı.',
      };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (!profile) {
      return {
        success: true,
        isNewUser: true,
      };
    }

    const trust = await getTrustProfileRow(profile.id);
    const user = mapProfile(profile, trust);

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify(user)
    );

    return {
      success: true,
      isNewUser: false,
      user,
    };
  },

  async createProfile(data: {
    phone: string;
    fullName: string;
    city: string;
    district: string;
    avatarUrl?: string;
    interests?: CategoryId[];
    wantedCategories?: CategoryId[];
  }): Promise<UserProfile | undefined> {
    const {
      data: authData,
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      console.error('Profil oluşturmak için giriş gerekli:', authError);

      return undefined;
    }

    const userId = authData.user.id;
    const phone = normalizePhone(data.phone);

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          phone,
          full_name: data.fullName,
          city: data.city,
          district: data.district,
          avatar_url: data.avatarUrl ?? null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'id',
        }
      )
      .select('*')
      .single();

    if (error || !profile) {
      console.error('Profil oluşturulamadı:', error);

      return undefined;
    }

    const trust = await getTrustProfileRow(profile.id);
    const newUser = mapProfile(profile, trust);

    newUser.interests = data.interests ?? [];
    newUser.wantedCategories = data.wantedCategories ?? [];

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify(newUser)
    );

    return newUser;
  },

  async getCurrentUserFromSupabase(): Promise<UserProfile | null> {
    const {
      data: authData,
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return null;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (error || !profile) {
      return null;
    }

    const trust = await getTrustProfileRow(profile.id);
    const user = mapProfile(profile, trust);

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify(user)
    );

    return user;
  },

  getCurrentUser(): UserProfile {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // devam
      }
    }

    return CURRENT_USER;
  },

  isOnboardingDone(): boolean {
    return (
      localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true'
    );
  },

  setOnboardingDone(done = true) {
    localStorage.setItem(
      ONBOARDING_COMPLETED_KEY,
      done ? 'true' : 'false'
    );
  },

  async logout() {
    await supabase.auth.signOut();

    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
  },

  async updateUserProfile(
    updates: Partial<UserProfile>
  ): Promise<UserProfile | undefined> {
    const {
      data: authData,
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return undefined;
    }

    const dbUpdates: TablesUpdate<'profiles'> = {};

    if (updates.fullName !== undefined) {
      dbUpdates.full_name = updates.fullName;
    }

    if (updates.avatarUrl !== undefined) {
      dbUpdates.avatar_url = updates.avatarUrl;
    }

    if (updates.city !== undefined) {
      dbUpdates.city = updates.city;
    }

    if (updates.district !== undefined) {
      dbUpdates.district = updates.district;
    }

    if (updates.bio !== undefined) {
      dbUpdates.bio = updates.bio;
    }

    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', authData.user.id)
      .select('*')
      .single();

    if (error || !data) {
      console.error('Profil güncellenemedi:', error);
      return undefined;
    }

    const trust = await getTrustProfileRow(data.id);
    const user = mapProfile(data, trust);

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify(user)
    );

    return user;
  },
};