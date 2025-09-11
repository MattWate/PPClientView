import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient.js';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SchedulePanel({ user }) {
  const [schedule, setSchedule] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchSchedule = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      const { data, error } = await supabase
        .from('staff_schedules')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const scheduleMap = new Map();
      DAYS_OF_WEEK.forEach((_, index) => {
        const daySchedule = data.find(d => d.day_of_week === index);
        scheduleMap.set(index, {
          start_time: daySchedule?.start_time || '09:00',
          end_time: daySchedule?.end_time || '17:00',
          is_active: daySchedule ? daySchedule.is_active : false,
        });
      });
      setSchedule(scheduleMap);

    } catch (err) {
      setError('Failed to load schedule.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const handleScheduleChange = (dayIndex, field, value) => {
    const newSchedule = new Map(schedule);
    const dayData = newSchedule.get(dayIndex);
    dayData[field] = value;
    newSchedule.set(dayIndex, dayData);
    setSchedule(newSchedule);
  };

  const handleSaveSchedule = async () => {
    try {
        setLoading(true);
        setError('');
        setSuccessMessage('');

        const upsertPromises = Array.from(schedule.entries()).map(([dayIndex, dayData]) => {
            return supabase.from('staff_schedules').upsert({
                user_id: user.id,
                day_of_week: dayIndex,
                start_time: dayData.is_active ? dayData.start_time : null,
                end_time: dayData.is_active ? dayData.end_time : null,
                is_active: dayData.is_active,
            }, { onConflict: 'user_id,day_of_week' });
        });

        const results = await Promise.all(upsertPromises);
        const firstError = results.find(res => res.error);
        if (firstError) throw firstError.error;

        setSuccessMessage('Schedule saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000); // Clear message after 3 seconds

    } catch(err) {
        setError('Failed to save schedule.');
    } finally {
        setLoading(false);
    }
  };

  if (loading && !schedule.size) return <p>Loading schedule...</p>;
  if (error) return <p className="text-red-500">{error}</p>

  return (
    <div className="border-t pt-4">
      <h4 className="text-lg font-semibold text-gray-800 mb-4">Weekly Schedule</h4>
      {/* --- FIX: Made this container scrollable --- */}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
        {DAYS_OF_WEEK.map((day, index) => {
          const daySchedule = schedule.get(index);
          if (!daySchedule) return null;

          return (
            <div key={index} className="grid grid-cols-4 items-center gap-4 p-2 rounded-md bg-gray-50">
              <div className="col-span-1">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={daySchedule.is_active}
                    onChange={(e) => handleScheduleChange(index, 'is_active', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-700">{day}</span>
                </label>
              </div>
              <div className="col-span-1">
                <label className="text-sm text-gray-600">Start</label>
                <input
                  type="time"
                  value={daySchedule.start_time || ''}
                  onChange={(e) => handleScheduleChange(index, 'start_time', e.target.value)}
                  disabled={!daySchedule.is_active}
                  className="w-full mt-1 px-2 py-1 border border-gray-300 rounded-md shadow-sm disabled:opacity-50"
                />
              </div>
              <div className="col-span-1">
                <label className="text-sm text-gray-600">End</label>
                <input
                  type="time"
                  value={daySchedule.end_time || ''}
                  onChange={(e) => handleScheduleChange(index, 'end_time', e.target.value)}
                  disabled={!daySchedule.is_active}
                  className="w-full mt-1 px-2 py-1 border border-gray-300 rounded-md shadow-sm disabled:opacity-50"
                />
              </div>
            </div>
          );
        })}
      </div>
      {/* --- FIX: Added success message feedback --- */}
       <div className="mt-4 flex justify-end items-center gap-4">
            {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
            <button
                onClick={handleSaveSchedule}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
                {loading ? 'Saving...' : 'Save Schedule'}
            </button>
        </div>
    </div>
  );
}

