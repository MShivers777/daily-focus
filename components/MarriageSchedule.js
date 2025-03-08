'use client';

export default function MarriageSchedule() {
  const generateSchedule = () => {
    const schedule = [];
    const startDate = new Date();
    const focusAreas = [
      'Effective Communication',
      'Emotional Connection',
      'Financial Unity',
      'Quality Time and Activities Together',
      'Physical Intimacy',
      'Shared Values and Goals',
      'Mutual Respect and Support',
      'Effective Communication',
      'Emotional Connection',
      'Shared Responsibilities and Household Management',
      'Connection to Community and Social Support',
      'Physical Intimacy',
      'Adaptability and Flexibility',
      'Forgiveness and Grace'
    ];

    for (let i = 0; i < 14; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      schedule.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        day: date.toLocaleDateString('en-US', { weekday: 'long' }),
        focus: focusAreas[i]
      });
    }

    return schedule;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Two-Week Focus Schedule
      </h2>
      <div className="grid gap-2">
        {generateSchedule().map((item, index) => (
          <div 
            key={index}
            className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="w-24 text-sm font-medium text-gray-500 dark:text-gray-400">
              {item.date}
            </div>
            <div className="w-32 text-sm font-medium text-gray-600 dark:text-gray-300">
              {item.day}
            </div>
            <div className="flex-1 text-sm text-gray-700 dark:text-gray-200">
              {item.focus}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
