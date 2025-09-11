import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import SchedulePanel from '../components/admin/SchedulePanel'; // Import the new component

export default function StaffPage({ profile }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Invite form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('cleaner');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  const fetchStaff = useCallback(async () => {
    if (!profile?.company_id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setStaff(data ?? []);
    } catch (err) {
      setError(err.message || 'Failed to load staff.');
    } finally {
      setLoading(false);
    }
  }, [profile?.company_id]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Extract readable message from Functions error
  function extractFnError(err) {
    if (!err) return 'Unknown error';
    const ctx = err.context;
    if (ctx) {
      if (typeof ctx === 'string') return ctx;
      if (typeof ctx === 'object') {
        if (ctx.error) return ctx.error;
        if (ctx.message) return ctx.message;
        try { return JSON.stringify(ctx); } catch {}
      }
    }
    return err.message || 'Unexpected error';
  }

  const handleInviteUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormMessage({ type: '', text: '' });

    try {
      const { data, error } = await supabase.functions.invoke('invite-staff', {
        body: { email, fullName, role }, // companyId handled server-side
      });

      if (error) throw new Error(extractFnError(error));

      const already = data?.user?.alreadyExists;
      setFormMessage({
        type: 'success',
        text: already
          ? 'That user already exists in your company.'
          : `Invitation sent to ${email}.`,
      });

      setFullName('');
      setEmail('');
      setRole('cleaner');

      await fetchStaff(); // profile is created by the function on success
    } catch (err) {
      setFormMessage({ type: 'error', text: err.message || 'Failed to send invite.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editingUser.full_name, role: editingUser.role })
        .eq('id', editingUser.id);

      if (error) throw error;
      await fetchStaff();
      // Keep the modal open so the user can manage the schedule
    } catch (err) {
      setError(err.message || 'Update failed.');
    }
  };
  
  const handleToggleActive = async (user) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) throw error;
      await fetchStaff();
    } catch (err) {
      setError(err.message || 'Could not change status.');
    }
  };

  if (loading) return <p>Loading staff...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Staff Members</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{member.full_name}</td>
                    <td className="py-3 px-4 capitalize">{member.role}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          member.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {member.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 space-x-2">
                      <button
                        onClick={() => {
                          setEditingUser(member);
                          setIsEditModalOpen(true);
                        }}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(member)}
                        className={`text-sm ${
                          member.is_active ? 'text-red-600' : 'text-green-600'
                        } hover:underline`}
                      >
                        {member.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
                {staff.length === 0 && (
                  <tr>
                    <td className="py-4 px-4 text-sm text-gray-500" colSpan={4}>
                      No staff yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Invite New Staff</h3>
          <form onSubmit={handleInviteUser} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
              >
                <option value="cleaner">Cleaner</option>
                <option value="supervisor">Supervisor</option>
                <option value="manager">Manager</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}
            </button>
            {formMessage.text && (
              <p
                className={`text-sm text-center ${
                  formMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formMessage.text}
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Edit Staff Member</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={editingUser.full_name}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  required
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
                >
                  <option value="cleaner">Cleaner</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="manager">Manager</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
              </div>
            </form>
            
            {/* --- NEW: Schedule Panel --- */}
            <SchedulePanel user={editingUser} />
            
            <div className="flex justify-end space-x-2 pt-6 mt-6 border-t">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

