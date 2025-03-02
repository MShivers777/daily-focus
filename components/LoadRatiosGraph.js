'use client';
import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import ErrorMessage from './ErrorMessage';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin  // Register the annotation plugin
);

export default function LoadRatiosGraph({ data, visibleLines }) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  try {
    // Prepare data arrays with null checks
    const strengthData = data.map(d => d.strength_ratio ?? 0);
    const cardioData = data.map(d => d.cardio_ratio ?? 0);
    const combinedData = data.map(d => {
      // If combined_ratio exists, use it
      if (d.combined_ratio != null) return d.combined_ratio;
      // Otherwise calculate it from individual ratios
      const strength = d.strength_ratio ?? 0;
      const cardio = d.cardio_ratio ?? 0;
      return (strength + cardio) / 2;
    });

    const chartData = {
      labels: data.map(d => d.workout_date),
      datasets: [
        {
          label: 'Strength',
          data: strengthData,
          borderColor: 'rgb(59, 130, 246)', // blue-500
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          hidden: !visibleLines.strength,
          borderWidth: 1.5,  // thinner line
          pointRadius: 0,    // remove points
          tension: 0.3,      // slight curve for smoother lines
          borderOpacity: visibleLines.strength ? 1 : 0.25,
        },
        {
          label: 'Cardio',
          data: cardioData,
          borderColor: 'rgb(234, 88, 12)', // orange-500
          backgroundColor: 'rgba(234, 88, 12, 0.1)',
          hidden: !visibleLines.cardio,
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.3,
          borderOpacity: visibleLines.cardio ? 1 : 0.25,
        },
        {
          label: 'Combined',
          data: combinedData,
          borderColor: 'rgb(16, 185, 129)', // green-500
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          hidden: !visibleLines.combined,
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.3,
          borderOpacity: visibleLines.combined ? 1 : 0.25,
        }
      ]
    };

    const options = {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(156, 163, 175, 0.1)' // gray-400 with opacity
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          intersect: false,
          mode: 'index'
        },
        annotation: {
          annotations: {
            idealRange: {
              type: 'box',
              yMin: 0.8,
              yMax: 1.4,
              backgroundColor: 'rgba(34, 197, 94, 0.1)', // green-500 with low opacity
              borderColor: 'transparent',
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    };

    return (
      <div className="w-full h-48">
        <Line data={chartData} options={options} />
      </div>
    );
  } catch (error) {
    console.error('Chart error:', error);
    return <ErrorMessage message="Failed to load chart" />;
  }
}
