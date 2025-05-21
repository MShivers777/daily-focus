'use client';

import React, { useState } from 'react';

export default function WorkoutForm({ onAddWorkout }) {
  const [workoutName, setWorkoutName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!workoutName.trim()) {
      setError('Workout name cannot be empty.');
      return;
    }
    // Call a prop function to add the workout, if provided
    if (onAddWorkout) {
      onAddWorkout({ name: workoutName, date: new Date().toISOString().split('T')[0] });
    }
    setWorkoutName('');
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 border rounded shadow">
      <h3 className="text-lg font-semibold mb-2">Add New Workout</h3>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <div>
        <label htmlFor="workoutName" className="block text-sm font-medium text-gray-700">
          Workout Name
        </label>
        <input
          type="text"
          id="workoutName"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="e.g., Morning Run"
        />
      </div>
      <button
        type="submit"
        className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-green-400"
      >
        Add Workout
      </button>
    </form>
  );
}
