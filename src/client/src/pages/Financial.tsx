import { useState, useEffect } from 'react';
import api from '../lib/api';

export default function Financial() {
  const [financialData, setFinancialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      const response = await api.get('/dashboard/financial');
      setFinancialData(response.data);
    } catch (error) {
      console.error('Failed to load financial data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Financial Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Cash Flow</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Current:</span>
              <span className="font-semibold">${financialData?.cashFlow?.current?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex justify-between">
              <span>Projected:</span>
              <span className="font-semibold">${financialData?.cashFlow?.projected?.toLocaleString() || '0'}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Profit & Loss</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Revenue:</span>
              <span className="font-semibold text-green-600">
                ${financialData?.profitLoss?.revenue?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Expenses:</span>
              <span className="font-semibold text-red-600">
                ${financialData?.profitLoss?.expenses?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span>Net Income:</span>
              <span className="font-semibold">
                ${financialData?.profitLoss?.netIncome?.toLocaleString() || '0'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

