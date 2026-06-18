DELETE FROM public.user_plans a USING public.user_plans b
WHERE a.user_id = b.user_id AND a.created_at < b.created_at;

ALTER TABLE public.user_plans ADD CONSTRAINT user_plans_user_id_key UNIQUE (user_id);