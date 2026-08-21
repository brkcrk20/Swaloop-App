import { UserProfile, CategoryId, TrustProfile } from '../types';
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

/**
 * Güven seviyesi yalnızca puana bakılarak belirlenemez: hiç takas yapmamış,
 * hiç değerlendirme almamış bir kullanıcının nötr başlangıç puanı (3.0) onu
 * "Güvenilir" gösterirdi. Geçmişi olmayan kullanıcı her zaman "Başlangıç".
 */
function trustLevel(
  score: number,
  reviewCount: number,
  completedTrades: number
): TrustProfile['level'] {
  if (reviewCount === 0 && completedTrades === 0) return 'Başlangıç';
  if (score >= 4.5) return 'Topluluk Lideri';
  if (score >= 3.5) return 'Çok Güvenilir';
  if (score >= 2.5) return 'Güvenilir';
  return 'Başlangıç';
}

/** get_user_stats RPC'sinin döndürdüğü satırı UserProfile['stats']'a çevirir. */
export function mapStats(row: any | null | undefined): UserProfile['stats'] {
  return {
    totalTrades: row?.completed_trades ?? 0,
    activeListings: row?.active_listings ?? 0,
    completedLoops: row?.completed_loops ?? 0,
    totalCo2Prevented: Number(row?.co2e_kg ?? 0),
    totalWaterSaved: Number(row?.water_liters ?? 0),
    totalEnergySaved: Number(row?.energy_kwh ?? 0),
    totalRawMaterialsSaved: Number(row?.material_kg ?? 0),
    totalItemsReused: row?.items_reused ?? 0,
    responseRatePercent: 100,
    avgResponseTimeMinutes: 0,
    cancellationRatePercent: 0,
  };
}

/**
 * Kullanıcının toplam çevresel etkisini ve takas sayılarını veritabanından
 * hesaplatır. impact_records üzerindeki RLS tek tek takas kayıtlarını gizli
 * tutar; bu RPC yalnızca TOPLAMLARI döndürür (security definer).
 */
export async function fetchUserStats(userId: string): Promise<UserProfile['stats']> {
  const { data, error } = await supabase
    .rpc('get_user_stats', { p_user_id: userId })
    .maybeSingle();

  if (error) {
    console.error('Kullanıcı istatistikleri alınamadı:', error);
    return mapStats(null);
  }

  return mapStats(data);
}

export function mapProfile(
  row: any,
  trust?: any | null,
  stats?: UserProfile['stats']
): UserProfile {
  const completedTrades = trust?.completed_trades ?? 0;
  const cancelledTrades = trust?.cancelled_trades ?? 0;
  const totalTrades = completedTrades + cancelledTrades;
  // Yeni kullanıcı için nötr başlangıç: 3.0. Önceden 5 idi ve hiç takas
  // yapmamış herkes "Topluluk Lideri" görünüyordu.
  const score = Number(trust?.trust_score ?? 3);
  const reviewCount = trust?.review_count ?? 0;
  const cancellationRate = totalTrades > 0 ? cancelledTrades / totalTrades : 0;

  const resolvedStats: UserProfile['stats'] = {
    ...(stats ?? mapStats(null)),
    totalTrades: stats?.totalTrades ?? completedTrades,
    responseRatePercent: Math.round((trust?.response_rate ?? 1) * 100),
    cancellationRatePercent: Math.round(cancellationRate * 100),
  };

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

    interests: (row.interests ?? []) as CategoryId[],
    wantedCategories: (row.wanted_categories ?? []) as CategoryId[],

    role: row.role === 'admin' || row.role === 'moderator' ? row.role : 'user',

    // Kimlik doğrulaması yalnızca trust_profiles.verification_level'dan
    // okunur. Önceden sabit `true` idi ve herkes doğrulanmış rozetiyle
    // görünüyordu — güven sinyali üreten bir üründe yanıltıcı bir gösterge.
    isVerified: trust?.verification_level === 'id_verified',

    trustProfile: {
      score,
      level: trustLevel(score, reviewCount, completedTrades),
      // Profil ancak telefon OTP'si doğrulandıktan sonra oluşabildiği için
      // bu alan gerçekten her zaman doğru.
      phoneVerified: true,
      idVerified: trust?.verification_level === 'id_verified',
      successfulTradesCount: completedTrades,
      cancellationRate,
      responseRate: trust?.response_rate ?? 1,
      // Artık gerçek: reviews tablosundan trigger ile hesaplanıp
      // trust_profiles'a yazılıyor (bkz. recalc_trust_profile).
      // Hiç değerlendirme yoksa average_rating NULL gelir; 0 göstermek
      // yanıltıcı olacağı için nötr 0 yerine reviewCount ile birlikte
      // yorumlanmalı — arayüz reviewCount === 0 ise puanı göstermez.
      averageRating: Number(trust?.average_rating ?? 0),
      reviewCount,
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

    stats: resolvedStats,
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

    // RLS açıldıktan sonra anon kullanıcı `profiles` tablosunu okuyamıyor.
    // Kontrol, yalnızca boolean döndüren `phone_exists` RPC'sine taşındı
    // (bkz. 20260821090000_enable_rls_all_tables.sql) — böylece kayıt akışı
    // çalışmaya devam ederken numara listesi dışarı sızmıyor.
    const { data, error } = await supabase.rpc('phone_exists', {
      check_phone: phone,
    });

    if (error) {
      console.error('Telefon kontrolü başarısız:', error);

      return {
        exists: false,
        message: 'Telefon kontrolü yapılamadı.',
      };
    }

    const exists = data === true;

    return {
      exists,
      message: exists
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

    const [trust, stats] = await Promise.all([
      getTrustProfileRow(profile.id),
      fetchUserStats(profile.id),
    ]);
    const user = mapProfile(profile, trust, stats);

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
          // Önceden bu iki alan hiç kaydedilmiyordu: kayıt sırasında seçilen
          // ilgi alanları ilk sayfa yenilemesinde kayboluyordu.
          interests: data.interests ?? [],
          wanted_categories: data.wantedCategories ?? [],
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

    const [trust, stats] = await Promise.all([
      getTrustProfileRow(profile.id),
      fetchUserStats(profile.id),
    ]);
    const newUser = mapProfile(profile, trust, stats);

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

    const [trust, stats] = await Promise.all([
      getTrustProfileRow(profile.id),
      fetchUserStats(profile.id),
    ]);
    const user = mapProfile(profile, trust, stats);

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify(user)
    );

    return user;
  },

  /**
   * Önbellekteki profili döndürür — YALNIZCA ilk boyama için bir ipucu olarak
   * kullanılmalıdır. Gerçek kaynak her zaman Supabase oturumudur; AppContext
   * açılışta getCurrentUserFromSupabase() ile bunu doğrular.
   *
   * Önceden burada oturum yoksa mock CURRENT_USER döndürülüyordu; bu yüzden
   * hiç giriş yapmamış bir ziyaretçi uygulamada "Berke Çelik" olarak oturum
   * açmış görünüyordu — ve o sahte kimlik geçerli bir UUID olmadığı için
   * onunla yapılan her yazma işlemi veritabanı seviyesinde patlıyordu.
   */
  getCachedUser(): UserProfile | null {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!saved) return null;

    try {
      const parsed = JSON.parse(saved) as UserProfile;
      return parsed && typeof parsed.id === 'string' ? parsed : null;
    } catch {
      return null;
    }
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

    if (updates.interests !== undefined) {
      dbUpdates.interests = updates.interests;
    }

    if (updates.wantedCategories !== undefined) {
      dbUpdates.wanted_categories = updates.wantedCategories;
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

    const [trust, stats] = await Promise.all([
      getTrustProfileRow(data.id),
      fetchUserStats(data.id),
    ]);
    const user = mapProfile(data, trust, stats);

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify(user)
    );

    return user;
  },

  /**
   * Başka bir kullanıcının herkese açık profilini getirir.
   *
   * PublicProfilePage önceden bu veriyi `OTHER_USERS` mock nesnesinden
   * okuyordu ve kimlik bulunamazsa listedeki İLK sahte kullanıcıyı
   * gösteriyordu — üstelik aynı sayfa ilanları ve değerlendirmeleri gerçek
   * veritabanından çekiyordu. Yani bir kişinin sahte adı, başka birinin
   * gerçek ilanlarıyla yan yana görünüyordu.
   *
   * Telefon kolonu bilerek seçilmiyor: başka kullanıcıların numarası
   * istemciye inmemeli.
   */
  async getPublicProfile(userId: string): Promise<UserProfile | null> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, city, district, bio, created_at, interests, wanted_categories, role')
      .eq('id', userId)
      .maybeSingle();

    if (error || !profile) {
      if (error) console.error('Profil alınamadı:', error);
      return null;
    }

    const [trust, stats] = await Promise.all([
      getTrustProfileRow(profile.id),
      fetchUserStats(profile.id),
    ]);

    return mapProfile(profile, trust, stats);
  },
};