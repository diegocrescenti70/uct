-- ========================================
-- UCT 2.0 - SCHEMA DATABASE SUPABASE  
-- ========================================

-- Tabella per eventi del calendario universitario
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL DEFAULT 'event',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location VARCHAR(255),
  reminder_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_user_start ON events(user_id, start_date);

-- RLS (Row Level Security) per sicurezza
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy per permettere agli utenti di vedere solo i propri eventi
DROP POLICY IF EXISTS "Users can view their own events" ON events;
CREATE POLICY "Users can view their own events" ON events
  FOR SELECT USING (auth.uid() = user_id);

-- Policy per permettere agli utenti di inserire i propri eventi  
DROP POLICY IF EXISTS "Users can insert their own events" ON events;
CREATE POLICY "Users can insert their own events" ON events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy per permettere agli utenti di aggiornare i propri eventi
DROP POLICY IF EXISTS "Users can update their own events" ON events;
CREATE POLICY "Users can update their own events" ON events
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy per permettere agli utenti di eliminare i propri eventi
DROP POLICY IF EXISTS "Users can delete their own events" ON events;
CREATE POLICY "Users can delete their own events" ON events
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at 
  BEFORE UPDATE ON events 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- EVENTI DI ESEMPIO (OPZIONALE)
-- ========================================
-- Esegui solo se vuoi eventi di test!

INSERT INTO events (user_id, title, description, type, start_date, end_date, location) 
VALUES 
-- Sostituisci questi UUID con il TUO user_id
-- Puoi trovarlo con: SELECT auth.uid();
(auth.uid(), 'Esame Matematica', 'Esame di Analisi Matematica I', 'exam', '2025-01-15 09:00:00+00', '2025-01-15 11:00:00+00', 'Aula Magna'),
(auth.uid(), 'Lezione Fisica', 'Lezione di Fisica Generale', 'lecture', '2025-01-10 14:00:00+00', '2025-01-10 16:00:00+00', 'Aula 101'),
(auth.uid(), 'Scadenza Progetto', 'Consegna progetto di programmazione', 'deadline', '2025-01-20 23:59:00+00', NULL, 'Online'),
(auth.uid(), 'Ricevimento Prof. Rossi', 'Appuntamento con il professore', 'appointment', '2025-01-12 10:00:00+00', '2025-01-12 11:00:00+00', 'Ufficio 203')
ON CONFLICT DO NOTHING;

-- Verifica creazione tabella
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;