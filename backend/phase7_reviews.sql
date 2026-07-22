-- Phase 7: Customer Reviews

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tab_id UUID REFERENCES public.tabs(id) ON DELETE CASCADE,
    table_number TEXT,
    rating INTEGER NOT NULL,
    tags JSONB,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allow unrestricted API access for simplicity in demo
DROP POLICY IF EXISTS "Allow all for reviews" ON public.reviews;
CREATE POLICY "Allow all for reviews" ON public.reviews FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
