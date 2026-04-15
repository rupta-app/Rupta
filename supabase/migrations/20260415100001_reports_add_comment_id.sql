-- Add comment_id to reports so users can report individual comments
-- Nullable to keep existing completion/user reports valid

ALTER TABLE public.reports
  ADD COLUMN comment_id UUID REFERENCES public.comments (id) ON DELETE SET NULL;

CREATE INDEX idx_reports_comment ON public.reports (comment_id);
