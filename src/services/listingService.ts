import {
  Listing,
  CategoryId,
  ListingCondition,
} from '../types';

import { impactService } from './impactService';
import { supabase } from '../lib/supabase';
import type { TablesUpdate } from '../types/supabase';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6bafeb?w=800&auto=format&fit=crop&q=80';

const LISTING_IMAGES_BUCKET = 'listing-images';

/**
 * Varsayılan sayfa boyutu.
 *
 * Önceden hiçbir listede sayfalama yoktu: getAllListings / searchListings /
 * getAllTrades eşleşen TÜM satırları çekiyordu. supabase/config.toml içinde
 * `max_rows = 1000` tanımlı olduğu için, veri büyüdüğünde sonuçlar hata
 * vermeden sessizce kesilmeye başlayacaktı (bkz. denetim bulgusu D-02).
 */
export const DEFAULT_PAGE_SIZE = 24;

export interface PageOptions {
  /** 0'dan başlar. */
  page?: number;
  pageSize?: number;
}

function applyRange<T>(request: T, options?: PageOptions): T {
  const page = options?.page ?? 0;
  const size = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = page * size;

  return (request as any).range(from, from + size - 1) as T;
}

/**
 * İlan sorgularında kullanılan ortak select.
 *
 * Profil join'i artık `profiles(*)` DEĞİL: açık kolon listesi. `profiles`
 * satırı `phone` kolonunu da içeriyor ve `*` ile çekildiğinde başka
 * kullanıcıların telefon numarası tel üzerinden istemciye iniyordu.
 * mapListing() zaten yalnızca aşağıdaki alanları kullanıyor.
 */
const LISTING_SELECT =
  '*, user:profiles(id, full_name, avatar_url, city, district), images:listing_images(storage_path)';

/**
 * Kullanıcı girdisini PostgREST filtre dizesine gömülebilir hale getirir.
 *
 * PostgREST, `.or()` dizesinde virgülü koşul ayracı, parantezi gruplayıcı,
 * noktayı ise operatör ayracı olarak yorumlar. Girdi kaçırılmadan
 * gömüldüğünde "kamera, tripod" gibi masum bir arama bile filtreyi bozuyor,
 * kasıtlı bir girdi ise sorguya ek koşul enjekte edebiliyordu.
 *
 * PostgREST, çift tırnak içine alınmış değerlerde bu karakterleri veri olarak
 * kabul eder; bu yüzden değeri tırnaklıyor, içindeki ters bölü ve çift tırnak
 * karakterlerini de kaçırıyoruz.
 */
function quoteFilterValue(value: string): string {
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  // Joker karakter olarak PostgREST'in `*` kısaltması yerine doğrudan SQL'in
  // `%` karakteri kullanılıyor: `*` yalnızca tırnaksız değerlerde joker
  // sayılıyor, tırnak içinde düz karakter olarak geçebiliyor. `%` ise LIKE
  // desenine olduğu gibi aktarıldığı için her iki durumda da çalışır.
  return `"%${escaped}%"`;
}

/**
 * Kullanıcının seçtiği gerçek fotoğrafları Supabase Storage'a yükler ve
 * herkese açık (public) URL'lerini döndürür. Bucket ve RLS politikaları
 * için bkz. supabase/migrations/20260818150000_create_listing_images_storage_bucket.sql
 *
 * ÖNEMLİ: Dosya yolu (`{ownerId}/{dosya}`) RLS politikasının
 * `(storage.foldername(name))[1] = auth.uid()::text` kontrolüyle
 * eşleşmek ZORUNDA. Bu yüzden `userId` parametresi yerine, isteği
 * gerçekten yapacak olan Supabase oturumundaki `auth.uid()` kullanılıyor
 * (`supabase.auth.getUser()`). Eğer bu ikisi (uygulamanın yerel
 * `currentUser.id`'si ile gerçek oturum kullanıcısı) farklıysa, ya da
 * hiç aktif oturum yoksa (süresi dolmuş / hiç giriş yapılmamış), yükleme
 * "new row violates row-level security policy" hatasıyla reddedilir —
 * bu artık konsola net bir teşhis mesajıyla loglanıyor.
 *
 * Dönen dizi, `files` ile AYNI SIRA ve AYNI UZUNLUKTADIR — bir dosya
 * yüklenemezse o index'te `null` döner (çağıran taraf pozisyona göre
 * eşleştirme yapabilsin diye; array.filter ile sessizce atlarsak sıra
 * kayar ve yanlış görsel yanlış slota eşlenebilir).
 */
export async function uploadListingImages(
  userId: string,
  files: File[]
): Promise<(string | null)[]> {
  if (!files.length) return [];

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    console.error(
      'Fotoğraf yüklenemedi: geçerli bir Supabase oturumu bulunamadı. ' +
        'Kullanıcı arayüzde "giriş yapılmış" görünse bile, gerçek Supabase ' +
        'oturumu sona ermiş olabilir (localStorage önbelleği ile Supabase ' +
        'auth session farklı şeylerdir). Çözüm: kullanıcının tekrar giriş ' +
        '(telefon+OTP) yapması gerekiyor.',
      authError
    );
    return files.map(() => null);
  }

  if (authData.user.id !== userId) {
    console.warn(
      'Uyarı: uygulamanın önbellekteki currentUser.id değeri ile gerçek ' +
        'Supabase oturum kullanıcı id\'si FARKLI. RLS kontrolü oturumdaki ' +
        'id\'ye göre yapılacağı için yükleme buna göre devam ediyor.',
      { sessionUserId: authData.user.id, cachedUserId: userId }
    );
  }

  // RLS foldername kontrolü auth.uid()'e göre çalıştığı için, path'te
  // parametre olarak gelen userId değil, gerçek oturum id'si kullanılır.
  const ownerId = authData.user.id;

  const results: (string | null)[] = [];

  for (const file of files) {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const randomId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const path = `${ownerId}/${randomId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(LISTING_IMAGES_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Fotoğraf yüklenemedi:', file.name, uploadError);
      results.push(null);
      continue;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(LISTING_IMAGES_BUCKET).getPublicUrl(path);

    results.push(publicUrl);
  }

  return results;
}

async function getCategoryUuid(
  categoryId: CategoryId | string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categoryId)
    .maybeSingle();

  if (error) {
    console.error('Kategori bulunamadı:', error);
    return null;
  }

  return data?.id ?? null;
}

async function getCategorySlug(
  categoryUuid: string
): Promise<string> {
  const { data } = await supabase
    .from('categories')
    .select('slug')
    .eq('id', categoryUuid)
    .maybeSingle();

  return data?.slug ?? categoryUuid;
}

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

function mapListing(row: any): Listing {
  const categoryId = row.category_slug ?? row.category_id;

  const trustSummary = row.owner_trust_summary ?? {
    reviewCount: 0,
    averageRating: 0,
    completedTrades: 0,
  };

  const estimatedImpact =
    impactService.calculateListingImpact(
      categoryId as CategoryId,
      row.condition as ListingCondition
    );

  // row.user, Supabase join'inden (`user:profiles(*)`) gelen HAM profil
  // satırıdır (snake_case: full_name, avatar_url...) — Listing['user']
  // tipinin beklediği camelCase şekille birebir aynı DEĞİLDİR. Önceden
  // bu ham satır doğrudan atanıyordu ve `trustScore` alanı hiç var
  // olmadığı için ProductCard'da `.toFixed(1)` çağrısı patlıyordu.
  // Burada doğru şekilde eşleniyor; güven puanı enrichListings'te
  // ayrıca hesaplanıp `row.owner_trust_score` olarak taşınıyor.
  const mappedUser = row.user
    ? {
        id: row.user.id ?? row.owner_id,
        fullName: row.user.full_name ?? 'Swaloop Kullanıcısı',
        avatarUrl: row.user.avatar_url || DEFAULT_AVATAR,
        trustScore: row.owner_trust_score ?? 5,
        city: row.user.city ?? '',
        district: row.user.district ?? '',
        // Önceden sabit `true` idi: her ilan sahibi doğrulanmış rozetiyle
        // görünüyordu. Artık trust_profiles.verification_level'dan geliyor.
        isVerified: row.owner_is_verified ?? false,
        ...trustSummary,
      }
    : {
        id: row.owner_id,
        fullName: 'Swaloop Kullanıcısı',
        avatarUrl: DEFAULT_AVATAR,
        trustScore: row.owner_trust_score ?? 5,
        city: row.city ?? '',
        district: row.district ?? '',
        isVerified: false,
        ...trustSummary,
      };

  return {
    id: row.id,

    userId: row.owner_id,

    user: mappedUser,

    title: row.title ?? '',
    description: row.description ?? '',

    categoryId: categoryId as CategoryId,

    condition: row.condition as ListingCondition,

    // BURASI GÜNCELLENDİ: Fotoğrafları objeden string'e çeviriyor
    images:
      Array.isArray(row.images) && row.images.length
        ? row.images.map((img: any) => typeof img === 'string' ? img : img.storage_path || img)
        : [DEFAULT_IMAGE],

    location: {
      city: row.city ?? '',
      district: row.district ?? '',
      lat: row.latitude ?? 0,
      lng: row.longitude ?? 0,
      distanceKm: row.distance_km ?? 0,
    },

    lookingFor: row.looking_for ?? '',

    deliveryOptions:
      Array.isArray(row.delivery_options)
        ? row.delivery_options
        : ['in_person'],

    estimatedImpact,

    status: row.status ?? 'active',

    createdAt: row.created_at,
    updatedAt: row.updated_at,

    viewCount: row.view_count ?? 0,
    favoriteCount: row.favorite_count ?? 0,
    isFavorite: row.is_favorite ?? false,

    tags: Array.isArray(row.tags) ? row.tags : [],
  };
}

export async function enrichListings(rows: any[]): Promise<Listing[]> {
  if (!rows.length) return [];

  const categoryIds = [
    ...new Set(
      rows
        .map((row) => row.category_id)
        .filter(Boolean)
    ),
  ];

  let categoryMap = new Map<string, string>();

  if (categoryIds.length) {
    const { data } = await supabase
      .from('categories')
      .select('id, slug')
      .in('id', categoryIds);

    for (const category of data ?? []) {
      categoryMap.set(category.id, category.slug);
    }
  }

  // İlan sahiplerinin gerçek güven puanını (trust_profiles.trust_score)
  // topluca çekiyoruz. Önceden bu hiç yapılmıyordu ve ProductCard'ın
  // beklediği `user.trustScore` alanı DB'den gelen ham `profiles` satırında
  // hiç yoktu (yalnızca `trust_profiles` tablosunda tutuluyor) — bu da
  // "Cannot read properties of undefined (reading 'toFixed')" hatasına
  // yol açıyordu. Skor bulunamazsa 5 (varsayılan başlangıç puanı) kullanılır.
  const ownerIds = [
    ...new Set(rows.map((row) => row.owner_id).filter(Boolean)),
  ];

  let trustScoreMap = new Map<string, number>();
  let verifiedMap = new Map<string, boolean>();
  // Değerlendirme özeti de aynı sorgudan taşınıyor: ilan kartları ve ürün
  // detayındaki TrustCard önceden bu sayıları uyduruyordu (sabit 14 takas,
  // 12 değerlendirme, 4.9 ortalama).
  let trustSummaryMap = new Map<
    string,
    { reviewCount: number; averageRating: number; completedTrades: number }
  >();

  if (ownerIds.length) {
    const { data: trustRows } = await supabase
      .from('trust_profiles')
      .select('user_id, trust_score, verification_level, review_count, average_rating, completed_trades')
      .in('user_id', ownerIds);

    for (const t of trustRows ?? []) {
      if (t.user_id != null && t.trust_score != null) {
        trustScoreMap.set(t.user_id, t.trust_score);
      }
      if (t.user_id != null) {
        verifiedMap.set(t.user_id, t.verification_level === 'id_verified');
        trustSummaryMap.set(t.user_id, {
          reviewCount: t.review_count ?? 0,
          averageRating: Number(t.average_rating ?? 0),
          completedTrades: t.completed_trades ?? 0,
        });
      }
    }
  }

  return rows.map((row) => ({
    ...row,
    category_slug:
      categoryMap.get(row.category_id) ?? row.category_id,
    owner_trust_score: trustScoreMap.get(row.owner_id) ?? 5,
    owner_is_verified: verifiedMap.get(row.owner_id) ?? false,
    owner_trust_summary: trustSummaryMap.get(row.owner_id) ?? null,
  })).map(mapListing);
}

export const listingService = {
  async getAllListings(options?: PageOptions): Promise<Listing[]> {
    const { data, error } = await applyRange(
      supabase
        .from('listings')
        .select(LISTING_SELECT)
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
      options
    );

    if (error) {
      console.error('Listings alınamadı:', error);
      return [];
    }

    return enrichListings(data ?? []);
  },

  async getListingById(
    id: string
  ): Promise<Listing | undefined> {
    // BURASI GÜNCELLENDİ
    const { data, error } = await supabase
      .from('listings')
      .select(LISTING_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      console.error('İlan alınamadı:', error);
      return undefined;
    }

    const [listing] = await enrichListings([data]);

    return listing;
  },

  async getUserListings(
    userId: string
  ): Promise<Listing[]> {
    // BURASI GÜNCELLENDİ
    const { data, error } = await supabase
      .from('listings')
      .select(LISTING_SELECT)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(
        'Kullanıcı ilanları alınamadı:',
        error
      );

      return [];
    }

    return enrichListings(data ?? []);
  },

  async createListing(data: {
    userId: string;
    user: Listing['user'];
    title: string;
    description: string;
    categoryId: CategoryId;
    condition: ListingCondition;
    images: string[];
    location: Listing['location'];
    lookingFor: string;
    deliveryOptions: (
      | 'in_person'
      | 'cargo'
      | 'safe_point'
    )[];
    tags?: string[];
  }): Promise<Listing | undefined> {
    const categoryUuid = await getCategoryUuid(
      data.categoryId
    );

    if (!categoryUuid) {
      console.error(
        'Geçersiz kategori:',
        data.categoryId
      );

      return undefined;
    }

    const { data: created, error } = await supabase
      .from('listings')
      .insert({
        owner_id: data.userId,
        title: data.title,
        description: data.description,
        category_id: categoryUuid,
        condition: data.condition,
        city: data.location.city,
        district: data.location.district,
        latitude: data.location.lat ?? null,
        longitude: data.location.lng ?? null,
        looking_for: data.lookingFor,
        delivery_options: data.deliveryOptions,
        tags: data.tags ?? [],
        status: 'active',
      })
      .select('*')
      .single();

    if (error || !created) {
      console.error(
        'İlan oluşturulamadı:',
        error
      );

      return undefined;
    }

    if (data.images.length > 0) {
      const imageRows = data.images.map(
        (url, index) => ({
          listing_id: created.id,
          storage_path: url,
          sort_order: index,
        })
      );

      const { error: imageError } =
        await supabase
          .from('listing_images')
          .insert(imageRows);

      if (imageError) {
        console.warn(
          'İlan oluşturuldu fakat fotoğraflar kaydedilemedi:',
          imageError
        );
      }
    }

    const listing = mapListing({
      ...created,
      category_slug: data.categoryId,
    });

    return {
      ...listing,

      userId: data.userId,
      user: data.user,

      images:
        data.images.length > 0
          ? data.images
          : [DEFAULT_IMAGE],

      location: data.location,

      lookingFor: data.lookingFor,

      deliveryOptions: data.deliveryOptions,

      tags: data.tags ?? [],

      viewCount: 0,
      favoriteCount: 0,
      isFavorite: false,
    };
  },

  async updateListing(
    id: string,
    updates: Partial<Listing>
  ): Promise<Listing | undefined> {
    const updateData: TablesUpdate<'listings'> = {};

    if (updates.title !== undefined) {
      updateData.title = updates.title;
    }

    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }

    if (updates.condition !== undefined) {
      updateData.condition = updates.condition;
    }

    if (updates.categoryId !== undefined) {
      const categoryUuid =
        await getCategoryUuid(
          updates.categoryId
        );

      if (!categoryUuid) {
        console.error(
          'Kategori bulunamadı:',
          updates.categoryId
        );

        return undefined;
      }

      updateData.category_id = categoryUuid;
    }

    if (updates.location) {
      updateData.city =
        updates.location.city;

      updateData.district =
        updates.location.district;

      updateData.latitude =
        updates.location.lat;

      updateData.longitude =
        updates.location.lng;
    }

    if (updates.status !== undefined) {
      updateData.status = updates.status;
    }

    if (updates.lookingFor !== undefined) {
      updateData.looking_for = updates.lookingFor;
    }

    if (updates.deliveryOptions !== undefined) {
      updateData.delivery_options = updates.deliveryOptions;
    }

    if (updates.tags !== undefined) {
      updateData.tags = updates.tags;
    }

    updateData.updated_at =
      new Date().toISOString();

    const { data, error } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error || !data) {
      console.error(
        'İlan güncellenemedi:',
        error
      );

      return undefined;
    }

    const [listing] =
      await enrichListings([data]);

    return listing;
  },

  async deleteListing(
    id: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(
        'İlan silinemedi:',
        error
      );

      return false;
    }

    return true;
  },

  /**
   * İlan detayı açıldığında görüntülenme sayacını artırır.
   *
   * İstemciden doğrudan UPDATE verilmiyor (RLS zaten izin vermezdi): sayaç
   * `increment_listing_view` RPC'si üzerinden artıyor ve kendi ilanına
   * bakmak sayacı artırmıyor.
   */
  async incrementView(listingId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_listing_view', {
      p_listing_id: listingId,
    });

    if (error) {
      // Sayaç kritik değil: hata kullanıcıya gösterilmez, akış kesilmez.
      console.warn('Görüntülenme sayacı artırılamadı:', error);
    }
  },

  async toggleFavorite(
    id: string
  ): Promise<boolean> {
    const {
      data: userData,
    } = await supabase.auth.getUser();

    const userId =
      userData.user?.id;

    if (!userId) {
      console.warn(
        'Favori işlemi için giriş gerekli.'
      );

      return false;
    }

    const {
      data: existing,
    } = await supabase
      .from('favorites')
      .select('id')
      .eq('listing_id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      const { error } =
        await supabase
          .from('favorites')
          .delete()
          .eq('id', existing.id);

      if (error) {
        console.error(
          'Favori kaldırılamadı:',
          error
        );

        return false;
      }

      return false;
    }

    const { error } =
      await supabase
        .from('favorites')
        .insert({
          listing_id: id,
          user_id: userId,
        });

    if (error) {
      console.error(
        'Favori eklenemedi:',
        error
      );

      return false;
    }

    return true;
  },

  async getFavorites(): Promise<Listing[]> {
    const {
      data: userData,
    } = await supabase.auth.getUser();

    const userId =
      userData.user?.id;

    if (!userId) {
      return [];
    }

    const {
      data,
      error,
    } = await supabase
      .from('favorites')
      .select('listing_id')
      .eq('user_id', userId);

    if (error || !data) {
      return [];
    }

    const ids =
      data.map(
        (item) => item.listing_id
      );

    if (!ids.length) {
      return [];
    }

    const {
      data: listings,
      error: listingsError,
    } = await supabase
      .from('listings')
      .select(LISTING_SELECT) // BURASI DA GÜNCELLENDİ
      .in('id', ids);

    if (
      listingsError ||
      !listings
    ) {
      return [];
    }

    return enrichListings(
      listings
    );
  },

  async searchListings(
    query: string,
    categoryId?: string,
    condition?: string,
    maxDistance?: number,
    options?: PageOptions
  ): Promise<Listing[]> {
    // BURASI GÜNCELLENDİ
    let request = supabase
      .from('listings')
      .select(LISTING_SELECT)
      .eq('status', 'active')
      .order('created_at', {
        ascending: false,
      });

    const cleanQuery =
      query.trim();

    if (cleanQuery) {
      const pattern = quoteFilterValue(cleanQuery);

      request = request.or(
        `title.ilike.${pattern},description.ilike.${pattern}`
      );
    }

    if (
      categoryId &&
      categoryId !== 'all'
    ) {
      const categoryUuid =
        await getCategoryUuid(
          categoryId
        );

      if (!categoryUuid) {
        return [];
      }

      request = request.eq(
        'category_id',
        categoryUuid
      );
    }

    if (
      condition &&
      condition !== 'all'
    ) {
      request = request.eq(
        'condition',
        condition
      );
    }

    const {
      data,
      error,
    } = await applyRange(request, options);

    if (error) {
      console.error(
        'İlan araması başarısız:',
        error
      );

      return [];
    }

    let listings =
      await enrichListings(
        data ?? []
      );

    if (
      maxDistance !== undefined &&
      maxDistance > 0
    ) {
      listings =
        listings.filter(
          (listing) =>
            listing.location
              .distanceKm <=
            maxDistance
        );
    }

    return listings;
  },
};