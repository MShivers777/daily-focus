'use client';

import { useState, useEffect } from 'react';
import supabase from '../api/supabase';
import toast from 'react-hot-toast';

const WORKOUT_TYPES = [
  { id: 'intervals', title: 'Intervals', description: 'High-intensity intervals with recovery periods' },
  { id: 'tempo', title: 'Tempo', description: 'Sustained effort at threshold pace' },
  { id: 'steady_state', title: 'Steady State', description: 'Moderate intensity continuous effort' },
  { id: 'zone2', title: 'Zone 2', description: 'Easy aerobic training' },
  { id: 'sprints', title: 'Sprints', description: 'Maximum effort short intervals' },
  { id: 'hill_sprints', title: 'Hill Sprints', description: 'High-intensity uphill efforts' }
];

export default function CardioZones() {
  const [zones, setZones] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editedZones, setEditedZones] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('cardio_zones')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setZones(data.zones || {});
        setEditedZones(data.zones || {});
      }
    } catch (error) {
      console.error('Error loading zones:', error);
      toast.error('Failed to load training zones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('cardio_zones')
        .upsert({
          user_id: session.user.id,
          zones: editedZones,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setZones(editedZones);
      setIsEditing(false);
      toast.success('Training zones saved');
    } catch (error) {
      console.error('Error saving zones:', error);
      toast.error('Failed to save training zones');
    }
  };

  const handleEdit = (type, field, value) => {
    setEditedZones(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  if (isLoading) {
    return <div className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Training Zones
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {WORKOUT_TYPES.map((zone, index) => (
          <div
            key={zone.id}
            className="p-4 bg-gray-900 text-white rounded-lg shadow-md"
          >
            <h3 className="text-lg font-semibold mb-2">{zone.title}</h3>
            <p className="text-sm text-gray-400">{zone.description}</p>
            <div className="mt-4 space-y-2">
              <input
                type="text"
                placeholder="Pace Range"
                value={editedZones[zone.id]?.pace || ''}
                onChange={(e) => handleEdit(zone.id, 'pace', e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300"
              />
              <input
                type="text"
                placeholder="Heart Rate Zone"
                value={editedZones[zone.id]?.heartRate || ''}
                onChange={(e) => handleEdit(zone.id, 'heartRate', e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300"
              />
              <input
                type="text"
                placeholder="Typical Duration"
                value={editedZones[zone.id]?.duration || ''}
                onChange={(e) => handleEdit(zone.id, 'duration', e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button 
          onClick={() => {
            if (isEditing) {
              handleSave();
            } else {
              setIsEditing(true);
            }
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          {isEditing ? 'Save Changes' : 'Edit Zones'}
        </button>
      </div>
    </div>
  );
}
