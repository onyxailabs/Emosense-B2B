import React from 'react';
import { Database, Server, Shield, Share2, Layers } from 'lucide-react';

const SchemaViewer: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Database Architecture</h2>
        <p className="text-slate-500">Scalable MongoDB schema design for high-volume B2B sentiment analysis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
             <Database className="w-6 h-6" />
           </div>
           <h3 className="font-semibold text-slate-800">NoSQL Flexibility</h3>
           <p className="text-sm text-slate-600 mt-2">MongoDB allows for flexible schema evolution without downtime.</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
             <Server className="w-6 h-6" />
           </div>
           <h3 className="font-semibold text-slate-800">Horizontal Scaling</h3>
           <p className="text-sm text-slate-600 mt-2">Sharded by `organization_id` to handle millions of records.</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center mb-4">
             <Shield className="w-6 h-6" />
           </div>
           <h3 className="font-semibold text-slate-800">Data Isolation</h3>
           <p className="text-sm text-slate-600 mt-2">Logical separation ensures enterprise-grade security.</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-4">
             <Layers className="w-6 h-6" />
           </div>
           <h3 className="font-semibold text-slate-800">Aggregations</h3>
           <p className="text-sm text-slate-600 mt-2">Pre-computed analytics for instant dashboard loading.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Users Collection */}
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg">
          <div className="bg-slate-800 px-6 py-3 flex items-center justify-between">
            <h3 className="text-white font-mono text-sm font-semibold flex items-center">
              <span className="text-indigo-400 mr-2">collection:</span> users
            </h3>
            <span className="text-xs text-slate-400">Stores authentication and tenant info</span>
          </div>
          <div className="p-6 overflow-x-auto">
            <pre className="text-xs md:text-sm font-mono leading-relaxed text-slate-300">
{`{
  "_id": ObjectId("..."),
  "email": "jane.doe@enterprise.com",
  "password_hash": "bcrypt$2b$12$...",
  "full_name": "Jane Doe",
  "organization_id": ObjectId("..."), // Link to Tenant
  "roles": ["admin", "analyst"],
  "preferences": {
    "notifications": true,
    "theme": "light"
  },
  "created_at": ISODate("2023-10-27T10:00:00Z"),
  "last_login": ISODate("2023-10-28T09:30:00Z")
}`}
            </pre>
          </div>
        </div>

        {/* Analysis Results Collection */}
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg">
          <div className="bg-slate-800 px-6 py-3 flex items-center justify-between">
            <h3 className="text-white font-mono text-sm font-semibold flex items-center">
              <span className="text-emerald-400 mr-2">collection:</span> analyses
            </h3>
            <span className="text-xs text-slate-400">Core sentiment data (High Volume)</span>
          </div>
          <div className="p-6 overflow-x-auto">
            <pre className="text-xs md:text-sm font-mono leading-relaxed text-slate-300">
{`{
  "_id": ObjectId("..."),
  "organization_id": ObjectId("..."), // Shard Key
  "source": "Zendesk", // or 'Salesforce', 'API', 'Manual'
  "external_id": "ticket_88291", // ID in external system
  "text_content": "The service was slow but the agent was nice.",
  "analysis": {
    "sentiment": "Neutral",
    "confidence_score": 0.88,
    "emotions": [
      { "name": "Patience", "score": 0.7 },
      { "name": "Frustration", "score": 0.4 }
    ],
    "keywords": ["slow", "agent", "nice"],
    "summary": "Mixed feedback regarding speed vs interaction."
  },
  "metadata": {
    "customer_tier": "Premium",
    "region": "NA"
  },
  "created_at": ISODate("2023-10-28T14:20:00Z")
}`}
            </pre>
          </div>
        </div>

        {/* Daily Aggregates Collection (New) */}
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg">
          <div className="bg-slate-800 px-6 py-3 flex items-center justify-between">
            <h3 className="text-white font-mono text-sm font-semibold flex items-center">
              <span className="text-purple-400 mr-2">collection:</span> daily_aggregates
            </h3>
            <span className="text-xs text-slate-400">Historical performance data</span>
          </div>
          <div className="p-6 overflow-x-auto">
            <pre className="text-xs md:text-sm font-mono leading-relaxed text-slate-300">
{`{
  "_id": ObjectId("..."),
  "organization_id": ObjectId("..."),
  "date": "2023-10-28",
  "metrics": {
    "total_volume": 1450,
    "sentiment_breakdown": {
      "positive": 800,
      "neutral": 400,
      "negative": 250
    },
    "top_emotions": [
      { "name": "Joy", "count": 600 },
      { "name": "Frustration", "count": 200 }
    ]
  },
  "updated_at": ISODate("2023-10-29T00:00:00Z")
}`}
            </pre>
          </div>
        </div>

        {/* Integrations Collection */}
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg">
          <div className="bg-slate-800 px-6 py-3 flex items-center justify-between">
            <h3 className="text-white font-mono text-sm font-semibold flex items-center">
              <span className="text-amber-400 mr-2">collection:</span> integrations
            </h3>
            <span className="text-xs text-slate-400">Third-party connection configs</span>
          </div>
          <div className="p-6 overflow-x-auto">
            <pre className="text-xs md:text-sm font-mono leading-relaxed text-slate-300">
{`{
  "_id": ObjectId("..."),
  "organization_id": ObjectId("..."),
  "provider": "Salesforce",
  "status": "Active", // or 'Disconnected', 'Error'
  "credentials": {
    "client_id": "encrypted_...",
    "refresh_token": "encrypted_..."
  },
  "settings": {
    "sync_frequency_minutes": 60,
    "import_objects": ["Case", "EmailMessage"]
  },
  "last_sync_at": ISODate("2023-10-28T14:00:00Z"),
  "error_log": []
}`}
            </pre>
          </div>
        </div>

      </div>
      
      <div className="mt-8 bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex items-start">
        <Share2 className="w-5 h-5 text-indigo-600 mt-0.5 mr-3" />
        <div>
          <h4 className="font-semibold text-indigo-900 text-sm">Open Source Contribution</h4>
          <p className="text-sm text-indigo-700 mt-1">
            This schema is optimized for the community edition of MongoDB. 
            Pull requests for PostgreSQL JSONB adaptations are welcome in our repository.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SchemaViewer;