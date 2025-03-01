'use client';
import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
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
  const chartData = {
    // Show only last 14 days of data
    labels: data.slice(0, 14).map(d => d.workout_date),
    datasets: [
      {
        label: 'Strength',
        data: data.slice(0, 14).map(d => d.strength_ratio),
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
        data: data.slice(0, 14).map(d => d.cardio_ratio),
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
        data: data.slice(0, 14).map(d => d.combined_ratio),
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
}
