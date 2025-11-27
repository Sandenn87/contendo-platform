import { useEffect, useState } from 'react';
import api from '../lib/api';
import { DollarSign, Building2, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await api.get('/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Failed to load dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-red-600">Failed to load dashboard data</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Healthcare Revenue"
          value={`$${data.healthcare?.profitability?.revenue?.toLocaleString() || '0'}`}
          trend={data.healthcare?.profitability?.profit >= 0 ? 'up' : 'down'}
          icon={<DollarSign className="w-8 h-8" />}
        />
        <MetricCard
          title="Training Projects"
          value={data.training?.activeProjects || 0}
          trend="neutral"
          icon={<Building2 className="w-8 h-8" />}
        />
        <MetricCard
          title="Arbiter Deployments"
          value={data.arbiter?.activeDeployments || 0}
          trend="neutral"
          icon={<Building2 className="w-8 h-8" />}
        />
        <MetricCard
          title="Cash Flow"
          value={`$${data.financial?.cashFlow?.current?.toLocaleString() || '0'}`}
          trend={data.financial?.cashFlow?.current >= 0 ? 'up' : 'down'}
          icon={<DollarSign className="w-8 h-8" />}
        />
      </div>

      {/* AI Recommendations */}
      {data.aiRecommendations && data.aiRecommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-primary-600" />
            AI Recommendations
          </h2>
          <div className="space-y-3">
            {data.aiRecommendations.map((rec: any, idx: number) => (
              <div key={idx} className="border-l-4 border-primary-500 pl-4 py-2">
                <h3 className="font-medium text-gray-900">{rec.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Division Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DivisionCard title="Healthcare" data={data.healthcare} />
        <DivisionCard title="Training" data={data.training} />
        <DivisionCard title="Arbiter" data={data.arbiter} />
        <DivisionCard title="Financial" data={data.financial} />
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, icon }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${trend === 'up' ? 'bg-green-100 text-green-600' : trend === 'down' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function DivisionCard({ title, data }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-2 text-sm">
        {Object.entries(data || {}).map(([key, value]: [string, any]) => (
          <div key={key} className="flex justify-between">
            <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
            <span className="font-medium">
              {typeof value === 'number' ? (key.includes('revenue') || key.includes('cost') || key.includes('profit') ? `$${value.toLocaleString()}` : value) : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

