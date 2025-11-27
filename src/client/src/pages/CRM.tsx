import { useState, useEffect } from 'react';
import api from '../lib/api';

export default function CRM() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [contactsRes, accountsRes] = await Promise.all([
        api.get('/crm/contacts'),
        api.get('/crm/accounts')
      ]);
      setContacts(contactsRes.data);
      setAccounts(accountsRes.data);
    } catch (error) {
      console.error('Failed to load CRM data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">CRM</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Contacts</h2>
          {contacts.length === 0 ? (
            <p className="text-gray-500">No contacts found. Sync with HubSpot to get started.</p>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <div key={contact.id} className="border rounded p-3">
                  <p className="font-medium">
                    {contact.first_name} {contact.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{contact.email}</p>
                  {contact.company_name && (
                    <p className="text-sm text-gray-500">{contact.company_name}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Accounts</h2>
          {accounts.length === 0 ? (
            <p className="text-gray-500">No accounts found. Sync with HubSpot to get started.</p>
          ) : (
            <div className="space-y-2">
              {accounts.map((account) => (
                <div key={account.id} className="border rounded p-3">
                  <p className="font-medium">{account.name}</p>
                  {account.domain && (
                    <p className="text-sm text-gray-600">{account.domain}</p>
                  )}
                  {account.industry && (
                    <p className="text-sm text-gray-500">{account.industry}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

