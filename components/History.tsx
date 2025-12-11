import React from 'react';
import { AnalysisResult, SentimentType } from '../types';
import { Clock, Search } from 'lucide-react';

interface HistoryProps {
  data: AnalysisResult[];
}

const History: React.FC<HistoryProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
        <Clock className="w-16 h-16 mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-slate-600">No History Yet</h3>
        <p>Analyses you perform will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Analysis History</h2>
        <div className="relative">
           <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
           <input 
             type="text" 
             placeholder="Search logs..." 
             className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-64"
           />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Source</th>
              <th className="px-6 py-4 w-1/3">Snippet</th>
              <th className="px-6 py-4">Sentiment</th>
              <th className="px-6 py-4">Key Emotion</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.slice().reverse().map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(item.timestamp).toLocaleDateString()}
                  <span className="text-xs text-slate-400 block">{new Date(item.timestamp).toLocaleTimeString()}</span>
                </td>
                <td className="px-6 py-4">
                   <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600">{item.source}</span>
                </td>
                <td className="px-6 py-4 truncate max-w-xs text-slate-800 font-medium">
                  {item.text.slice(0, 60)}...
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                      ${item.sentiment === SentimentType.POSITIVE ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        item.sentiment === SentimentType.NEGATIVE ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                        'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {item.sentiment}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {item.emotions.length > 0 ? (
                    <div className="flex items-center">
                       {item.emotions[0].name}
                       <span className="ml-2 text-xs text-slate-400">{(item.emotions[0].score * 100).toFixed(0)}%</span>
                    </div>
                  ) : '-'}
                </td>
                <td className="px-6 py-4">
                   <button className="text-indigo-600 hover:text-indigo-800 font-medium text-xs">View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default History;
