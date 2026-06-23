-- #################################################################
-- MOMO PREMIUM - EXTRA TABLE FOR DEBTS & REMINDERS
-- #################################################################

CREATE TABLE IF NOT EXISTS public.momo_debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabin_id UUID NOT NULL REFERENCES public.momo_cabins(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    due_date DATE,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'non_paye' CHECK (status IN ('non_paye', 'paye')),
    type TEXT NOT NULL DEFAULT 'depot_a_rendre' CHECK (type IN ('depot_a_rendre', 'credit_client', 'transfert_proprio_cash', 'transfert_proprio_sim', 'autre')),
    operator TEXT CHECK (operator IN ('mtn', 'moov', 'celtiis')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.momo_debts ENABLE ROW LEVEL SECURITY;

-- Drop policy if it exists to allow clean re-runs
DROP POLICY IF EXISTS "Access debts" ON public.momo_debts;

-- Create policy
CREATE POLICY "Access debts" ON public.momo_debts
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
