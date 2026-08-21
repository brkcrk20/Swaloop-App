#!/usr/bin/env bash
#
# RLS politikalarını ve takas RPC'lerini yerel bir Postgres üzerinde test eder.
#
# Ne yapar:
#   1. Boş bir test veritabanı oluşturur.
#   2. 00_supabase_stub.sql ile Supabase ortamını asgari düzeyde taklit eder
#      (anon / authenticated / service_role rolleri, auth.users, auth.uid(),
#      storage şeması). auth.uid() burada JWT yerine bir oturum değişkeninden
#      okur; böylece testte kullanıcı değiştirmek `set request.jwt.claim.sub`
#      ile mümkün olur.
#   3. supabase/migrations/ altındaki TÜM migration'ları sırayla uygular —
#      yani `supabase db reset`in kırılıp kırılmadığını da doğrular.
#   4. 01_rls_policies.test.sql ile politikaları saldırıya uğratır: bir
#      kullanıcının başkasının profilini/ilanını/takasını/mesajını
#      okuyup değiştiremediğini kanıtlar.
#
# Kullanım:
#   ./supabase/tests/run.sh
#
# Gereksinim: yerelde çalışan bir Postgres 14+ ve `psql`. Docker gerekmez.
# Bağlantı için standart PG* değişkenleri (PGHOST, PGUSER, ...) kullanılır.

set -euo pipefail

DB="${SWALOOP_TEST_DB:-swaloop_test}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "▸ Test veritabanı hazırlanıyor: $DB"
dropdb --if-exists "$DB"
createdb "$DB"
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$ROOT/supabase/tests/00_supabase_stub.sql"

echo "▸ Migration'lar sırayla uygulanıyor"
failed=0
for f in "$ROOT"/supabase/migrations/*.sql; do
  if ! out=$(psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$f" 2>&1); then
    echo "  ✗ $(basename "$f")"
    echo "$out" | sed 's/^/      /'
    failed=1
  fi
done

if [ "$failed" -ne 0 ]; then
  echo "✗ Migration zinciri kırık."
  exit 1
fi

count=$(ls "$ROOT"/supabase/migrations/*.sql | wc -l | tr -d ' ')
echo "  ✓ $count migration hatasız geçti"

rls=$(psql -tAq -d "$DB" -c \
  "select (select count(*) from pg_tables where schemaname='public' and rowsecurity)
       || '/' || (select count(*) from pg_tables where schemaname='public')")
echo "  ✓ RLS açık tablo oranı: $rls"

unprotected=$(psql -tAq -d "$DB" -c \
  "select string_agg(tablename, ', ') from pg_tables
   where schemaname='public' and not rowsecurity")

if [ -n "$unprotected" ]; then
  echo "✗ RLS'siz tablo(lar) var: $unprotected"
  exit 1
fi

for t in "$ROOT"/supabase/tests/*.test.sql; do
  echo "▸ $(basename "$t")"
  psql -q -d "$DB" -f "$t" 2>&1 \
    | grep -v '^$' | sed 's/^psql:[^ ]* //' | sed 's/^/  /'
done

echo "▸ Bitti. Yukarıdaki her satırda gerçekleşen değer, köşeli parantez"
echo "  içindeki beklenen değerle aynı olmalı; 'HATA bekleniyor' yazan"
echo "  adımlarda ise bir ERROR satırı görünmeli."
