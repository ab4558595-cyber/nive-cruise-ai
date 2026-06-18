
CREATE POLICY "own usage insert" ON public.business_tool_usage FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own usage update" ON public.business_tool_usage FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own events insert" ON public.business_tool_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own topups insert" ON public.business_credit_topups FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
