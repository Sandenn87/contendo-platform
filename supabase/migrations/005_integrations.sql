-- Integration Tables for External Services
CREATE TABLE IF NOT EXISTS public.integration_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL CHECK (service_name IN ('hubspot', 'quickbooks', 'microsoft_graph')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scope TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, service_name)
);

CREATE TABLE IF NOT EXISTS public.hubspot_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('contacts', 'accounts', 'deals', 'full')),
  records_synced INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  sync_started_at TIMESTAMPTZ DEFAULT NOW(),
  sync_completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS public.quickbooks_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('invoices', 'expenses', 'pl', 'cash_flow', 'full')),
  records_synced INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  sync_started_at TIMESTAMPTZ DEFAULT NOW(),
  sync_completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS public.email_scan_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emails_scanned INTEGER DEFAULT 0,
  contacts_found INTEGER DEFAULT 0,
  deals_updated INTEGER DEFAULT 0,
  accounts_updated INTEGER DEFAULT 0,
  scan_started_at TIMESTAMPTZ DEFAULT NOW(),
  scan_completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  amount DECIMAL(10, 2),
  vendor TEXT,
  date DATE,
  category TEXT,
  description TEXT,
  ocr_data JSONB,
  quickbooks_expense_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'synced', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.financial_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_date DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('month', 'quarter', 'year')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  total_expenses DECIMAL(12, 2) DEFAULT 0,
  net_income DECIMAL(12, 2) DEFAULT 0,
  cash_flow DECIMAL(12, 2) DEFAULT 0,
  healthcare_revenue DECIMAL(12, 2) DEFAULT 0,
  training_revenue DECIMAL(12, 2) DEFAULT 0,
  arbiter_revenue DECIMAL(12, 2) DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(snapshot_date, period_type, period_start)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_integration_tokens_user_id ON public.integration_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_tokens_service_name ON public.integration_tokens(service_name);
CREATE INDEX IF NOT EXISTS idx_hubspot_sync_log_status ON public.hubspot_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_quickbooks_sync_log_status ON public.quickbooks_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_email_scan_log_status ON public.email_scan_log(status);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON public.receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON public.receipts(status);
CREATE INDEX IF NOT EXISTS idx_financial_snapshots_snapshot_date ON public.financial_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_financial_snapshots_period_type ON public.financial_snapshots(period_type);

-- Enable RLS
ALTER TABLE public.integration_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubspot_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quickbooks_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_scan_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own integration tokens" ON public.integration_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view sync logs" ON public.hubspot_sync_log FOR SELECT USING (true);
CREATE POLICY "Users can view quickbooks sync logs" ON public.quickbooks_sync_log FOR SELECT USING (true);
CREATE POLICY "Users can view email scan logs" ON public.email_scan_log FOR SELECT USING (true);
CREATE POLICY "Users can view own receipts" ON public.receipts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view financial snapshots" ON public.financial_snapshots FOR SELECT USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_integration_tokens_updated_at BEFORE UPDATE ON public.integration_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receipts_updated_at BEFORE UPDATE ON public.receipts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

