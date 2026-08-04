CREATE TABLE public.marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text,
  name text NOT NULL,
  tagline text NOT NULL,
  description text,
  kind text NOT NULL DEFAULT 'agent' CHECK (kind IN ('tool','agent','integration')),
  category text NOT NULL DEFAULT 'General',
  prompt text,
  tags text[] NOT NULL DEFAULT '{}',
  homepage text,
  install_count integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.marketplace_listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_listings TO authenticated;
GRANT ALL ON public.marketplace_listings TO service_role;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published listings are readable by anyone"
  ON public.marketplace_listings FOR SELECT TO anon, authenticated
  USING (is_published = true);
CREATE POLICY "Authors can read their own listings"
  ON public.marketplace_listings FOR SELECT TO authenticated
  USING (author_id = auth.uid());
CREATE POLICY "Authors can create listings"
  ON public.marketplace_listings FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors can update their own listings"
  ON public.marketplace_listings FOR UPDATE TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors can delete their own listings"
  ON public.marketplace_listings FOR DELETE TO authenticated
  USING (author_id = auth.uid());

CREATE TABLE public.marketplace_installs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_key text NOT NULL,
  listing_id uuid REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_installs TO authenticated;
GRANT ALL ON public.marketplace_installs TO service_role;
ALTER TABLE public.marketplace_installs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own installs"
  ON public.marketplace_installs FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.bump_marketplace_installs(_listing_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.marketplace_listings
     SET install_count = install_count + 1
   WHERE id = _listing_id AND is_published = true;
$$;

GRANT EXECUTE ON FUNCTION public.bump_marketplace_installs(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.touch_marketplace_listing()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_touch_marketplace_listing
BEFORE UPDATE ON public.marketplace_listings
FOR EACH ROW EXECUTE FUNCTION public.touch_marketplace_listing();