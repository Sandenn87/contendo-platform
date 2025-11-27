-- Healthcare Projects Module
CREATE TABLE IF NOT EXISTS public.healthcare_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  network_name TEXT NOT NULL, -- e.g., "Horizon Health Network", "Vitalite Health Network"
  contact_email TEXT,
  primary_contact_id UUID REFERENCES public.contacts(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.healthcare_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.healthcare_clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saas_agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.healthcare_projects(id) ON DELETE CASCADE,
  annual_fee DECIMAL(12, 2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  renewal_date DATE NOT NULL,
  auto_renew BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending_renewal', 'expired', 'cancelled')),
  quickbooks_invoice_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.developers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  hourly_rate DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_developers (
  project_id UUID REFERENCES public.healthcare_projects(id) ON DELETE CASCADE,
  developer_id UUID REFERENCES public.developers(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'developer',
  hourly_rate DECIMAL(10, 2), -- Override default rate if needed
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, developer_id)
);

CREATE TABLE IF NOT EXISTS public.developer_estimates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.healthcare_projects(id) ON DELETE CASCADE,
  developer_id UUID REFERENCES public.developers(id) ON DELETE CASCADE,
  hours_estimated DECIMAL(10, 2) NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_billing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.healthcare_projects(id) ON DELETE CASCADE,
  invoice_number TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  markup_percentage DECIMAL(5, 2) DEFAULT 0,
  billing_date DATE NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'accepted', 'paid', 'overdue')),
  quickbooks_invoice_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.meeting_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.healthcare_projects(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  meeting_type TEXT DEFAULT 'check_in',
  is_decision_maker BOOLEAN DEFAULT FALSE,
  first_invited_at TIMESTAMPTZ DEFAULT NOW(),
  last_invited_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, contact_id, meeting_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_healthcare_projects_client_id ON public.healthcare_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_saas_agreements_project_id ON public.saas_agreements(project_id);
CREATE INDEX IF NOT EXISTS idx_saas_agreements_renewal_date ON public.saas_agreements(renewal_date);
CREATE INDEX IF NOT EXISTS idx_project_developers_project_id ON public.project_developers(project_id);
CREATE INDEX IF NOT EXISTS idx_developer_estimates_project_id ON public.developer_estimates(project_id);
CREATE INDEX IF NOT EXISTS idx_developer_estimates_status ON public.developer_estimates(status);
CREATE INDEX IF NOT EXISTS idx_project_billing_project_id ON public.project_billing(project_id);
CREATE INDEX IF NOT EXISTS idx_project_billing_status ON public.project_billing(status);

-- Enable RLS
ALTER TABLE public.healthcare_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healthcare_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies (all users can view, but only admins can modify)
CREATE POLICY "Users can view healthcare data" ON public.healthcare_clients FOR SELECT USING (true);
CREATE POLICY "Users can view healthcare projects" ON public.healthcare_projects FOR SELECT USING (true);
CREATE POLICY "Users can view saas agreements" ON public.saas_agreements FOR SELECT USING (true);
CREATE POLICY "Users can view developers" ON public.developers FOR SELECT USING (true);
CREATE POLICY "Users can view project developers" ON public.project_developers FOR SELECT USING (true);
CREATE POLICY "Users can view developer estimates" ON public.developer_estimates FOR SELECT USING (true);
CREATE POLICY "Users can view project billing" ON public.project_billing FOR SELECT USING (true);
CREATE POLICY "Users can view meeting participants" ON public.meeting_participants FOR SELECT USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_healthcare_clients_updated_at BEFORE UPDATE ON public.healthcare_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_healthcare_projects_updated_at BEFORE UPDATE ON public.healthcare_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saas_agreements_updated_at BEFORE UPDATE ON public.saas_agreements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_developers_updated_at BEFORE UPDATE ON public.developers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_developer_estimates_updated_at BEFORE UPDATE ON public.developer_estimates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_billing_updated_at BEFORE UPDATE ON public.project_billing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

