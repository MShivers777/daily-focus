'use client';

import { useState, useEffect } from 'react';
import supabase from '../api/supabase';
import toast from 'react-hot-toast';

const WORKOUT_TYPES = {
  intervals: { 
    name: 'Intervals', 
    description: 'High-intensity intervals with recovery periods' 
  },
  tempo: { 
    name: 'Tempo', 
    description: 'Sustained effort at threshold pace' 
  },
  steady_state: { 
    name: 'Steady State', 
    description: 'Moderate intensity continuous effort' 
  },
  zone2: { 
    name: 'Zone 2', 
    description: 'Easy aerobic training' 
  },
  sprints: { 
    name: 'Sprints', 
    description: 'Maximum effort short intervals' 
  },
  hill_sprints: { 
    name: 'Hill Sprints', 
    description: 'High-intensity uphill efforts' 
  }
};

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Training Zones
        </h2>
        <button
          onClick={() => {
            if (isEditing) {
              handleSave();
            } else {
              setIsEditing(true);
            }
          }}
          className={`px-4 py-2 rounded-lg transition-all ${
            isEditing 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {isEditing ? 'Save Changes' : 'Edit Zones'}
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {Object.entries(WORKOUT_TYPES).map(([type, { name, description }]) => (
          <div 
            key={type}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
              {name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {description}
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pace Range
                </label>
                <input
                  type="text"
                  value={editedZones[type]?.pace || ''}
                  onChange={(e) => handleEdit(type, 'pace', e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g., 8:00-9:00 min/mile"
                  className="w-full mt-1 p-2 rounded border disabled:bg-gray-100 dark:disabled:bg-gray-700"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Heart Rate Zone
                </label>
                <input
                  type="text"
                  value={editedZones[type]?.heartRate || ''}
                  onChange={(e) => handleEdit(type, 'heartRate', e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g., 150-160 bpm"
                  className="w-full mt-1 p-2 rounded border disabled:bg-gray-100 dark:disabled:bg-gray-700"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Typical Duration
                </label>
                <input
                  type="text"
                  value={editedZones[type]?.duration || ''}
                  onChange={(e) => handleEdit(type, 'duration', e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g., 30-45 minutes"
                  className="w-full mt-1 p-2 rounded border disabled:bg-gray-100 dark:disabled:bg-gray-700"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
