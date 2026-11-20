-- ════════════════════════════════════════════════════════════════════
-- Sample Class: fake students with realistic progress so the teacher dashboard (and its tour) has something to show.
--   * Students are flagged demo = true, period 'Sample Class', with a random PIN hash nobody knows (they can't log in).
--   * No survey/debate votes are made, so real class results are never skewed.
--   * Three sample Ask questions are flagged demo = true and labeled "Sample".
--   * The teacher can reset or remove it from the dashboard (econ_teacher_demo).
-- ════════════════════════════════════════════════════════════════════
alter table public.econ_students add column if not exists demo boolean not null default false;
alter table public.econ_ask_questions add column if not exists demo boolean not null default false;

create or replace function public._econ_demo_clear() returns void
language sql security definer set search_path = public as $$
  delete from public.econ_students where demo;
  delete from public.econ_ask_questions where demo;
$$;

create or replace function public._econ_demo_seed() returns int
language plpgsql security definer set search_path = public as $$
declare
  names text[] := array['Avery Sample','Brooklyn Demo','Carter Example','Dakota Trail','Emerson Pine',
    'Finley Ridge','Gavin Meadow','Harper Brooks','Isaac Cedar','Jade Summit','Kai Rivers','Logan Aspen',
    'Mia Juniper','Nolan Granite','Olivia Fern','Parker Sage','Quinn Willow','Riley Stone','Sawyer Elk','Tessa Hollow'];
  -- units fully cleared per student (0..8), plus chapters done in the next unit (0..2)
  cleared int[] := array[8,6,5,5,4,4,4,3,3,3,3,2,2,2,2,1,1,1,0,0];
  partial int[] := array[0,2,1,0,2,1,0,2,1,1,0,2,1,0,0,2,1,0,1,0];
  term text := coalesce(public._econ_set('term'), '2026-T2');
  sid uuid; i int; u int; c int; ch int; sc int; nd int; base timestamptz; off int;
begin
  perform public._econ_demo_clear();
  for i in 1 .. array_length(names, 1) loop
    insert into public.econ_students (name, period, pin_hash, demo, created_at)
      values (names[i], 'Sample Class', encode(extensions.gen_random_bytes(32), 'hex'), true, now() - interval '40 days')
      returning id into sid;
    base := now() - interval '38 days';
    -- chapters finished
    for ch in 1 .. least(24, cleared[i] * 3 + partial[i]) loop
      insert into public.econ_tasks (student_id, task_key, done_at) values
        (sid, 'ch' || ch || '_read', base + (ch * interval '36 hours')),
        (sid, 'ch' || ch || '_tls',  base + (ch * interval '36 hours') + interval '30 minutes');
      -- a few students needed a second try on some quizzes
      if (i + ch) % 5 = 0 then
        insert into public.econ_attempts (student_id, kind, ref, score, total, answers, created_at)
          values (sid, 'chapter', ch, 12 + (i % 3), 20, '{}'::jsonb, base + (ch * interval '36 hours') + interval '40 minutes');
      end if;
      sc := 16 + ((i * 7 + ch * 3) % 5);           -- 16..20 of 20 (80%..100%)
      insert into public.econ_attempts (student_id, kind, ref, score, total, answers, created_at)
        values (sid, 'chapter', ch, sc, 20, '{}'::jsonb, base + (ch * interval '36 hours') + interval '1 hour');
      insert into public.econ_tasks (student_id, task_key, done_at) values (sid, 'ch' || ch || '_quiz', base + (ch * interval '36 hours') + interval '1 hour');
    end loop;
    -- a struggling student who read but hasn't passed the next quiz
    if partial[i] = 0 and cleared[i] between 1 and 7 and i % 2 = 0 then
      ch := cleared[i] * 3 + 1;
      insert into public.econ_tasks (student_id, task_key) values (sid, 'ch' || ch || '_read');
      insert into public.econ_attempts (student_id, kind, ref, score, total, answers) values (sid, 'chapter', ch, 11, 20, '{}'::jsonb);
    end if;
    -- unit tests and clears
    for u in 1 .. cleared[i] loop
      sc := 14 + ((i * 5 + u * 2) % 7);             -- 14..20 of 20 (70%..100%)
      insert into public.econ_attempts (student_id, kind, ref, score, total, answers, created_at)
        values (sid, 'unit', u, sc, 20, '{}'::jsonb, base + (u * 3 * interval '36 hours') + interval '2 hours');
      insert into public.econ_tasks (student_id, task_key, done_at) values (sid, 'unit' || u, base + (u * 3 * interval '36 hours') + interval '2 hours');
      insert into public.econ_cleared (student_id, realm, cleared_at) values (sid, u, base + (u * 3 * interval '36 hours') + interval '2 hours');
    end loop;
    -- one student who failed a unit test and is due a retake
    if i = 12 then
      insert into public.econ_attempts (student_id, kind, ref, score, total, answers) values (sid, 'unit', 3, 12, 20, '{}'::jsonb);
    end if;
    -- active days (login streak days)
    nd := greatest(2, cleared[i] * 4 + partial[i] * 2 + (i % 4));
    off := case when i in (13, 17, 20) then 8 + i % 5 when i % 3 = 0 then 1 when i % 4 = 0 then 3 else 0 end;  -- days since last active
    for c in 0 .. nd - 1 loop
      insert into public.econ_days (student_id, day) values (sid, public._econ_today() - off - (c * 30 / greatest(nd, 1))) on conflict do nothing;
    end loop;
    -- side quests: some approved, some waiting for the teacher
    if i in (1, 3, 6, 10) then
      insert into public.econ_side_quests (student_id, quest_id, term, note, approved) values
        (sid, 'sq' || (1 + i % 15), term, 'Sample: tracked prices at two stores for three weeks and explained the changes with supply and demand.', true);
    end if;
    if i in (2, 5, 9, 14) then
      insert into public.econ_side_quests (student_id, quest_id, term, note, approved) values
        (sid, 'sq' || (4 + i % 10), term, 'Sample: write-up turned in with photos. Waiting for your approval.', false);
    end if;
  end loop;

  insert into public.econ_ask_questions (term, day, topic, body, status, demo) values
    (term, public._econ_today() - 1, 'Sample · Chapter 14', 'If I only pay the minimum on a credit card, how long does it really take to pay off?', 'new', true),
    (term, public._econ_today() - 2, 'Sample · Chapter 21', 'Why does the Fed raise interest rates when prices go up? Doesn''t that make things more expensive?', 'new', true),
    (term, public._econ_today() - 4, 'Sample · Chapter 4', 'Is a sale price a change in demand or a change in quantity demanded?', 'new', true);
  return array_length(names, 1);
end $$;

-- Teacher button: 'reset' rebuilds the Sample Class, 'remove' deletes it.
create or replace function public.econ_teacher_demo(p_pass_hash text, p_action text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public._econ_teacher(p_pass_hash) then raise exception 'Wrong teacher passcode'; end if;
  if p_action = 'reset' then return jsonb_build_object('students', public._econ_demo_seed()); end if;
  if p_action = 'remove' then perform public._econ_demo_clear(); return jsonb_build_object('students', 0); end if;
  raise exception 'Unknown action';
end $$;

-- Roster now also returns each student's demo flag, chapter-quiz bests and last active day.
create or replace function public.econ_teacher_roster(p_pass_hash text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public._econ_teacher(p_pass_hash) then raise exception 'Wrong teacher passcode'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', s.id, 'name', s.name, 'period', s.period, 'demo', s.demo,
      'tasks', (select coalesce(jsonb_agg(task_key), '[]') from public.econ_tasks t where t.student_id = s.id),
      'days', (select count(*) from public.econ_days d where d.student_id = s.id),
      'lastDay', (select max(day) from public.econ_days d where d.student_id = s.id),
      'best', (select coalesce(jsonb_object_agg(kind || ref, best), '{}') from (
                 select kind, ref, max(round(100.0 * score / total))::int best from public.econ_attempts a
                 where a.student_id = s.id group by kind, ref) b),
      'sideQuests', (select coalesce(jsonb_agg(jsonb_build_object('id', quest_id, 'term', term, 'note', note, 'approved', approved)), '[]')
                 from public.econ_side_quests q where q.student_id = s.id),
      'cleared', (select coalesce(jsonb_agg(realm order by realm), '[]') from public.econ_cleared c where c.student_id = s.id)
    ) order by s.demo, s.period, s.name) from public.econ_students s), '[]');
end $$;

-- Real students can't join the Sample Class period.
create or replace function public._econ_no_demo_period() returns trigger
language plpgsql set search_path = public as $$
begin
  if not new.demo and lower(btrim(new.period)) = 'sample class' then raise exception 'That class period is reserved'; end if;
  return new;
end $$;
drop trigger if exists econ_no_demo_period on public.econ_students;
create trigger econ_no_demo_period before insert or update on public.econ_students for each row execute function public._econ_no_demo_period();

revoke all on function public._econ_demo_clear(), public._econ_demo_seed(), public._econ_no_demo_period() from public, anon, authenticated;
grant execute on function public.econ_teacher_demo(text, text) to anon;

select public._econ_demo_seed();
