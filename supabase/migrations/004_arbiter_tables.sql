-- Arbiter Platform Management Module
CREATE TABLE IF NOT EXISTS public.arbiter_deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  monthly_subscription_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  deployment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.deployment_server_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deployment_id UUID REFERENCES public.arbiter_deployments(id) ON DELETE CASCADE,
  cost_type TEXT NOT NULL CHECK (cost_type IN ('compute', 'memory', 'storage', 'bandwidth', 'other')),
  description TEXT NOT NULL,
  monthly_cost DECIMAL(10, 2) NOT NULL,
  allocation_type TEXT DEFAULT 'direct' CHECK (allocation_type IN ('direct', 'shared')),
  -- For shared costs, this will be NULL
  -- For direct costs, this references the specific deployment
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.deployment_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deployment_id UUID REFERENCES public.arbiter_deployments(id) ON DELETE CASCADE,
  developer_id UUID REFERENCES public.developers(id) ON DELETE SET NULL,
  hours DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  allocation_type TEXT DEFAULT 'direct' CHECK (allocation_type IN ('direct', 'shared')),
  -- For shared maintenance, deployment_id will reference a "shared" deployment
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shared_platform_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cost_type TEXT NOT NULL CHECK (cost_type IN ('server', 'infrastructure', 'development', 'support', 'other')),
  description TEXT NOT NULL,
  monthly_cost DECIMAL(10, 2) NOT NULL,
  allocation_method TEXT DEFAULT 'equal' CHECK (allocation_method IN ('equal', 'usage_based', 'revenue_based')),
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.arbiter_business_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_date DATE NOT NULL,
  total_deployments INTEGER DEFAULT 0,
  total_monthly_revenue DECIMAL(12, 2) DEFAULT 0,
  total_monthly_costs DECIMAL(12, 2) DEFAULT 0,
  market_share_percentage DECIMAL(5, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(metric_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deployment_server_costs_deployment_id ON public.deployment_server_costs(deployment_id);
CREATE INDEX IF NOT EXISTS idx_deployment_server_costs_allocation_type ON public.deployment_server_costs(allocation_type);
CREATE INDEX IF NOT EXISTS idx_deployment_maintenance_deployment_id ON public.deployment_maintenance(deployment_id);
CREATE INDEX IF NOT EXISTS idx_deployment_maintenance_developer_id ON public.deployment_maintenance(developer_id);
CREATE INDEX IF NOT EXISTS idx_arbiter_business_metrics_metric_date ON public.arbiter_business_metrics(metric_date);

-- Enable RLS
ALTER TABLE public.arbiter_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployment_server_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployment_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_platform_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arbiter_business_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view arbiter deployments" ON public.arbiter_deployments FOR SELECT USING (true);
CREATE POLICY "Users can view deployment server costs" ON public.deployment_server_costs FOR SELECT USING (true);
CREATE POLICY "Users can view deployment maintenance" ON public.deployment_maintenance FOR SELECT USING (true);
CREATE POLICY "Users can view shared platform costs" ON public.shared_platform_costs FOR SELECT USING (true);
CREATE POLICY "Users can view business metrics" ON public.arbiter_business_metrics FOR SELECT USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_arbiter_deployments_updated_at BEFORE UPDATE ON public.arbiter_deployments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deployment_server_costs_updated_at BEFORE UPDATE ON public.deployment_server_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deployment_maintenance_updated_at BEFORE UPDATE ON public.deployment_maintenance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shared_platform_costs_updated_at BEFORE UPDATE ON public.shared_platform_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

