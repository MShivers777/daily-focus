'use client';

export default function ExperienceForm({ experience, onChange, onNext }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          How long have you been working out?
        </label>
        <select
          value={experience}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-700"
        >
          <option value={0}>Just starting out</option>
          <option value={1}>Less than 6 months</option>
          <option value={2}>6-12 months</option>
          <option value={3}>1-2 years</option>
          <option value={4}>2-5 years</option>
          <option value={5}>5+ years</option>
        </select>
      </div>

      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Next
      </button>
    </form>
  );
}
