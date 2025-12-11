import React, { useState, useEffect } from 'react';
import { IntegrationStatus } from '../types';
import { Check, Plus, RefreshCw, X, Smartphone } from 'lucide-react';

const IntegrationPanel: React.FC = () => {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([
    { id: '1', name: 'Salesforce CRM', connected: false, icon: 'https://cdn.worldvectorlogo.com/logos/salesforce-2.svg' },
    { id: '2', name: 'Zendesk Support', connected: false, icon: 'https://cdn.worldvectorlogo.com/logos/zendesk-1.svg' },
    { id: '3', name: 'HubSpot', connected: false, icon: 'https://cdn.worldvectorlogo.com/logos/hubspot.svg' },
    { id: '4', name: 'Slack', connected: true, lastSync: new Date(Date.now() - 3600000), icon: 'https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg' },
    { id: '5', name: 'Jira', connected: false, icon: 'https://cdn.worldvectorlogo.com/logos/jira-1.svg' },
  ]);

  const [simulating, setSimulating] = useState<string | null>(null);

  const toggleIntegration = (id: string) => {
    const target = integrations.find(i => i.id === id);
    if (target?.connected) {
      // Disconnect
      setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: false, lastSync: undefined } : i));
    } else {
      // Connect Simulation
      setSimulating(id);
      setTimeout(() => {
        setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: true, lastSync: new Date() } : i));
        setSimulating(null);
      }, 1500);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Integrations</h2>
        <p className="text-slate-500">Connect EmoSense with your existing business ecosystem.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <div key={integration.id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
               <div className="w-12 h-12 bg-slate-50 rounded-lg p-2 flex items-center justify-center border border-slate-100">
                  <img src={integration.icon} alt={integration.name} className="w-8 h-8 object-contain" />
               </div>
               <div className={`px-2 py-1 rounded text-xs font-semibold
                 ${integration.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                 {integration.connected ? 'Active' : 'Disconnected'}
               </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-bold text-slate-800">{integration.name}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {integration.connected 
                  ? `Last synced: ${integration.lastSync?.toLocaleTimeString()}`
                  : 'Sync customer data and tickets automatically.'}
              </p>
            </div>

            <button
              onClick={() => toggleIntegration(integration.id)}
              disabled={!!simulating}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center
                ${integration.connected 
                  ? 'border border-red-200 text-red-600 hover:bg-red-50' 
                  : 'bg-slate-900 text-white hover:bg-slate-800'}
                ${simulating === integration.id ? 'opacity-75 cursor-wait' : ''}
              `}
            >
              {simulating === integration.id ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Connecting...
                </>
              ) : integration.connected ? (
                <>
                  <X className="w-4 h-4 mr-2" /> Disconnect
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" /> Connect
                </>
              )}
            </button>
          </div>
        ))}
      </div>
      
      {/* Enterprise Info Box */}
      <div className="bg-indigo-900 rounded-xl p-8 text-white flex flex-col md:flex-row items-center justify-between shadow-xl">
        <div className="mb-6 md:mb-0 md:mr-6">
          <h3 className="text-xl font-bold mb-2">Need a custom integration?</h3>
          <p className="text-indigo-200 max-w-xl mb-4">
            Our Enterprise API allows for custom data ingestion from proprietary systems. 
            Contact our engineering team to build a tailored solution for your organization.
          </p>
          <div className="flex items-center space-x-2 text-emerald-400 bg-indigo-950/50 w-fit px-4 py-2 rounded-lg border border-indigo-800">
             <Smartphone className="w-5 h-5" />
             <span className="font-mono text-lg font-bold tracking-wide">+92-3201847179</span>
          </div>
        </div>
        <div className="flex flex-col space-y-3">
            <a href="tel:+923201847179" className="bg-white text-indigo-900 px-8 py-3 rounded-lg font-bold hover:bg-indigo-50 transition-colors text-center shadow-lg">
            Call Now
            </a>
            <span className="text-center text-xs text-indigo-300 opacity-70">Available 24/7 for Services</span>
        </div>
      </div>
    </div>
  );
};

export default IntegrationPanel;