import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { Users, DollarSign, Activity, Trash2, Search, ShieldCheck, Mail, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const allUsers = authService.getUsers();
    setUsers(allUsers);
    setLoading(false);
  };

  const handleDeleteUser = async (email: string) => {
    if (confirm(`Are you sure you want to delete ${email}? This cannot be undone.`)) {
        try {
            await authService.deleteUser(email);
            loadUsers();
        } catch (e: any) {
            alert(e.message);
        }
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistics
  const totalUsers = users.length;
  const verifiedUsers = users.filter(u => u.isVerified).length;
  const totalRevenue = users.reduce((acc, user) => {
      if (user.role === 'admin') return acc;
      if (user.plan === 'Starter') return acc + 3;
      if (user.plan === 'Pro') return acc + 15;
      if (user.plan === 'Enterprise') return acc + 100; // Estimated
      return acc;
  }, 0);

  // Mock Growth Data (Generating based on user count for visual effect)
  const growthData = [
      { name: 'Week 1', users: Math.max(1, Math.floor(totalUsers * 0.2)) },
      { name: 'Week 2', users: Math.max(2, Math.floor(totalUsers * 0.4)) },
      { name: 'Week 3', users: Math.max(3, Math.floor(totalUsers * 0.7)) },
      { name: 'Current', users: totalUsers },
  ];

  const planDistribution = [
      { name: 'Starter', count: users.filter(u => u.plan === 'Starter').length },
      { name: 'Pro', count: users.filter(u => u.plan === 'Pro').length },
      { name: 'Enterprise', count: users.filter(u => u.plan === 'Enterprise').length },
  ];

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Admin Dashboard...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-3xl font-bold text-slate-900">Admin Dashboard</h2>
            <p className="text-slate-500">Advanced system monitoring and user management.</p>
        </div>
        <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center">
            <ShieldCheck className="w-4 h-4 mr-2" /> Administrator Access
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-sm font-medium text-slate-500">Total Users</p>
              <p className="text-3xl font-bold text-slate-800">{totalUsers}</p>
              <p className="text-xs text-emerald-600 flex items-center mt-1"><Activity className="w-3 h-3 mr-1" /> {verifiedUsers} Verified</p>
           </div>
           <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6" />
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-sm font-medium text-slate-500">Monthly Revenue (Est)</p>
              <p className="text-3xl font-bold text-slate-800">${totalRevenue}</p>
              <p className="text-xs text-slate-400 mt-1">Based on active plans</p>
           </div>
           <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-sm font-medium text-slate-500">System Health</p>
              <p className="text-3xl font-bold text-slate-800">99.9%</p>
              <p className="text-xs text-emerald-600 mt-1">Operational</p>
           </div>
           <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6" />
           </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="font-semibold text-slate-800 mb-4">User Growth</h3>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={3} dot={{r:4}} />
                    </LineChart>
                </ResponsiveContainer>
             </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="font-semibold text-slate-800 mb-4">Plan Distribution</h3>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={planDistribution}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10b981" radius={[4,4,0,0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
      </div>

      {/* User Management Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
         <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800">User Management</h3>
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input 
                   type="text" 
                   placeholder="Search users..." 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
         </div>
         <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs">
                    <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Plan</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Joined</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => (
                        <tr key={u.email} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 mr-3">
                                        {u.fullName.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-900">{u.fullName}</div>
                                        <div className="text-xs text-slate-400">{u.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {u.role.toUpperCase()}
                                </span>
                            </td>
                            <td className="px-6 py-4">{u.plan}</td>
                            <td className="px-6 py-4">
                                {u.isVerified ? (
                                    <span className="text-emerald-600 flex items-center text-xs font-medium"><ShieldCheck className="w-3 h-3 mr-1" /> Verified</span>
                                ) : (
                                    <span className="text-amber-500 flex items-center text-xs font-medium"><Mail className="w-3 h-3 mr-1" /> Pending</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-xs">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-right">
                                {u.role !== 'admin' && (
                                    <button 
                                      onClick={() => handleDeleteUser(u.email)}
                                      className="text-slate-400 hover:text-red-600 transition-colors p-1" 
                                      title="Delete User"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No users found.</td>
                        </tr>
                    )}
                </tbody>
             </table>
         </div>
      </div>
    </div>
  );
};

export default AdminPanel;
