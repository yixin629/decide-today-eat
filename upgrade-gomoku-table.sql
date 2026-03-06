-- Upgrade Gomoku Table for Real-Time Multiplayer
-- Run this in the Supabase SQL Editor

-- 1. Add new columns to existing gomoku_games table
alter table gomoku_games
  add column if not exists players jsonb default '[]'::jsonb not null,
  add column if not exists host_id text,
  add column if not exists game_mode text default 'pvp' check (game_mode in ('pvp', 'pve'));

-- Update any existing games to have a dummy host (for safety of older records if necessary)
-- update gomoku_games set host_id = 'legacy' where host_id is null;

-- NOTE: We retain board, current_player, status, winner, last_move mapping exactly 
-- to support the legacy structure but extend it for online.
