-- =============================================================================
-- DÖNGÜ (LOOP) DURUM GEÇİŞLERİ — RPC'ye taşınıyor
-- =============================================================================
-- loops tablosuna RLS açıldığında (bkz. 20260821090000) `loops` satırını
-- yalnızca oluşturanı güncelleyebiliyor. Ama loopService'teki üç akış, döngüyü
-- oluşturan kişi OLMAYAN kullanıcıların da döngü durumunu değiştirmesini
-- gerektiriyordu:
--
--   · joinLoop()              — son katılımcı döngüyü 'locked' yapıyor
--   · confirmParticipantStep()— herkes onaylayınca 'in_delivery' yapılıyor
--   · completeLoop()          — döngü ve TÜM katılımcılar 'completed' yapılıyor
--
-- Bu üç geçişi istemciye açık bırakmak, "herkes her döngünün durumunu
-- değiştirebilir" demek olurdu. Bunun yerine geçişler, katılımcı olup
-- olmadığını kendisi doğrulayan iki `security definer` fonksiyona taşındı.
-- Durum artık istemcinin gönderdiği değere göre değil, katılımcı satırlarından
-- HESAPLANARAK belirleniyor.

-- Çağıranın döngüye katılımcı olup olmadığını söyler.
create or replace function public.is_loop_participant(p_loop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.loop_participants
    where loop_id = p_loop_id and user_id = auth.uid()
  );
$$;

grant execute on function public.is_loop_participant(uuid) to authenticated;


-- Döngü durumunu katılımcı satırlarından yeniden hesaplar.
--   · katılımcı sayısı max_participants'a ulaştıysa   → locked
--   · tüm katılımcılar onayladıysa                    → in_delivery
-- Tamamlanmış/iptal edilmiş döngülere dokunmaz.
create or replace function public.sync_loop_status(p_loop_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_loop public.loops%rowtype;
  v_total integer;
  v_confirmed integer;
  v_new_status text;
begin
  if auth.uid() is null then
    raise exception 'Giriş yapmalısınız.';
  end if;

  if not public.is_loop_participant(p_loop_id) then
    raise exception 'Bu döngünün katılımcısı değilsiniz.';
  end if;

  select * into v_loop from public.loops where id = p_loop_id for update;

  if not found then
    raise exception 'Döngü bulunamadı.';
  end if;

  if v_loop.status in ('completed', 'cancelled') then
    return v_loop.status;
  end if;

  select
    count(*),
    count(*) filter (where status in ('confirmed', 'delivered', 'completed'))
  into v_total, v_confirmed
  from public.loop_participants
  where loop_id = p_loop_id;

  v_new_status := v_loop.status;

  if v_loop.max_participants is not null and v_total >= v_loop.max_participants then
    v_new_status := 'locked';
  end if;

  if v_total > 0 and v_confirmed = v_total then
    v_new_status := 'in_delivery';
  end if;

  if v_new_status is distinct from v_loop.status then
    update public.loops
    set status = v_new_status, updated_at = now()
    where id = p_loop_id;
  end if;

  return v_new_status;
end;
$$;

grant execute on function public.sync_loop_status(uuid) to authenticated;


-- Döngüyü ve tüm katılımcı satırlarını 'completed' yapar. Yalnızca katılımcılar
-- çağırabilir; istemcinin başkalarının katılımcı satırlarını güncellemesine
-- gerek kalmaz.
create or replace function public.complete_loop(p_loop_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Giriş yapmalısınız.';
  end if;

  if not public.is_loop_participant(p_loop_id) then
    raise exception 'Bu döngünün katılımcısı değilsiniz.';
  end if;

  update public.loops
  set status = 'completed', updated_at = now()
  where id = p_loop_id;

  update public.loop_participants
  set status = 'completed'
  where loop_id = p_loop_id;
end;
$$;

grant execute on function public.complete_loop(uuid) to authenticated;
