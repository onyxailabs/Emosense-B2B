import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter, ZAxis, ReferenceLine } from 'recharts';
import { AnalysisResult, SentimentType } from '../types';
import { TrendingUp, Users, AlertCircle, Smile } from 'lucide-react';

interface DashboardProps {
  data: AnalysisResult[];
}

const COLORS = {
  [SentimentType.POSITIVE]: '#10B981', // Emerald 500
  [SentimentType.NEUTRAL]: '#F59E0B',  // Amber 500
  [SentimentType.NEGATIVE]: '#EF4444', // Red 500
};

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  // Aggregate Sentiment Data
  const sentimentData = [
    { name: 'Positive', value: data.filter(d => d.sentiment === SentimentType.POSITIVE).length },
    { name: 'Neutral', value: data.filter(d => d.sentiment === SentimentType.NEUTRAL).length },
    { name: 'Negative', value: data.filter(d => d.sentiment === SentimentType.NEGATIVE).length },
  ].filter(d => d.value > 0);

  // Aggregate Top Emotions
  const emotionCounts: Record<string, number> = {};
  data.forEach(d => {
    d.emotions.forEach(e => {
      emotionCounts[e.name] = (emotionCounts[e.name] || 0) + 1;
    });
  });

  const emotionData = Object.entries(emotionCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Prepare PCA Data
  const pcaData = data
    .filter(d => d.pcaPoint)
    .map(d => ({ x: d.pcaPoint.x, y: d.pcaPoint.y, z: 1, type: d.sentiment }));

  const totalAnalyzed = data.length;
  const positivePercentage = totalAnalyzed > 0 
    ? Math.round((data.filter(d => d.sentiment === SentimentType.POSITIVE).length / totalAnalyzed) * 100) 
    : 0;
  
  const negativeCount = data.filter(d => d.sentiment === SentimentType.NEGATIVE).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Overview</h2>
          <p className="text-slate-500">Real-time sentiment insights across all channels.</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-md text-sm text-slate-600 shadow-sm">
                Last 30 Days
            </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Analyzed</p>
            <p className="text-2xl font-bold text-slate-900">{totalAnalyzed}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Customer Satisfaction</p>
            <p className="text-2xl font-bold text-slate-900">{positivePercentage}%</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Smile className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Critical Issues</p>
            <p className="text-2xl font-bold text-slate-900">{negativeCount}</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Trend</p>
            <p className="text-2xl font-bold text-slate-900 flex items-center text-emerald-600">
              +12.5% <TrendingUp className="w-4 h-4 ml-1" />
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Sentiment Distribution</h3>
          <div className="h-64">
            {totalAnalyzed > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as SentimentType]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
               <div className="flex items-center justify-center h-full text-slate-400">No data available</div>
            )}
          </div>
        </div>

        {/* Emotion Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Top Detected Emotions</h3>
          <div className="h-64">
             {totalAnalyzed > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emotionData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
             ) : (
                <div className="flex items-center justify-center h-full text-slate-400">No data available</div>
             )}
          </div>
        </div>
        
        {/* PCA Map */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-semibold text-slate-800">Aggregate Emotion Map (PCA)</h3>
             <span className="text-xs text-slate-400">Russell's Circumplex Model (Valence vs Arousal)</span>
           </div>
           <div className="h-80 w-full relative">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                 <div className="w-full h-full border border-slate-100 rounded-lg flex items-center justify-center">
                    <div className="text-[10px] text-slate-400 font-bold grid grid-cols-2 gap-x-80 gap-y-64">
                       <span>UNPLEASANT</span><span>PLEASANT</span>
                       <span>SLEEPY</span><span>ACTIVATED</span>
                    </div>
                 </div>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="x" name="Valence" domain={[-1, 1]} tickCount={5} />
                  <YAxis type="number" dataKey="y" name="Arousal" domain={[-1, 1]} tickCount={5} />
                  <ZAxis type="number" dataKey="z" range={[60, 400]} />
                  <ReferenceLine y={0} stroke="#94a3b8" />
                  <ReferenceLine x={0} stroke="#94a3b8" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Sentiment" data={pcaData} fill="#8884d8">
                    {pcaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.type as SentimentType]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Recent Activity Table Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
           <h3 className="text-lg font-semibold text-slate-800">Recent Analysis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Source</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Summary</th>
                <th className="px-6 py-3">Sentiment</th>
                <th className="px-6 py-3">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.slice(0, 5).map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium">{item.source}</td>
                  <td className="px-6 py-4">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs">{item.personalityType || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4 truncate max-w-xs">{item.summary}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${item.sentiment === SentimentType.POSITIVE ? 'bg-emerald-100 text-emerald-800' : 
                        item.sentiment === SentimentType.NEGATIVE ? 'bg-rose-100 text-rose-800' : 
                        'bg-amber-100 text-amber-800'}`}>
                      {item.sentiment}
                    </span>
                  </td>
                  <td className="px-6 py-4">{(item.confidence * 100).toFixed(0)}%</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No analyses yet. Start by analyzing some text!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
