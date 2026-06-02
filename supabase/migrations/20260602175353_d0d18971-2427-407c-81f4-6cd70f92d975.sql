CREATE TABLE public.sitemap_status_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_url text NOT NULL,
  sitemap_url text NOT NULL,
  is_pending boolean,
  is_sitemaps_index boolean,
  last_submitted timestamptz,
  last_downloaded timestamptz,
  warnings bigint,
  errors bigint,
  total_submitted bigint,
  total_indexed bigint,
  raw_payload jsonb,
  fetch_error text,
  checked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sitemap_snapshots_site_checked
  ON public.sitemap_status_snapshots (site_url, checked_at DESC);

GRANT SELECT ON public.sitemap_status_snapshots TO authenticated;
GRANT ALL ON public.sitemap_status_snapshots TO service_role;

ALTER TABLE public.sitemap_status_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read snapshots"
ON public.sitemap_status_snapshots
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));