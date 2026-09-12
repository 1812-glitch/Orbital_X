import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Shield, UserX, UserCheck, ShieldAlert, Key } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const data = await adminService.getUsers();
      setUsers(data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleStatusToggle = async (userId, isActive) => {
    try {
      await adminService.toggleUserStatus(userId, !isActive);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  if (loading) return <div className="p-8 text-[#00F0FF] font-mono text-center">LOADING USERS...</div>;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-widest text-[#FF2A2A] uppercase mb-2 flex items-center">
            <Shield className="mr-3" size={28} />
            User Management
          </h1>
          <p className="text-gray-400 font-mono text-sm">Access Control and Role Assignments</p>
        </div>
      </div>

      <div className="bg-[#0B1221] border border-[#FF2A2A]/30 rounded-lg overflow-hidden shadow-[0_0_15px_rgba(255,42,42,0.1)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#121C36] border-b border-[#FF2A2A]/20">
              <th className="p-4 text-gray-400 font-mono text-xs uppercase tracking-wider">Operator Name</th>
              <th className="p-4 text-gray-400 font-mono text-xs uppercase tracking-wider">Clearance (Role)</th>
              <th className="p-4 text-gray-400 font-mono text-xs uppercase tracking-wider">Status</th>
              <th className="p-4 text-gray-400 font-mono text-xs uppercase tracking-wider">Last Login</th>
              <th className="p-4 text-gray-400 font-mono text-xs uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {users.map(user => (
              <tr key={user._id} className="hover:bg-[#FF2A2A]/5 transition-colors">
                <td className="p-4">
                  <div className="text-white font-bold">{user.name}</div>
                  <div className="text-gray-500 font-mono text-xs">{user.email}</div>
                </td>
                <td className="p-4">
                  <select 
                    value={user.role}
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    className="bg-[#050810] border border-gray-700 text-[#00F0FF] text-xs rounded font-mono p-1 outline-none focus:border-[#FF2A2A]"
                  >
                    <option value="VIEWER">VIEWER</option>
                    <option value="OPERATOR">OPERATOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
                <td className="p-4">
                  {user.isActive ? (
                    <span className="bg-green-500/10 text-green-500 font-mono text-xs px-2 py-1 rounded border border-green-500/30">ACTIVE</span>
                  ) : (
                    <span className="bg-red-500/10 text-red-500 font-mono text-xs px-2 py-1 rounded border border-red-500/30">SUSPENDED</span>
                  )}
                </td>
                <td className="p-4 text-gray-400 font-mono text-xs">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'NEVER'}
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleStatusToggle(user._id, user.isActive)}
                    className={`p-2 rounded transition-colors ${
                      user.isActive 
                        ? 'text-red-500 hover:bg-red-500/10' 
                        : 'text-green-500 hover:bg-green-500/10'
                    }`}
                    title={user.isActive ? "Suspend User" : "Activate User"}
                  >
                    {user.isActive ? <UserX size={18} /> : <UserCheck size={18} />}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500 font-mono">No personnel records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
