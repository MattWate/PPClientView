// src/pages/Staff.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient.js';

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

  // Helper: extract a readable message from Functions error
  function extractFnError(err) {
    if (!err) return 'Unknown error';
    // supabase-js v2 FunctionsError has { message, context }
    const ctx = err.context;
    if (ctx) {
      if (typeof ctx === 'string') return ctx;
      if (typeof ctx === 'object') {
        // our edge function returns { error, code, stage, ... }
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

      if (error) {
        throw new Error(extractFnError(error));
      }

      const already = data?.user?.alreadyExists;
      const who = email;
      setFormMessage({
        type: 'success',
        text: already
          ? `That user already exists in your company.`
          : `Invitation sent to ${who}.`,
      });

      // Reset form
      setFullName('');
      setEmail('');
      setRole('cleaner');

      // Refresh list (profile is created by the function on success)
      await fetchStaff();
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
      setIsEditModalOpen(false);
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
      {isEditModalOpen && editin
