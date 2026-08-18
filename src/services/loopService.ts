import { Loop, LoopParticipant, CategoryId } from '../types';
import { supabase } from '../lib/supabase';
import { impactService } from './impactService';
import { mapProfile } from './authService';
import { enrichListings } from './listingService';
import type { TablesInsert, TablesUpdate } from '../types/supabase';

// ─────────────────────────────────────────────────────────────────────────
// NOT: Bu dosya artık mockData yerine gerçek Supabase sorguları kullanıyor.
//
// DB şeması ile frontend `Loop`/`LoopParticipant` tipleri arasındaki fark
// (bkz. swaloop-devam-plani.md §10):
//  - `loops`            : id, creator_id, title, description, category,
//                          max_participants, status, created_at, updated_at.
//  - `loop_participants`: id, loop_id, user_id, offering_listing_id, role,
//                          status, joined_at.
//
// DB'de "kim kime veriyor" (gives_to/receives_from) diye ayrı bir kolon
// YOK — trade sistemindeki 6 adımlı timeline kararıyla aynı desen izlendi
// (bkz. §5.2): UI'ya özgü bu bilgi DB'de tutulmuyor, `joined_at` sırasına
// göre İSTEMCİ TARAFINDA hesaplanıyor. Döngü dairesel olduğu için i.
// katılımcı her zaman (i+1). katılımcıya verir, (i-1). katılımcıdan alır.
// Bu, katılımcı sırası sabit kaldığı sürece tutarlıdır (sıralama `joined_at`
// ile sabitlendiği için katılımcı eklenmediği sürece değişmez).
//
// `loops.status` ve `loop_participants.status` DB'de düz `text` — frontend'in
// beklediği union değerlerinden (`matching|locked|in_delivery|completed|
// cancelled` / `pending|confirmed|delivered|completed`) FARKLI bir legacy
// default'a (`'active'`) sahipler (bkz. migration
// 20260818160000_extend_loops_for_listings.sql). Uygulama satır
// oluştururken durumu her zaman açıkça doğru değerle yazacak; okurken de
// tanınmayan bir DB değeriyle karşılaşılırsa güvenli bir varsayılana
// (`matching` / `pending`) düşülüyor.
// ─────────────────────────────────────────────────────────────────────────

const LOOP_STATUSES = ['matching', 'locked', 'in_delivery', 'completed', 'cancelled'] as const;
const PARTICIPANT_STATUSES = ['pending', 'confirmed', 'delivered', 'completed'] as const;

function normalizeLoopStatus(status: string | null | undefined): Loop['status'] {
  return (LOOP_STATUSES as readonly string[]).includes(status ?? '')
    ? (status as Loop['status'])
    : 'matching';
}

function normalizeParticipantStatus(status: string | null | undefined): LoopParticipant['status'] {
  return (PARTICIPANT_STATUSES as readonly string[]).includes(status ?? '')
    ? (status as LoopParticipant['status'])
    : 'pending';
}

const LOOP_SELECT =
  '*, participants:loop_participants(*, user:profiles(*), listing:listings(*, user:profiles(*), images:listing_images(storage_path)))';

type LoopParticipantRow = {
  id: string;
  loop_id: string;
  user_id: string;
  offering_listing_id: string | null;
  role: string;
  status: string;
  joined_at: string;
  user?: any;
  listing?: any;
};

type LoopRow = {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  category: string;
  max_participants: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  participants?: LoopParticipantRow[];
};

async function hydrateLoop(row: LoopRow): Promise<Loop> {
  // Yalnızca bir ilan seçmiş (offering_listing_id dolu) katılımcılar tam
  // olarak "hazır" sayılır — henüz ilan seçmemiş bir katılım satırı olursa
  // (ör. gelecekte eklenecek "önce katıl, ilanı sonra seç" akışı) dairesel
  // zincir hesaplamasını bozmaması için bunlar dışarıda bırakılıyor.
  const readyRows = (row.participants ?? [])
    .filter((p) => p.offering_listing_id && p.listing)
    .sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime());

  const offeringListings = await enrichListings(readyRows.map((p) => p.listing));

  const base: Omit<LoopParticipant, 'givesToUserId' | 'receivesFromUserId' | 'receivingListing'>[] =
    readyRows.map((p, idx) => ({
      userId: p.user_id,
      user: mapProfile(p.user),
      offeringListing: offeringListings[idx],
      hasConfirmed: p.status === 'confirmed' || p.status === 'delivered' || p.status === 'completed',
      status: normalizeParticipantStatus(p.status),
    }));

  const n = base.length;
  const participants: LoopParticipant[] = base.map((p, idx) => {
    const next = base[(idx + 1) % n];
    const prev = base[(idx - 1 + n) % n];
    return {
      ...p,
      givesToUserId: next?.userId ?? p.userId,
      receivesFromUserId: prev?.userId ?? p.userId,
      receivingListing: prev?.offeringListing ?? p.offeringListing,
    };
  });

  const totalImpact = impactService.calculateCombinedTradeImpact(
    participants.map((p) => p.offeringListing.estimatedImpact)
  );

  return {
    id: row.id,
    title: row.title,
    category: (row.category ?? 'other') as CategoryId,
    totalParticipants: row.max_participants ?? participants.length,
    participants,
    status: normalizeLoopStatus(row.status),
    totalImpact,
    createdAt: row.created_at,
    completedAt: normalizeLoopStatus(row.status) === 'completed' ? row.updated_at : undefined,
  };
}

export const loopService = {
  async getLoops(): Promise<Loop[]> {
    const { data, error } = await supabase
      .from('loops')
      .select(LOOP_SELECT)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Döngüler getirilemedi:', error);
      return [];
    }

    return Promise.all(((data ?? []) as unknown as LoopRow[]).map(hydrateLoop));
  },

  async getLoopById(id: string): Promise<Loop | undefined> {
    const { data, error } = await supabase
      .from('loops')
      .select(LOOP_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error('Döngü getirilemedi:', error);
      return undefined;
    }

    return hydrateLoop(data as unknown as LoopRow);
  },

  /**
   * Yeni bir döngü açar ve kurucuyu ilk katılımcı olarak ekler.
   * NOT: Bu metodu çağıran bir UI şu an yok (LoopsPage.tsx sadece mevcut
   * döngüleri listeliyor) — gelecekteki "döngü oluştur" akışı için hazır
   * tutuluyor. Bkz. swaloop-devam-plani.md §10.
   */
  async createLoop(
    creatorId: string,
    listingId: string,
    title: string,
    category: CategoryId,
    maxParticipants: number = 3,
    description?: string
  ): Promise<Loop | undefined> {
    const loopInsert: TablesInsert<'loops'> = {
      creator_id: creatorId,
      title,
      category,
      description: description ?? null,
      max_participants: maxParticipants,
      status: 'matching',
    };

    const { data: loopRow, error: loopError } = await supabase
      .from('loops')
      .insert(loopInsert)
      .select()
      .single();

    if (loopError || !loopRow) {
      console.error('Döngü oluşturulamadı:', loopError);
      return undefined;
    }

    const participantInsert: TablesInsert<'loop_participants'> = {
      loop_id: loopRow.id,
      user_id: creatorId,
      offering_listing_id: listingId,
      role: 'creator',
      status: 'pending',
    };

    const { error: participantError } = await supabase
      .from('loop_participants')
      .insert(participantInsert);

    if (participantError) {
      console.error('Döngü katılımcısı eklenemedi:', participantError);
      return undefined;
    }

    return this.getLoopById(loopRow.id);
  },

  /**
   * Bir kullanıcıyı, seçtiği ilanla birlikte var olan bir döngüye katar.
   * Döngü dolarsa (katılımcı sayısı max_participants'a ulaşırsa) durumu
   * otomatik olarak 'locked'e çevirir.
   */
  async joinLoop(loopId: string, userId: string, listingId: string): Promise<Loop | undefined> {
    const participantInsert: TablesInsert<'loop_participants'> = {
      loop_id: loopId,
      user_id: userId,
      offering_listing_id: listingId,
      role: 'member',
      status: 'pending',
    };

    const { error: insertError } = await supabase
      .from('loop_participants')
      .insert(participantInsert);

    if (insertError) {
      console.error('Döngüye katılınamadı:', insertError);
      return undefined;
    }

    const { data: loopRow } = await supabase
      .from('loops')
      .select('max_participants')
      .eq('id', loopId)
      .maybeSingle();

    const { count } = await supabase
      .from('loop_participants')
      .select('id', { count: 'exact', head: true })
      .eq('loop_id', loopId);

    if (loopRow?.max_participants && (count ?? 0) >= loopRow.max_participants) {
      const lockUpdate: TablesUpdate<'loops'> = { status: 'locked' };
      await supabase.from('loops').update(lockUpdate).eq('id', loopId);
    }

    return this.getLoopById(loopId);
  },

  async confirmParticipantStep(loopId: string, userId: string): Promise<Loop | undefined> {
    const participantUpdate: TablesUpdate<'loop_participants'> = { status: 'confirmed' };

    const { error: updateError } = await supabase
      .from('loop_participants')
      .update(participantUpdate)
      .eq('loop_id', loopId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Döngü adımı onaylanamadı:', updateError);
      return undefined;
    }

    const { data: participantRows, error: fetchError } = await supabase
      .from('loop_participants')
      .select('status')
      .eq('loop_id', loopId);

    if (fetchError) {
      console.error('Döngü katılımcıları getirilemedi:', fetchError);
    } else {
      const allConfirmed = (participantRows ?? []).every((p) =>
        ['confirmed', 'delivered', 'completed'].includes(p.status)
      );

      if (allConfirmed) {
        const loopUpdate: TablesUpdate<'loops'> = { status: 'in_delivery' };
        await supabase.from('loops').update(loopUpdate).eq('id', loopId);
      }
    }

    return this.getLoopById(loopId);
  },

  async completeLoop(loopId: string): Promise<Loop | undefined> {
    const loopUpdate: TablesUpdate<'loops'> = { status: 'completed' };
    const { error: loopError } = await supabase.from('loops').update(loopUpdate).eq('id', loopId);

    if (loopError) {
      console.error('Döngü tamamlanamadı:', loopError);
      return undefined;
    }

    const participantUpdate: TablesUpdate<'loop_participants'> = { status: 'completed' };
    await supabase.from('loop_participants').update(participantUpdate).eq('loop_id', loopId);

    return this.getLoopById(loopId);
  },
};
