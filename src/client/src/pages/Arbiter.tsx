import { useState, useEffect } from 'react';
import api from '../lib/api';

export default function Arbiter() {
  const [deployments, setDeployments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeployments();
  }, []);

  const loadDeployments = async () => {
    try {
      const response = await api.get('/arbiter/deployments');
      setDeployments(response.data);
    } catch (error) {
      console.error('Failed to load deployments', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Arbiter Platform</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Deployments</h2>
        {deployments.length === 0 ? (
          <p className="text-gray-500">No deployments found. Add your first deployment to get started.</p>
        ) : (
          <div className="space-y-4">
            {deployments.map((deployment) => (
              <div key={deployment.id} className="border rounded-lg p-4">
                <h3 className="font-semibold">{deployment.name}</h3>
                <p className="text-sm text-gray-600">{deployment.client_name}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Monthly Fee: ${deployment.monthly_subscription_fee?.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

