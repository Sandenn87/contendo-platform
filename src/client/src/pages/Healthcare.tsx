import { useState, useEffect } from 'react';
import api from '../lib/api';

export default function Healthcare() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const response = await api.get('/healthcare/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Failed to load clients', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Healthcare Management</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Clients</h2>
        {clients.length === 0 ? (
          <p className="text-gray-500">No clients found. Add your first client to get started.</p>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => (
              <div key={client.id} className="border rounded-lg p-4">
                <h3 className="font-semibold">{client.name}</h3>
                <p className="text-sm text-gray-600">{client.network_name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

