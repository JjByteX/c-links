-- C-Links: sample data for cards, stock and purchases. No partners: those are
-- sign-in accounts and are created in the app.
--
-- Run it after the migrations, in the Supabase SQL Editor (or with
-- `supabase db reset` once [db.seed] is enabled in config.toml).
-- Safe to run again: it does nothing if purchases already exist, and cards
-- are matched by their short code. Dates are relative to now(), so the
-- dashboard chart always shows the last two weeks.

do $$
begin
  if exists (select 1 from public.purchases) then
    raise notice 'Seed skipped: purchases already exist';
    return;
  end if;

  -- Cards written for customers: label, destination, taps, last tap, age.
  insert into public.cards
    (code, label, destination_url, tap_count, last_tapped_at, created_at)
  values
    ('k7m2xq4a', 'Kape ni Mang Ruben',
     'https://www.facebook.com/kapenimangruben', 64,
     now() - interval '3 hours', now() - interval '41 days'),
    ('p9d3wz1c', 'Aling Nena Bakery and Pastry',
     'https://www.facebook.com/alingnenabakery', 52,
     now() - interval '1 day 2 hours', now() - interval '38 days'),
    ('h4t8ye6b', 'Tala Leather Works',
     'https://www.instagram.com/talaleatherworks', 47,
     now() - interval '5 hours', now() - interval '35 days'),
    ('r2n5ud8f', 'Dr. Katrina Villanueva, Dental Clinic',
     'https://www.katrinavillanuevadental.ph', 38,
     now() - interval '2 days', now() - interval '33 days'),
    ('w6j1ca3e', 'Marikina Shoe Expo Booth 14',
     'https://www.facebook.com/marikinashoeexpo', 31,
     now() - interval '9 hours', now() - interval '29 days'),
    ('s8v4mk7g', 'JM Photography',
     'https://www.instagram.com/jmphotography.mnl', 29,
     now() - interval '4 days', now() - interval '26 days'),
    ('b3x9qf2h', 'Santos Family Resort Montalban',
     'https://www.facebook.com/santosfamilyresort', 24,
     now() - interval '1 day', now() - interval '22 days'),
    ('m5e7ra1j', 'Lumi Candles by Bea',
     'https://www.instagram.com/lumicandlesbybea', 21,
     now() - interval '6 hours', now() - interval '19 days'),
    ('d1y6tn9k', 'Cruz Auto Detailing',
     'https://www.facebook.com/cruzautodetailing', 14,
     now() - interval '3 days', now() - interval '15 days'),
    ('c7g2wp5l', 'Engr. Paolo Reyes, Civil Engineer',
     'https://www.linkedin.com/in/paoloreyes-ce', 9,
     now() - interval '6 days', now() - interval '11 days'),
    ('f4u8sh3m', 'Barangay Concepcion Youth Council',
     'https://www.facebook.com/sknconcepcionmarikina', 6,
     now() - interval '2 days', now() - interval '7 days'),
    ('z9q1bd6n', 'Ate Joy Laundry Shop',
     'https://www.facebook.com/atejoylaundry', 2,
     now() - interval '1 day', now() - interval '3 days')
  on conflict (code) do nothing;

  -- Customers who bought: name, number of cards, how long ago.
  insert into public.purchases (customer_name, quantity, created_at)
  values
    ('Ruben Dela Cruz',          10, now() - interval '41 days 3 hours'),
    ('Nena Bautista',            20, now() - interval '38 days 5 hours'),
    ('Tala Leather Works',       10, now() - interval '35 days 1 hour'),
    ('Katrina Villanueva',        5, now() - interval '33 days 6 hours'),
    ('Marikina Shoe Expo',       20, now() - interval '29 days 4 hours'),
    ('Joshua Mendoza',            3, now() - interval '26 days 2 hours'),
    ('Maria Lourdes Santos',     10, now() - interval '22 days 7 hours'),
    ('Beatriz Ramos',             5, now() - interval '19 days 3 hours'),
    ('Aldrin Cruz',               5, now() - interval '15 days 5 hours'),
    ('Paolo Reyes',               2, now() - interval '11 days 1 hour'),
    ('Nena Bautista',            10, now() - interval '13 days 4 hours'),
    ('Kristine Mae Gonzales',     1, now() - interval '12 days 6 hours'),
    ('Ruben Dela Cruz',           5, now() - interval '9 days 2 hours'),
    ('SK Concepcion Youth Council', 10, now() - interval '7 days 3 hours'),
    ('Joy Manalo',                2, now() - interval '3 days 5 hours'),
    ('Joshua Mendoza',            2, now() - interval '6 days 1 hour'),
    ('Bianca Flores',             3, now() - interval '5 days 4 hours'),
    ('Marikina Shoe Expo',       10, now() - interval '4 days 6 hours'),
    ('Carlo Aquino',              1, now() - interval '2 days 2 hours'),
    ('Beatriz Ramos',             5, now() - interval '1 day 3 hours'),
    ('Katrina Villanueva',        3, now() - interval '5 hours');

  -- Cards still on hand after those purchases.
  update public.stock
     set quantity = 86,
         updated_at = now()
   where id;
end;
$$;
