import { UserProfile, CategoryId } from '../types';
import { CURRENT_USER } from '../data/mockData';

// Simulated registered phone numbers database
const REGISTERED_PHONES = new Set<string>([
  '+90 532 890 12 34', // Berke Çelik (Demo user)
  '+90 544 123 45 67', // Aslı T.
  '+90 533 765 43 21', // Mehmet K.
  '+90 555 987 65 43', // Zeynep B.
]);

const AUTH_STORAGE_KEY = 'swaloop_auth_user';
const ONBOARDING_COMPLETED_KEY = 'swaloop_onboarding_done';

export interface PhoneCheckResult {
  exists: boolean;
  message: string;
}

export const authService = {
  /**
   * Normalizes Turkish phone number to +90 5XX XXX XX XX format
   */
  formatPhoneNumber(raw: string): string {
    const cleaned = raw.replace(/\D/g, '');
    let digits = cleaned;
    if (digits.startsWith('90')) digits = digits.slice(2);
    if (digits.startsWith('0')) digits = digits.slice(1);
    
    // Take max 10 digits (5XX XXX XX XX)
    digits = digits.slice(0, 10);
    
    if (digits.length === 0) return '';
    if (digits.length <= 3) return `+90 ${digits}`;
    if (digits.length <= 6) return `+90 ${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 8) return `+90 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `+90 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  },

  isValidPhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    const digits = cleaned.startsWith('90') ? cleaned.slice(2) : cleaned;
    return digits.length === 10 && digits.startsWith('5');
  },

  checkPhoneRegistered(formattedPhone: string): PhoneCheckResult {
    const exists = REGISTERED_PHONES.has(formattedPhone);
    return {
      exists,
      message: exists
        ? 'Bu telefon numarasına ait aktif bir Swaloop hesabı zaten bulunmaktadır. Lütfen giriş yapınız.'
        : 'Telefon numarası kullanılabilir.',
    };
  },

  sendOtp(phone: string): Promise<{ success: boolean; demoCode: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // In real backend, SMS is triggered. In demo, code is '246810' or '123456'
        resolve({
          success: true,
          demoCode: '246810',
        });
      }, 500);
    });
  },

  verifyOtp(phone: string, otpCode: string): Promise<{ success: boolean; isNewUser: boolean; user?: UserProfile }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const isValid = otpCode === '246810' || otpCode === '123456' || otpCode.length === 6;
        if (!isValid) {
          resolve({ success: false, isNewUser: false });
          return;
        }

        const isRegistered = REGISTERED_PHONES.has(phone);
        if (isRegistered) {
          const user = { ...CURRENT_USER, phone };
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
          resolve({ success: true, isNewUser: false, user });
        } else {
          resolve({ success: true, isNewUser: true });
        }
      }, 400);
    });
  },

  createProfile(data: {
    phone: string;
    fullName: string;
    city: string;
    district: string;
    avatarUrl?: string;
    interests?: CategoryId[];
    wantedCategories?: CategoryId[];
  }): UserProfile {
    REGISTERED_PHONES.add(data.phone);
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      phone: data.phone,
      fullName: data.fullName,
      avatarUrl:
        data.avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      city: data.city,
      district: data.district,
      memberSince: 'Bugün',
      interests: data.interests || ['elektronik', 'spor'],
      wantedCategories: data.wantedCategories || ['elektronik', 'kitap_muzik'],
      isVerified: true,
      trustProfile: {
        score: 5.0,
        level: 'Başlangıç',
        phoneVerified: true,
        idVerified: false,
        successfulTradesCount: 0,
        cancellationRate: 0.0,
        responseRate: 1.0,
        averageRating: 5.0,
        reviewCount: 0,
        reportCount: 0,
        accountAgeDays: 1,
        positiveHighlights: ['Telefon doğrulandı', 'Yeni topluluk üyesi'],
      },
      stats: {
        totalTrades: 0,
        activeListings: 0,
        completedLoops: 0,
        totalCo2Prevented: 0,
        totalWaterSaved: 0,
        totalEnergySaved: 0,
        totalRawMaterialsSaved: 0,
        totalItemsReused: 0,
        responseRatePercent: 100,
        avgResponseTimeMinutes: 5,
        cancellationRatePercent: 0,
      },
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    return newUser;
  },

  getCurrentUser(): UserProfile {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...CURRENT_USER,
          ...parsed,
          trustProfile: {
            ...CURRENT_USER.trustProfile,
            ...(parsed.trustProfile || {}),
          },
          stats: {
            ...CURRENT_USER.stats,
            ...(parsed.stats || {}),
          },
        };
      } catch (e) {
        // Fallback to default
      }
    }
    return CURRENT_USER;
  },

  isOnboardingDone(): boolean {
    return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
  },

  setOnboardingDone(done = true) {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, done ? 'true' : 'false');
  },

  logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  updateUserProfile(updates: Partial<UserProfile>): UserProfile {
    const current = this.getCurrentUser();
    const updated = { ...current, ...updates };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },
};
