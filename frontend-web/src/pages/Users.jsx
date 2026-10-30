import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';

const Users = () => {
  const { token } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all users on load
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(response.data.users);
      } catch (_error) {
        console.error('Fetch users error:', _error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [token]);

  // Approve a pending user
  const handleApprove = async (userId, userEmail) => {
    try {
      await axios.patch(`/api/users/${userId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`${userEmail} has been approved!`);
      // Update local state instantly
      setUsers(users.map(u => u.id === userId ? { ...u, isApproved: true } : u));
    // eslint-disable-next-line no-unused-vars
    } catch (_error) {
      toast.error('Failed to approve user');
    }
  };

  // Promote user to Manager
  const handlePromote = async (userId, userEmail) => {
    try {
      await axios.patch(`/api/users/${userId}/role`, { role: 'MANAGER' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`${userEmail} is now a Manager!`);
      // Update local state instantly
      setUsers(users.map(u => u.id === userId ? { ...u, role: 'MANAGER' } : u));
    // eslint-disable-next-line no-unused-vars
    } catch (_error) {
      toast.error('Failed to update role');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Total Users: {users.length}
        </span>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
          <p className="text-gray-500 text-lg">No users registered yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.isApproved ? (
                        <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm text-yellow-600 font-medium">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {!user.isApproved && user.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleApprove(user.id, user.email)}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                        >
                          Approve
                        </button>
                      )}
                      
                      {user.role === 'USER' && user.isApproved && (
                        <button
                          onClick={() => handlePromote(user.id, user.email)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                        >
                          Make Manager
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;