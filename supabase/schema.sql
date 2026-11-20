-- Summit Economics database: its own econ_ tables and logins, living in the dopp-health-class Supabase project
-- next to Dopps Class and Bedrock (b_). Nothing here touches their tables or functions. Safe to re-run.
--
-- Privacy model (same as Bedrock):
--   * Every table has Row Level Security ON and NO policies, so the public key can't read or write any table.
--     All access goes through the security-definer functions below.
--   * Answer keys live only in econ_keys, loaded straight into the database, never in the public repo.
--     Students get right/wrong per question, never the correct answer. Only econ_teacher_keys returns keys.
--   * Student PINs arrive as a SHA-256 hash made in the browser.
--   * The teacher passcode is Summit's own (not Mr. Dopp's). Set or change it with:
--       insert into public.econ_settings (k, v) values ('teacher_pass_sha256', encode(extensions.digest(lower('NEW CODE'), 'sha256'), 'hex'))
--       on conflict (k) do update set v = excluded.v;

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.econ_students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  period text not null,
  pin_hash text not null,
  created_at timestamptz not null default now(),
  unique (period, name)
);
create table if not exists public.econ_tasks (
  student_id uuid references public.econ_students on delete cascade,
  task_key text not null,
  done_at timestamptz not null default now(),
  primary key (student_id, task_key)
);
create table if not exists public.econ_days (
  student_id uuid references public.econ_students on delete cascade,
  day date not null,
  primary key (student_id, day)
);
create table if not exists public.econ_keys (
  id text primary key,                -- c01-<hash> (chapter bank), u1-<hash> (unit test), tls-01 / tls-12a (Think Like a Scientist),
                                      -- cw01-<hash> (Classwork think-it-through questions)
  kind text not null check (kind in ('chapter', 'unit', 'tls', 'cw')),
  ref int not null,                   -- chapter number or realm number; bonus chapters: 1201 = 12a, 1202 = 12b
  answer text not null                -- the exact correct choice text (tls: the model answer)
);
create table if not exists public.econ_attempts (
  id bigserial primary key,
  student_id uuid references public.econ_students on delete cascade,
  kind text not null,                 -- 'chapter' | 'unit'
  ref int not null,
  score int not null,
  total int not null,
  answers jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists public.econ_votes (
  student_id uuid references public.econ_students on delete cascade,
  kind text not null check (kind in ('survey', 'debate')),
  item_id text not null,
  choice text not null,
  reason text,
  created_at timestamptz not null default now(),
  primary key (student_id, kind, item_id)
);
create table if not exists public.econ_side_quests (
  student_id uuid references public.econ_students on delete cascade,
  quest_id text not null,
  term text not null,
  note text,
  approved boolean not null default false,
  submitted_at timestamptz not null default now(),
  primary key (student_id, quest_id)
);
-- Realm clears, recorded once and kept even if the realm gets new chapters later (see econ_claim_realm).
create table if not exists public.econ_cleared (
  student_id uuid references public.econ_students on delete cascade,
  realm int not null,
  cleared_at timestamptz not null default now(),
  primary key (student_id, realm)
);
create table if not exists public.econ_settings (
  k text primary key,
  v text not null
);

alter table public.econ_students enable row level security;
alter table public.econ_tasks enable row level security;
alter table public.econ_days enable row level security;
alter table public.econ_keys enable row level security;
alter table public.econ_attempts enable row level security;
alter table public.econ_votes enable row level security;
alter table public.econ_side_quests enable row level security;
alter table public.econ_settings enable row level security;
alter table public.econ_cleared enable row level security;
revoke all on public.econ_students, public.econ_tasks, public.econ_days, public.econ_keys, public.econ_attempts,
  public.econ_votes, public.econ_side_quests, public.econ_settings, public.econ_cleared from anon, authenticated;

-- Rules the teacher can change later: update public.econ_settings set v = '…' where k = '…';
insert into public.econ_settings (k, v) values
  ('term', '2026-T2'),
  ('chapter_pass_pct', '80'),       -- chapter quiz score that checks off the quiz task
  ('unit_pass_pct', '70'),          -- unit test score that checks off the unit test task
  ('unit_attempts', '2')            -- tries per unit test; the best score counts
on conflict (k) do nothing;

create or replace function public._econ_set(p_k text) returns text language sql stable security definer set search_path = public as $$
  select v from public.econ_settings where k = p_k $$;

create or replace function public._econ_ok(p_id uuid, p_pin_hash text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.econ_students where id = p_id and pin_hash = p_pin_hash) $$;

-- Teacher check = Summit's own teacher passcode. p_pass_hash carries the typed code; only its SHA-256 is stored (econ_settings 'teacher_pass_sha256').
create or replace function public._econ_teacher(p_pass_hash text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(p_pass_hash, '') <> '' and exists (select 1 from public.econ_settings
    where k = 'teacher_pass_sha256' and v = encode(extensions.digest(lower(btrim(p_pass_hash)), 'sha256'), 'hex')) $$;

create or replace function public._econ_today() returns date language sql stable set search_path = public as $$
  select (now() at time zone 'America/Denver')::date $$;

-- ── Students ──
create or replace function public.econ_register(p_name text, p_period text, p_pin_hash text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_name text := btrim(regexp_replace(p_name, '\s+', ' ', 'g'));
begin
  if length(v_name) < 2 or length(v_name) > 40 then raise exception 'Name must be 2 to 40 characters'; end if;
  if exists (select 1 from public.econ_students where period = p_period and lower(name) = lower(v_name)) then
    raise exception 'That name is already taken in this class. Log in instead, or add your last initial.';
  end if;
  insert into public.econ_students (name, period, pin_hash) values (v_name, p_period, p_pin_hash) returning id into v_id;
  return jsonb_build_object('id', v_id, 'name', v_name, 'period', p_period);
end $$;

create or replace function public.econ_login(p_name text, p_period text, p_pin_hash text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s public.econ_students;
begin
  select * into s from public.econ_students where period = p_period and lower(name) = lower(btrim(p_name));
  if s.id is null or s.pin_hash <> p_pin_hash then raise exception 'Name or PIN does not match'; end if;
  return jsonb_build_object('id', s.id, 'name', s.name, 'period', s.period);
end $$;

-- Everything the Quest page needs. Also counts today as an active day (+5 XP, like Summit).
create or replace function public.econ_state(p_id uuid, p_pin_hash text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public._econ_ok(p_id, p_pin_hash) then raise exception 'Please log in again'; end if;
  insert into public.econ_days values (p_id, public._econ_today()) on conflict do nothing;
  return jsonb_build_object(
    'tasks', coalesce((select jsonb_agg(task_key) from public.econ_tasks where student_id = p_id), '[]'),
    'days', coalesce((select jsonb_agg(day order by day) from public.econ_days where student_id = p_id), '[]'),
    'best', coalesce((select jsonb_object_agg(kind || ref, best) from (
               select kind, ref, max(round(100.0 * score / total))::int best from public.econ_attempts
               where student_id = p_id group by kind, ref) b), '{}'),
    'firstTry', coalesce((select jsonb_object_agg(ref, pct) from (
               select distinct on (ref) ref, round(100.0 * score / total)::int pct from public.econ_attempts
               where student_id = p_id and kind = 'chapter' order by ref, created_at) f), '{}'),
    'unitTries', coalesce((select jsonb_object_agg(ref, n) from (
               select ref, count(*) n from public.econ_attempts where student_id = p_id and kind = 'unit' group by ref) u), '{}'),
    'sideQuests', coalesce((select jsonb_agg(jsonb_build_object('id', quest_id, 'term', term, 'approved', approved))
               from public.econ_side_quests where student_id = p_id), '[]'),
    'votes', (select count(*) from public.econ_votes where student_id = p_id and kind = 'survey'),
    'cleared', coalesce((select jsonb_agg(realm order by realm) from public.econ_cleared where student_id = p_id), '[]'),
    'term', public._econ_set('term'),
    'unitAttempts', public._econ_set('unit_attempts')::int
  );
end $$;

-- Self-checked tasks (reading, Think Like a Scientist). Quiz and test tasks are only set by econ_grade.
create or replace function public.econ_complete_task(p_id uuid, p_pin_hash text, p_task_key text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public._econ_ok(p_id, p_pin_hash) then raise exception 'Please log in again'; end if;
  if p_task_key !~ '^ch\d+[a-z]?_(read|tls)$' then raise exception 'That task is checked off by passing its quiz or test'; end if;
  insert into public.econ_tasks (student_id, task_key) values (p_id, p_task_key) on conflict do nothing;
end $$;

-- Grades a chapter quiz or unit test. p_answers = {"c01-03": "chosen choice text", …}.
-- Choices are shuffled in the browser, so grading is by choice text, never by letter.
-- Returns the score and right/wrong per question. Never returns the correct answer.
create or replace function public.econ_grade(p_id uuid, p_pin_hash text, p_kind text, p_ref int, p_answers jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare total int; right_n int; results jsonb; pct int; tries int; passed boolean;
begin
  if not public._econ_ok(p_id, p_pin_hash) then raise exception 'Please log in again'; end if;
  if p_kind not in ('chapter', 'unit') then raise exception 'Unknown quiz'; end if;
  if p_kind = 'unit' then
    select count(*) into tries from public.econ_attempts where student_id = p_id and kind = 'unit' and ref = p_ref;
    if tries >= public._econ_set('unit_attempts')::int then raise exception 'You have used all your tries on this unit test'; end if;
  end if;
  select count(*), count(*) filter (where lower(btrim(p_answers ->> k.id)) = lower(btrim(k.answer))),
         jsonb_object_agg(k.id, lower(btrim(coalesce(p_answers ->> k.id, ''))) = lower(btrim(k.answer)))
    into total, right_n, results
    from public.econ_keys k where k.kind = p_kind and k.ref = p_ref;
  if total = 0 then raise exception 'This quiz is not loaded yet'; end if;
  insert into public.econ_attempts (student_id, kind, ref, score, total, answers) values (p_id, p_kind, p_ref, right_n, total, p_answers);
  pct := round(100.0 * right_n / total);
  passed := pct >= public._econ_set(case p_kind when 'chapter' then 'chapter_pass_pct' else 'unit_pass_pct' end)::int;
  if passed then
    insert into public.econ_tasks (student_id, task_key)
      values (p_id, case p_kind when 'chapter' then public._econ_ch(p_ref) || '_quiz' else 'unit' || p_ref end)
      on conflict do nothing;
  end if;
  return jsonb_build_object('score', right_n, 'total', total, 'pct', pct, 'passed', passed, 'results', results);
end $$;

-- ── Realm clears: earned stays earned ──
-- Chapter ref (12, 1201) → task key prefix (ch12, ch12a).
create or replace function public._econ_ch(p_ref int) returns text language sql immutable set search_path = public as $$
  select 'ch' || case when p_ref >= 100 then (p_ref / 100)::text || chr(96 + p_ref % 100) else p_ref::text end $$;

create or replace function public.econ_claim_realm(p_id uuid, p_pin_hash text, p_realm int, p_task_keys text[]) returns jsonb
language plpgsql security definer set search_path = public as $$
declare k text; unit_key text := 'unit' || p_realm;
begin
  if not public._econ_ok(p_id, p_pin_hash) then raise exception 'Please log in again'; end if;
  if p_realm is null or p_realm < 1 or p_realm > 99 then raise exception 'Unknown realm'; end if;
  if p_task_keys is null or not (unit_key = any(p_task_keys)) then raise exception 'The task list must include the unit test'; end if;
  if not exists (select 1 from unnest(p_task_keys) t where t ~ '^ch\d+[a-z]?_quiz$') then raise exception 'The task list must include chapter quizzes'; end if;
  foreach k in array p_task_keys loop
    if k !~ '^(ch\d+[a-z]?_(read|quiz|tls)|unit\d+)$' then raise exception 'Unknown task %', k; end if;
    if not exists (select 1 from public.econ_tasks where student_id = p_id and task_key = k) then
      raise exception 'Not cleared yet: % is not done', k;
    end if;
  end loop;
  insert into public.econ_cleared (student_id, realm) values (p_id, p_realm) on conflict do nothing;
  return coalesce((select jsonb_agg(realm order by realm) from public.econ_cleared where student_id = p_id), '[]');
end $$;

-- ── Survey of the Day and Pick a Side ──
create or replace function public.econ_vote(p_id uuid, p_pin_hash text, p_kind text, p_item text, p_choice text, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public._econ_ok(p_id, p_pin_hash) then raise exception 'Please log in again'; end if;
  insert into public.econ_votes (student_id, kind, item_id, choice, reason) values (p_id, p_kind, p_item, left(p_choice, 200), left(p_reason, 1000))
    on conflict (student_id, kind, item_id) do update set choice = excluded.choice, reason = excluded.reason, created_at = now();
  return public.econ_results(p_kind, p_item);
end $$;

create or replace function public.econ_results(p_kind text, p_item text) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(choice, n), '{}') from (
    select choice, count(*) n from public.econ_votes where kind = p_kind and item_id = p_item group by choice) t $$;

-- ── Side quests: students submit, the teacher approves (+50 XP each on the Quest page) ──
create or replace function public.econ_side_quest_submit(p_id uuid, p_pin_hash text, p_quest text, p_note text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public._econ_ok(p_id, p_pin_hash) then raise exception 'Please log in again'; end if;
  insert into public.econ_side_quests (student_id, quest_id, term, note) values (p_id, p_quest, public._econ_set('term'), left(p_note, 2000))
    on conflict (student_id, quest_id) do update set note = excluded.note, submitted_at = now();
end $$;

-- ── Teacher functions: unlocked by the Summit teacher code (see _econ_teacher above).

create or replace function public.econ_teacher_check(p_pass_hash text) returns boolean
language sql stable security definer set search_path = public as $$ select public._econ_teacher(p_pass_hash) $$;

create or replace function public.econ_teacher_keys(p_pass_hash text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public._econ_teacher(p_pass_hash) then raise exception 'Wrong teacher passcode'; end if;
  return (select jsonb_object_agg(id, answer) from public.econ_keys);
end $$;

create or replace function public.econ_teacher_roster(p_pass_hash text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public._econ_teacher(p_pass_hash) then raise exception 'Wrong teacher passcode'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', s.id, 'name', s.name, 'period', s.period,
      'tasks', (select coalesce(jsonb_agg(task_key), '[]') from public.econ_tasks t where t.student_id = s.id),
      'days', (select count(*) from public.econ_days d where d.student_id = s.id),
      'best', (select coalesce(jsonb_object_agg(kind || ref, best), '{}') from (
                 select kind, ref, max(round(100.0 * score / total))::int best from public.econ_attempts a
                 where a.student_id = s.id group by kind, ref) b),
      'sideQuests', (select coalesce(jsonb_agg(jsonb_build_object('id', quest_id, 'term', term, 'note', note, 'approved', approved)), '[]')
                 from public.econ_side_quests q where q.student_id = s.id),
      'cleared', (select coalesce(jsonb_agg(realm order by realm), '[]') from public.econ_cleared c where c.student_id = s.id)
    ) order by s.period, s.name) from public.econ_students s), '[]');
end $$;

create or replace function public.econ_teacher_approve(p_pass_hash text, p_student uuid, p_quest text, p_ok boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public._econ_teacher(p_pass_hash) then raise exception 'Wrong teacher passcode'; end if;
  update public.econ_side_quests set approved = p_ok where student_id = p_student and quest_id = p_quest;
end $$;

create or replace function public.econ_teacher_reset_pin(p_pass_hash text, p_student uuid, p_pin_hash text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public._econ_teacher(p_pass_hash) then raise exception 'Wrong teacher passcode'; end if;
  update public.econ_students set pin_hash = p_pin_hash where id = p_student;
end $$;

-- Only the functions are callable from the website. Internal helpers stay locked.

-- ════════════════════════════════════════════════════════════════════
-- 4. Ask the Teacher: anonymous student questions.
--   Only logged-in students can ask (keeps spam out), but a question is saved WITHOUT the student and with only
--   the day. econ_ask_limits counts questions per student per day (max 3) and nothing else.
--   The teacher reads every question, answers, and posts it to the class board or keeps it for class.
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.econ_ask_questions (
  id          uuid primary key default gen_random_uuid(),
  term        text not null,
  day         date not null default public._econ_today(),
  topic       text not null default 'Economics question',
  body        text not null check (char_length(body) between 3 and 1000),
  answer      text,
  status      text not null default 'new' check (status in ('new', 'posted', 'in_class', 'skipped')),
  answered_on date,
  hidden_at   timestamptz             -- set = the teacher removed it (soft); hidden from every list
);
alter table public.econ_ask_questions add column if not exists hidden_at timestamptz;
create index if not exists econ_ask_questions_term on public.econ_ask_questions (term, status);
create table if not exists public.econ_ask_limits (
  student_id uuid not null references public.econ_students on delete cascade,
  day        date not null,
  n          int  not null default 0,
  primary key (student_id, day)
);
alter table public.econ_ask_questions enable row level security;
alter table public.econ_ask_limits enable row level security;
revoke all on public.econ_ask_questions, public.econ_ask_limits from anon, authenticated;

create or replace function public.econ_ask_submit(p_id uuid, p_pin_hash text, p_topic text, p_body text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare d date := public._econ_today(); used int; v_body text := btrim(coalesce(p_body, ''));
begin
  if not public._econ_ok(p_id, p_pin_hash) then raise exception 'Please log in again'; end if;
  if char_length(v_body) < 3 then raise exception 'Please type your question'; end if;
  if char_length(v_body) > 1000 then raise exception 'Please keep it under 1000 characters'; end if;
  -- (old econ_ask_limits days are simply ignored; a future purge job could clear them)
  select n into used from public.econ_ask_limits where student_id = p_id and day = d;
  if coalesce(used, 0) >= 3 then raise exception 'You can ask 3 questions a day. Try again tomorrow!'; end if;
  insert into public.econ_ask_limits (student_id, day, n) values (p_id, d, 1)
    on conflict (student_id, day) do update set n = public.econ_ask_limits.n + 1;
  insert into public.econ_ask_questions (term, day, topic, body)
    values (public._econ_set('term'), d, left(coalesce(nullif(btrim(p_topic), ''), 'Economics question'), 60), v_body);
  return jsonb_build_object('ok', true, 'left_today', 2 - coalesce(used, 0));
end $$;

-- The class board: answered questions the teacher posted this term, newest first.
create or replace function public.econ_ask_board(p_id uuid, p_pin_hash text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._econ_ok(p_id, p_pin_hash) then raise exception 'Please log in again'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('topic', q.topic, 'body', q.body, 'answer', q.answer, 'answered_on', q.answered_on)
                     order by q.answered_on desc nulls last, q.day desc)
                     from public.econ_ask_questions q where q.term = public._econ_set('term') and q.status = 'posted' and q.hidden_at is null), '[]');
end $$;

create or replace function public.econ_ask_teacher_list(p_pass_hash text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._econ_teacher(p_pass_hash) then raise exception 'Wrong teacher passcode'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', q.id, 'day', q.day, 'topic', q.topic, 'body', q.body,
                     'answer', q.answer, 'status', q.status, 'answered_on', q.answered_on) order by (q.status = 'new') desc, q.day desc)
                     from public.econ_ask_questions q where q.term = public._econ_set('term') and q.hidden_at is null), '[]');
end $$;

-- p_status: 'posted' (class board), 'in_class' (answered out loud), 'skipped', or 'new'.
-- p_body lets the teacher tidy the wording (typos, names) before posting; null keeps it.
create or replace function public.econ_ask_teacher_set(p_pass_hash text, p_question uuid, p_answer text, p_status text, p_body text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public._econ_teacher(p_pass_hash) then raise exception 'Wrong teacher passcode'; end if;
  if p_status not in ('new', 'posted', 'in_class', 'skipped') then raise exception 'Bad status'; end if;
  if p_status = 'posted' and char_length(btrim(coalesce(p_answer, ''))) = 0 then raise exception 'Write an answer before posting'; end if;
  update public.econ_ask_questions set
    answer = left(nullif(btrim(coalesce(p_answer, '')), ''), 4000),
    body = case when char_length(btrim(coalesce(p_body, ''))) >= 3 then left(btrim(p_body), 1000) else body end,
    status = p_status,
    answered_on = case when p_status in ('posted', 'in_class') then coalesce(answered_on, public._econ_today()) end
  where id = p_question and hidden_at is null;
  return public.econ_ask_teacher_list(p_pass_hash);
end $$;

-- Remove = soft: hidden_at is set and the question leaves every list (a future purge job could clear old ones).
create or replace function public.econ_ask_teacher_hide(p_pass_hash text, p_question uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public._econ_teacher(p_pass_hash) then raise exception 'Wrong teacher passcode'; end if;
  update public.econ_ask_questions set hidden_at = now() where id = p_question and hidden_at is null;
  return public.econ_ask_teacher_list(p_pass_hash);
end $$;


-- ════════════════════════════════════════════════════════════════════
-- 1. Daily Briefing
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.econ_briefing (
  id           int primary key default 1 check (id = 1),
  announcement text not null default '',
  updated_at   timestamptz not null default now()
);
alter table public.econ_briefing enable row level security;
revoke all on public.econ_briefing from anon, authenticated;
insert into public.econ_briefing (id) values (1) on conflict (id) do nothing;

-- Public read: the announcement is for the whole class (no student data in it).
create or replace function public.econ_briefing_get() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('announcement', announcement, 'updated_at', updated_at) from public.econ_briefing where id = 1 $$;

create or replace function public.econ_teacher_briefing_set(p_pass_hash text, p_announcement text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public._econ_teacher(p_pass_hash) then raise exception 'Wrong teacher passcode'; end if;
  insert into public.econ_briefing (id, announcement, updated_at) values (1, left(btrim(coalesce(p_announcement, '')), 2000), now())
  on conflict (id) do update set announcement = excluded.announcement, updated_at = now();
  return public.econ_briefing_get();
end $$;

-- ════════════════════════════════════════════════════════════════════
-- 2. Suggest an Improvement
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.econ_suggestions (
  id          bigserial primary key,
  student_id  uuid references public.econ_students on delete set null,  -- null when sent without logging in
  name        text,                                                  -- optional, typed by the sender
  category    text not null check (category in ('bug', 'game', 'content', 'design', 'other')),
  message     text not null check (char_length(message) between 5 and 2000),
  page        text,                                                  -- which page they were on (optional)
  status      text not null default 'new' check (status in ('new', 'done', 'archived')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.econ_suggestions enable row level security;
revoke all on public.econ_suggestions from anon, authenticated;

-- p_id / p_pin_hash are optional: a logged-in student's suggestion is linked to them.
-- Limits: 5 a day per logged-in student; 40 an hour for everyone who isn't logged in.
create or replace function public.econ_suggest(p_id uuid, p_pin_hash text, p_name text, p_category text, p_message text, p_page text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_sid uuid := null; v_msg text := btrim(coalesce(p_message, ''));
begin
  if p_id is not null then
    if not public._econ_ok(p_id, p_pin_hash) then raise exception 'Please log in again'; end if;
    v_sid := p_id;
    if (select count(*) from public.econ_suggestions where student_id = v_sid and created_at > now() - interval '1 day') >= 5 then
      raise exception 'You have sent 5 suggestions today. Thank you! Try again tomorrow.'; end if;
  elsif (select count(*) from public.econ_suggestions where student_id is null and created_at > now() - interval '1 hour') >= 40 then
    raise exception 'Lots of suggestions right now. Please try again in an hour.';
  end if;
  if char_length(v_msg) < 5 then raise exception 'Please write a little more.'; end if;
  if p_category not in ('bug', 'game', 'content', 'design', 'other') then raise exception 'Pick what it is about.'; end if;
  insert into public.econ_suggestions (student_id, name, category, message, page)
  values (v_sid, nullif(left(btrim(coalesce(p_name, '')), 60), ''), p_category, left(v_msg, 2000), nullif(left(btrim(coalesce(p_page, '')), 200), ''));
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.econ_teacher_suggestions(p_pass_hash text, p_archived boolean) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._econ_teacher(p_pass_hash) then raise exception 'Wrong teacher passcode'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'student', s.name, 'period', s.period,
      'category', g.category, 'message', g.message, 'page', g.page, 'status', g.status, 'created_at', g.created_at)
      order by (g.status = 'new') desc, g.created_at desc)
    from public.econ_suggestions g left join public.econ_students s on s.id = g.student_id
    where coalesce(p_archived, false) or g.status <> 'archived'), '[]'::jsonb);
end $$;

-- "Remove" = archive (soft). Archived ones are hidden unless the teacher asks for them.
create or replace function public.econ_teacher_suggestion_set(p_pass_hash text, p_suggestion bigint, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public._econ_teacher(p_pass_hash) then raise exception 'Wrong teacher passcode'; end if;
  if p_status not in ('new', 'done', 'archived') then raise exception 'Unknown status'; end if;
  update public.econ_suggestions set status = p_status, updated_at = now() where id = p_suggestion;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- 4. Site visit counter
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.econ_site_visits (
  id         int primary key default 1 check (id = 1),
  total      bigint not null default 0,
  started_at timestamptz not null default now()
);
alter table public.econ_site_visits enable row level security;
revoke all on public.econ_site_visits from anon, authenticated;
insert into public.econ_site_visits (id) values (1) on conflict (id) do nothing;

create or replace function public.econ_site_visit_hit() returns jsonb
language sql security definer set search_path = public as $$
  update public.econ_site_visits set total = total + 1 where id = 1 returning jsonb_build_object('total', total, 'since', started_at) $$;
create or replace function public.econ_site_visit_count() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('total', total, 'since', started_at) from public.econ_site_visits where id = 1 $$;

-- ---------- grants: only the public functions are callable from the website ----------
revoke execute on function public._econ_ch, public._econ_ok, public._econ_set, public._econ_teacher, public._econ_today, public.econ_ask_board, public.econ_ask_submit, public.econ_ask_teacher_hide, public.econ_ask_teacher_list, public.econ_ask_teacher_set, public.econ_briefing_get, public.econ_claim_realm, public.econ_complete_task, public.econ_grade, public.econ_login, public.econ_register, public.econ_results, public.econ_side_quest_submit, public.econ_site_visit_count, public.econ_site_visit_hit, public.econ_state, public.econ_suggest, public.econ_teacher_approve, public.econ_teacher_briefing_set, public.econ_teacher_check, public.econ_teacher_keys, public.econ_teacher_reset_pin, public.econ_teacher_roster, public.econ_teacher_suggestion_set, public.econ_teacher_suggestions, public.econ_vote from public, anon, authenticated;
grant execute on function public.econ_ask_board, public.econ_ask_submit, public.econ_ask_teacher_hide, public.econ_ask_teacher_list, public.econ_ask_teacher_set, public.econ_briefing_get, public.econ_claim_realm, public.econ_complete_task, public.econ_grade, public.econ_login, public.econ_register, public.econ_results, public.econ_side_quest_submit, public.econ_site_visit_count, public.econ_site_visit_hit, public.econ_state, public.econ_suggest, public.econ_teacher_approve, public.econ_teacher_briefing_set, public.econ_teacher_check, public.econ_teacher_keys, public.econ_teacher_reset_pin, public.econ_teacher_roster, public.econ_teacher_suggestion_set, public.econ_teacher_suggestions, public.econ_vote to anon;
