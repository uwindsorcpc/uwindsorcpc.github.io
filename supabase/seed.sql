-- =============================================================================
-- SAMPLE content so the site isn't empty. Run once, AFTER 0001_schema.sql.
-- Everything here is placeholder: edit or delete it from the /admin page.
-- Running it twice would create duplicates.
-- =============================================================================

insert into public.events (title, starts_at, ends_at, room, type, description, kattis_url) values
  ('Kickoff + First Practice', timestamptz '2026-10-08 18:00 America/Toronto', timestamptz '2026-10-08 20:00 America/Toronto', 'Erie Hall 3123', 'practice', 'Meet the execs, set up your Kattis account, and solve your first problems together.', 'https://open.kattis.com/problems/hello'),
  ('Workshop: Complexity and Big-O', timestamptz '2026-10-22 18:00 America/Toronto', timestamptz '2026-10-22 19:30 America/Toronto', 'Lambton Tower 2101', 'workshop', 'Why some solutions get Time Limit Exceeded, and how to estimate whether yours will pass before you submit.', null),
  ('Fall Club Contest #1', timestamptz '2026-11-07 13:00 America/Toronto', timestamptz '2026-11-07 16:00 America/Toronto', 'Erie Hall 3123', 'contest', 'Three hours, eight problems, teams of up to three. Pizza after.', 'https://open.kattis.com/contests'),
  ('Weekly Practice: Graphs', timestamptz '2026-11-19 18:00 America/Toronto', timestamptz '2026-11-19 20:00 America/Toronto', 'Erie Hall 3123', 'practice', 'BFS, DFS and connected components on a set of Kattis problems.', 'https://open.kattis.com/problems/10kindsofpeople'),
  ('Weekly Practice: Binary Search', timestamptz '2026-12-03 18:00 America/Toronto', timestamptz '2026-12-03 20:00 America/Toronto', 'Erie Hall 3123', 'practice', 'Binary search on arrays and on the answer. Bring a laptop.', 'https://open.kattis.com/problems/guess'),
  ('Workshop: Intro to Dynamic Programming', timestamptz '2026-12-10 18:00 America/Toronto', timestamptz '2026-12-10 19:30 America/Toronto', 'Lambton Tower 2101', 'workshop', 'From recursion to memoization to tables: knapsack, coin change and longest increasing subsequence.', null),
  ('Winter Club Contest #2', timestamptz '2027-01-16 13:00 America/Toronto', timestamptz '2027-01-16 16:00 America/Toronto', 'Erie Hall 3123', 'contest', 'ICPC-style rules: teams of three sharing one computer. A good warm-up for the regional.', 'https://open.kattis.com/contests'),
  ('Weekly Practice: Greedy Algorithms', timestamptz '2027-01-21 18:00 America/Toronto', timestamptz '2027-01-21 20:00 America/Toronto', 'Erie Hall 3123', 'practice', 'When is the obvious choice the right one? Exchange arguments and classic greedy problems.', 'https://open.kattis.com/problems/commercials');

insert into public.team_members (name, role, bio, links, sort_order) values
  ('[Exec Name 1]', 'President', 'ICPC contestant and co-founder. Likes graph problems and helping first-years get their first Accepted.', '{"github": "https://github.com/", "linkedin": "https://www.linkedin.com/", "codeforces": "https://codeforces.com/", "kattis": "https://open.kattis.com/"}'::jsonb, 1),
  ('[Exec Name 2]', 'VP Contests', 'ICPC contestant and co-founder. Writes and tests the problems for club contests.', '{"github": "https://github.com/", "codeforces": "https://codeforces.com/", "kattis": "https://open.kattis.com/"}'::jsonb, 2),
  ('[Exec Name 3]', 'VP Training', 'ICPC contestant and co-founder. Runs the weekly practice sessions and the beginner workshop series.', '{"linkedin": "https://www.linkedin.com/", "codeforces": "https://codeforces.com/"}'::jsonb, 3);

insert into public.past_contests (title, held_on, problems, participants, description, kattis_url) values
  ('Fall Club Contest #1', date '2026-11-07', 8, 24, 'Our first club contest. Mostly easy and medium problems, with one hard graph problem at the end.', 'https://open.kattis.com/contests'),
  ('Kickoff Mini-Contest', date '2026-10-08', 5, 31, 'A one-hour warm-up to try Kattis for the first time. Everyone solved at least one problem.', 'https://open.kattis.com/contests');

insert into public.problems (name, url, topic, difficulty, sort_order) values
  ('Hello World!', 'https://open.kattis.com/problems/hello', 'I/O', 'easy', 1),
  ('Take Two Stones', 'https://open.kattis.com/problems/twostones', 'Math', 'easy', 2),
  ('Quadrant Selection', 'https://open.kattis.com/problems/quadrant', 'Conditionals', 'easy', 3),
  ('Stuck In A Time Loop', 'https://open.kattis.com/problems/timeloop', 'Loops', 'easy', 4),
  ('Odd Echo', 'https://open.kattis.com/problems/oddecho', 'Arrays', 'easy', 5),
  ('Pot', 'https://open.kattis.com/problems/pot', 'Math', 'easy', 6),
  ('Faktor', 'https://open.kattis.com/problems/faktor', 'Math', 'easy', 7),
  ('R2', 'https://open.kattis.com/problems/r2', 'Math', 'easy', 8),
  ('10 Kinds of People', 'https://open.kattis.com/problems/10kindsofpeople', 'BFS / flood fill', 'medium', 1),
  ('Grid', 'https://open.kattis.com/problems/grid', 'BFS', 'medium', 2),
  ('Union-Find', 'https://open.kattis.com/problems/unionfind', 'DSU', 'medium', 3),
  ('Radio Commercials', 'https://open.kattis.com/problems/commercials', 'Max subarray', 'medium', 4),
  ('Exact Change', 'https://open.kattis.com/problems/exactchange2', 'DP', 'medium', 5),
  ('Knapsack', 'https://open.kattis.com/problems/knapsack', 'DP', 'medium', 6),
  ('Get Shorty', 'https://open.kattis.com/problems/getshorty', 'Dijkstra', 'medium', 7),
  ('Single source shortest path, non-negative weights', 'https://open.kattis.com/problems/shortestpath1', 'Dijkstra', 'medium', 8),
  ('Minimum Spanning Tree', 'https://open.kattis.com/problems/minspantree', 'MST', 'hard', 1),
  ('Fenwick Tree', 'https://open.kattis.com/problems/fenwick', 'Data structures', 'hard', 2),
  ('Supercomputer', 'https://open.kattis.com/problems/supercomputer', 'Data structures', 'hard', 3),
  ('String Matching', 'https://open.kattis.com/problems/stringmatching', 'KMP', 'hard', 4),
  ('Convex Hull', 'https://open.kattis.com/problems/convexhull', 'Geometry', 'hard', 5),
  ('Maximum Flow', 'https://open.kattis.com/problems/maxflow', 'Flows', 'hard', 6),
  ('Minimum Cost Maximum Flow', 'https://open.kattis.com/problems/mincostmaxflow', 'Flows', 'hard', 7),
  ('Suffix Sorting', 'https://open.kattis.com/problems/suffixsorting', 'Strings', 'hard', 8);

insert into public.faqs (question, answer, sort_order) values
  ('Do I need programming experience?', 'Some, yes. We highly recommend that you have taken, or are taking, COMP-1400 (the intro programming course in C), or that you''re comfortable with the basics in any language: variables, conditionals, loops, functions and arrays. You don''t need any competitive programming experience; that''s what we teach.', 1),
  ('Which languages can I use?', 'C++, Python and Java. These are the languages ICPC allows, and the ones Kattis and Codeforces support best. Most competitive programmers end up using C++ for speed, but Python is a great place to start.', 2),
  ('Do I have to be a Computer Science student?', 'No. Any UWindsor student is welcome: engineering, math, science, business, anyone. To compete at ICPC you must meet ICPC''s eligibility rules, and we''ll help you check.', 4),
  ('How do I get on an ICPC team?', 'Come to practice and club contests. Before the regional we help members form teams of three based on interest and skill, and we hold training sessions in the weeks before.', 5),
  ('I can''t make every session. Is that okay?', 'Yes. Come when you can. Problems and solutions from each session are posted on Discord so you can catch up.', 6);
