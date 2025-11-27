-- Custom Training Projects Module
CREATE TABLE IF NOT EXISTS public.training_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'archived')),
  invoiced_amount DECIMAL(12, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.training_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  completion_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cost_centers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.training_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  budget DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.training_projects(id) ON DELETE CASCADE,
  cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL,
  hourly_rate DECIMAL(10, 2) NOT NULL,
  allocated_hours DECIMAL(10, 2) DEFAULT 0,
  actual_hours DECIMAL(10, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.training_projects(id) ON DELETE CASCADE,
  cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL,
  employee_id UUID REFERENCES public.project_employees(id) ON DELETE SET NULL,
  cost_type TEXT NOT NULL CHECK (cost_type IN ('labor', 'materials', 'overhead', 'other')),
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  date_incurred DATE NOT NULL,
  invoice_number TEXT,
  quickbooks_expense_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.training_projects(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  quickbooks_invoice_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.report_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.training_projects(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  report_type TEXT DEFAULT 'pl' CHECK (report_type IN ('pl', 'progress', 'both')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, contact_id, report_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON public.project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_status ON public.project_milestones(status);
CREATE INDEX IF NOT EXISTS idx_cost_centers_project_id ON public.cost_centers(project_id);
CREATE INDEX IF NOT EXISTS idx_project_employees_project_id ON public.project_employees(project_id);
CREATE INDEX IF NOT EXISTS idx_project_employees_cost_center_id ON public.project_employees(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_project_costs_project_id ON public.project_costs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_costs_cost_center_id ON public.project_costs(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_project_costs_employee_id ON public.project_costs(employee_id);
CREATE INDEX IF NOT EXISTS idx_project_invoices_project_id ON public.project_invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invoices_status ON public.project_invoices(status);

-- Enable RLS
ALTER TABLE public.training_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_recipients ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view training projects" ON public.training_projects FOR SELECT USING (true);
CREATE POLICY "Users can view project milestones" ON public.project_milestones FOR SELECT USING (true);
CREATE POLICY "Users can view cost centers" ON public.cost_centers FOR SELECT USING (true);
CREATE POLICY "Users can view project employees" ON public.project_employees FOR SELECT USING (true);
CREATE POLICY "Users can view project costs" ON public.project_costs FOR SELECT USING (true);
CREATE POLICY "Users can view project invoices" ON public.project_invoices FOR SELECT USING (true);
CREATE POLICY "Users can view report recipients" ON public.report_recipients FOR SELECT USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_training_projects_updated_at BEFORE UPDATE ON public.training_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_milestones_updated_at BEFORE UPDATE ON public.project_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cost_centers_updated_at BEFORE UPDATE ON public.cost_centers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_employees_updated_at BEFORE UPDATE ON public.project_employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_costs_updated_at BEFORE UPDATE ON public.project_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_invoices_updated_at BEFORE UPDATE ON public.project_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

