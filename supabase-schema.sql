-- #################################################################
-- MOMO PREMIUM - DATABASE SCHEMA
-- #################################################################

DROP TABLE IF EXISTS public.momo_transactions CASCADE;
DROP TABLE IF EXISTS public.momo_balances CASCADE;
DROP TABLE IF EXISTS public.momo_coffres CASCADE;
DROP TABLE IF EXISTS public.momo_blacklist CASCADE;
DROP TABLE IF EXISTS public.momo_settings CASCADE;

-- 1. TRANSACTIONS TABLE
CREATE TABLE public.momo_transactions (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL,
    operator TEXT NOT NULL, -- mtn, moov, celtiis
    type TEXT NOT NULL,     -- deposit, withdrawal, credit, forfait, appro_sim, ajust_cash
    amount NUMERIC NOT NULL,
    time TEXT NOT NULL,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    is_scam_reported BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CURRENT OPERATIONAL BALANCES
CREATE TABLE public.momo_balances (
    id INT PRIMARY KEY DEFAULT 1,
    mtn NUMERIC NOT NULL DEFAULT 240000,
    moov NUMERIC NOT NULL DEFAULT 270000,
    celtiis NUMERIC NOT NULL DEFAULT 50000,
    cash NUMERIC NOT NULL DEFAULT 140000,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT singleton_row CHECK (id = 1)
);

-- 3. START/FLOAT RESERVES (COFFRES)
CREATE TABLE public.momo_coffres (
    id INT PRIMARY KEY DEFAULT 1,
    mtn NUMERIC NOT NULL DEFAULT 250000,
    moov NUMERIC NOT NULL DEFAULT 150000,
    celtiis NUMERIC NOT NULL DEFAULT 100000,
    cash NUMERIC NOT NULL DEFAULT 200000,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT singleton_row CHECK (id = 1)
);

-- 4. COMMUNITY BLACKLIST
CREATE TABLE public.momo_blacklist (
    phone TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SETTINGS TABLE (PIN CODE & ROLE PARAMS)
CREATE TABLE public.momo_settings (
    id INT PRIMARY KEY DEFAULT 1,
    pin_code TEXT NOT NULL DEFAULT '1234',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT singleton_row CHECK (id = 1)
);

-- INSERT INITIAL DATA
INSERT INTO public.momo_balances (id, mtn, moov, celtiis, cash) VALUES (1, 240000, 270000, 50000, 140000) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.momo_coffres (id, mtn, moov, celtiis, cash) VALUES (1, 250000, 150000, 100000, 200000) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.momo_settings (id, pin_code) VALUES (1, '1234') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.momo_blacklist (phone) VALUES ('0197451239'), ('0161485000') ON CONFLICT (phone) DO NOTHING;

-- ENABLE RLS (Row Level Security)
ALTER TABLE public.momo_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.momo_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.momo_coffres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.momo_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.momo_settings ENABLE ROW LEVEL SECURITY;

-- CREATE ALL-OPEN POLICIES FOR SIMPLE ACCESS (can be refined with user logins if auth is added)
CREATE POLICY "Allow public access to transactions" ON public.momo_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to balances" ON public.momo_balances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to coffres" ON public.momo_coffres FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to blacklist" ON public.momo_blacklist FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to settings" ON public.momo_settings FOR ALL USING (true) WITH CHECK (true);
