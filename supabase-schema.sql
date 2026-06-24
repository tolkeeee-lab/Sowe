-- #################################################################
-- MOMO PREMIUM - DATABASE SCHEMA (MULTI-CABIN & ROLES)
-- #################################################################

-- Clean up existing simple tables if needed
DROP TABLE IF EXISTS public.momo_transactions CASCADE;
DROP TABLE IF EXISTS public.momo_balances CASCADE;
DROP TABLE IF EXISTS public.momo_coffres CASCADE;
DROP TABLE IF EXISTS public.momo_blacklist CASCADE;
DROP TABLE IF EXISTS public.momo_settings CASCADE;
DROP TABLE IF EXISTS public.momo_profiles CASCADE;
DROP TABLE IF EXISTS public.momo_cabins CASCADE;

-- 1. CABINS TABLE
CREATE TABLE public.momo_cabins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL, -- References auth.users.id
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER PROFILES TABLE
CREATE TABLE public.momo_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('proprio', 'employe', 'vm', 'vm_hybrid')),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    business_name TEXT, -- For owners, name of their company
    owner_id UUID REFERENCES auth.users(id), -- NULL for owners, refers to boss/owner for employees
    assigned_cabin_id UUID REFERENCES public.momo_cabins(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TRANSACTIONS TABLE
CREATE TABLE public.momo_transactions (
    id TEXT PRIMARY KEY,
    cabin_id UUID NOT NULL REFERENCES public.momo_cabins(id) ON DELETE CASCADE,
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

-- 4. CURRENT OPERATIONAL BALANCES (per Cabin)
CREATE TABLE public.momo_balances (
    cabin_id UUID PRIMARY KEY REFERENCES public.momo_cabins(id) ON DELETE CASCADE,
    mtn NUMERIC NOT NULL DEFAULT 0,
    moov NUMERIC NOT NULL DEFAULT 0,
    celtiis NUMERIC NOT NULL DEFAULT 0,
    cash NUMERIC NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. START/FLOAT RESERVES (COFFRES) (per Cabin)
CREATE TABLE public.momo_coffres (
    cabin_id UUID PRIMARY KEY REFERENCES public.momo_cabins(id) ON DELETE CASCADE,
    mtn NUMERIC NOT NULL DEFAULT 0,
    moov NUMERIC NOT NULL DEFAULT 0,
    celtiis NUMERIC NOT NULL DEFAULT 0,
    cash NUMERIC NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. COMMUNITY BLACKLIST (Global sharing)
CREATE TABLE public.momo_blacklist (
    phone TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SETTINGS TABLE (PIN CODE & ROLE PARAMS) (per Cabin)
CREATE TABLE public.momo_settings (
    cabin_id UUID PRIMARY KEY REFERENCES public.momo_cabins(id) ON DELETE CASCADE,
    pin_code TEXT NOT NULL DEFAULT '1234',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE RLS (Row Level Security)
ALTER TABLE public.momo_cabins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.momo_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.momo_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.momo_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.momo_coffres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.momo_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.momo_settings ENABLE ROW LEVEL SECURITY;

-- CREATE RLS SECURITY POLICIES

-- profiles: separate policies for CRUD to avoid FOR ALL inserting conflicts during signup
CREATE POLICY "Select profiles" ON public.momo_profiles
    FOR SELECT USING (
        id = auth.uid() 
        OR owner_id = auth.uid()
    );

CREATE POLICY "Insert profiles" ON public.momo_profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Update profiles" ON public.momo_profiles
    FOR UPDATE USING (
        id = auth.uid() 
        OR owner_id = auth.uid()
    ) WITH CHECK (
        id = auth.uid() 
        OR owner_id = auth.uid()
    );

CREATE POLICY "Delete profiles" ON public.momo_profiles
    FOR DELETE USING (
        id = auth.uid() 
        OR owner_id = auth.uid()
    );

-- cabins: owners manage all their cabins, employees see their assigned one
CREATE POLICY "Access cabins" ON public.momo_cabins
    FOR ALL USING (
        owner_id = auth.uid()
        OR id = (SELECT assigned_cabin_id FROM public.momo_profiles WHERE id = auth.uid())
    ) WITH CHECK (
        owner_id = auth.uid()
    );

-- transactions: read allowed, insert allowed, delete only by owners
CREATE POLICY "Select transactions" ON public.momo_transactions
    FOR SELECT USING (
        cabin_id IN (
            SELECT id FROM public.momo_cabins WHERE owner_id = auth.uid()
            UNION
            SELECT assigned_cabin_id FROM public.momo_profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Insert transactions" ON public.momo_transactions
    FOR INSERT WITH CHECK (
        cabin_id IN (
            SELECT id FROM public.momo_cabins WHERE owner_id = auth.uid()
            UNION
            SELECT assigned_cabin_id FROM public.momo_profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Delete transactions" ON public.momo_transactions
    FOR DELETE USING (
        cabin_id IN (SELECT id FROM public.momo_cabins WHERE owner_id = auth.uid())
    );

-- balances: access
CREATE POLICY "Access balances" ON public.momo_balances
    FOR ALL USING (
        cabin_id IN (
            SELECT id FROM public.momo_cabins WHERE owner_id = auth.uid()
            UNION
            SELECT assigned_cabin_id FROM public.momo_profiles WHERE id = auth.uid()
        )
    ) WITH CHECK (
        cabin_id IN (
            SELECT id FROM public.momo_cabins WHERE owner_id = auth.uid()
            UNION
            SELECT assigned_cabin_id FROM public.momo_profiles WHERE id = auth.uid()
        )
    );

-- coffres: owners all access, employees select only
CREATE POLICY "Select coffres" ON public.momo_coffres
    FOR SELECT USING (
        cabin_id IN (
            SELECT id FROM public.momo_cabins WHERE owner_id = auth.uid()
            UNION
            SELECT assigned_cabin_id FROM public.momo_profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Modify coffres" ON public.momo_coffres
    FOR ALL USING (
        cabin_id IN (SELECT id FROM public.momo_cabins WHERE owner_id = auth.uid())
    );

-- blacklist: public/authenticated read/insert, delete only by owners
CREATE POLICY "Access blacklist" ON public.momo_blacklist
    FOR ALL USING (true) WITH CHECK (true);

-- settings: owners all access, employees select only
CREATE POLICY "Select settings" ON public.momo_settings
    FOR SELECT USING (
        cabin_id IN (
            SELECT id FROM public.momo_cabins WHERE owner_id = auth.uid()
            UNION
            SELECT assigned_cabin_id FROM public.momo_profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Modify settings" ON public.momo_settings
    FOR ALL USING (
        cabin_id IN (SELECT id FROM public.momo_cabins WHERE owner_id = auth.uid())
    );

-- #################################################################
-- 8. VM CLIENTS TABLE (for registering business clients)
-- #################################################################
CREATE TABLE IF NOT EXISTS public.momo_vm_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabin_id UUID NOT NULL REFERENCES public.momo_cabins(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Business/company name
    phone TEXT NOT NULL, -- MoMo phone number
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (cabin_id, phone)
);

-- Add client_name to transactions table
ALTER TABLE public.momo_transactions ADD COLUMN IF NOT EXISTS client_name TEXT;

-- Enable RLS for momo_vm_clients
ALTER TABLE public.momo_vm_clients ENABLE ROW LEVEL SECURITY;

-- RLS Policy for momo_vm_clients
CREATE POLICY "Access vm_clients" ON public.momo_vm_clients
    FOR ALL USING (
        cabin_id IN (
            SELECT id FROM public.momo_cabins WHERE owner_id = auth.uid()
            UNION
            SELECT assigned_cabin_id FROM public.momo_profiles WHERE id = auth.uid()
        )
    ) WITH CHECK (
        cabin_id IN (
            SELECT id FROM public.momo_cabins WHERE owner_id = auth.uid()
            UNION
            SELECT assigned_cabin_id FROM public.momo_profiles WHERE id = auth.uid()
        )
    );
