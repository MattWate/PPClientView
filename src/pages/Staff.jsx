// src/pages/Staff.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export default function StaffPage({ profile }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state for inviting new staff
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('cleaner');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchStaff = async () => {
      if (!profile) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('company_id', profile.company_id);

        if (error) throw error;
        setStaff(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [profile]);

  const handleInviteUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormMessage({ type: '', text: '' });
    try {
      // We need an Edge Function to invite a user and create their profile securely.
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email,
          fullName,
          role,
          companyId: profile.company_id,
        },
      });

      if (error) throw error;
      
      setFormMessage({ type: 'success', text: `Invitation sent to ${email}.` });
      // Optionally, refresh the staff list or add the new user optimistically
      setFullName('');
      setEmail('');
      setRole('cleaner');
    } catch (error) {
      setFormMessage({ type: 'error', text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <p>Loading staff...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Staff Members</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(member => (
                <tr key={member.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{member.full_name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{/* Email is sensitive, not stored in profiles */}</td>
                  <td className="py-3 px-4 capitalize"><span className="bg-gray-200 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{member.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Invite New Staff</h3>
        <form onSubmit={handleInviteUser} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm">
              <option value="cleaner">Cleaner</option>
              <option value="supervisor">Supervisor</option>
            </select>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full py-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
            {isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}
          </button>
          {formMessage.text && (
            <p className={`text-sm text-center ${formMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {formMessage.text}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
