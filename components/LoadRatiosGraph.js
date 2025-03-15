'use client';

import { useState, useRef, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import ErrorMessage from './ErrorMessage';

let ChartJS;
let zoom;
let annotationPlugin;

export default function LoadRatiosGraph({ data, visibleLines, className = '', expanded = false }) {
  const chartRef = useRef(null);
  const [isClient, setIsClient] = useState(false);

  const getChartData = () => {
    // Sort data by date and reverse it so newest is on the right
    const sortedData = [...data].sort((a, b) => 
      new Date(a.workout_date) - new Date(b.workout_date)
    );

    const strengthData = sortedData.map(d => d.strength_ratio ?? 0);
    const cardioData = sortedData.map(d => d.cardio_ratio ?? 0);
    const combinedData = sortedData.map(d => {
      if (d.combined_ratio != null) return d.combined_ratio;
      const strength = d.strength_ratio ?? 0;
      const cardio = d.cardio_ratio ?? 0;
      return (strength + cardio) / 2;
    });

    return {
      labels: sortedData.map(d => d.workout_date),
      datasets: [
        {
          label: 'Strength',
          data: strengthData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          hidden: !visibleLines.strength,
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.3,
        },
        {
          label: 'Cardio',
          data: cardioData,
          borderColor: 'rgb(234, 88, 12)',
          backgroundColor: 'rgba(234, 88, 12, 0.1)',
          hidden: !visibleLines.cardio,
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.3,
        },
        {
          label: 'Combined',
          data: combinedData,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          hidden: !visibleLines.combined,
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.3,
        }
      ]
    };
  };

  const getChartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.1)'
        },
        title: {
          display: expanded,
          text: 'Load Ratio (Acute:Chronic)',
          color: 'rgb(107, 114, 128)',
          font: { size: expanded ? 18 : 12 }
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        },
        title: {
          display: expanded,
          text: 'Date',
          color: 'rgb(107, 114, 128)',
          font: { size: expanded ? 18 : 12 }
        }
      }
    },
    plugins: {
      legend: {
        display: expanded,
        position: 'bottom',
        align: 'center',
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          boxHeight: 6,
          padding: 20,
          color: 'rgb(107, 114, 128)'
        }
      },
      title: {
        display: expanded,
        text: 'Training Load Ratios',
        color: 'rgb(31, 41, 55)',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: { bottom: 20 }
      },
      tooltip: {
        intersect: false,
        mode: 'index',
        callbacks: {
          label: function(context) {
            const label = context.dataset.label;
            const value = context.parsed.y.toFixed(2);
            return `${label}: ${value}`;
          }
        }
      },
      annotation: {
        annotations: {
          idealRange: {
            type: 'box',
            yMin: 0.8,
            yMax: 1.4,
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderColor: 'transparent',
            label: {
              display: expanded,
              content: 'Ideal Range',
              position: 'start',
              color: 'rgb(107, 114, 128)',
              font: { size: 11 }
            }
          }
        }
      },
      zoom: expanded ? {
        zoom: {
          wheel: { 
            enabled: true, 
            modifierKey: 'ctrl' 
          },
          pinch: { 
            enabled: true 
          },
          mode: 'x',
          drag: {
            enabled: false  // Disable drag-to-zoom
          }
        },
        pan: {
          enabled: true,
          mode: 'x',
          modifierKey: null,  // Allow panning without modifier key
          drag: {
            enabled: true  // Enable drag-to-pan
          }
        }
      } : undefined
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  });

  useEffect(() => {
    async function initChart() {
      const { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } 
        = await import('chart.js');
      const zoomPlugin = (await import('chartjs-plugin-zoom')).default;
      const annotation = (await import('chartjs-plugin-annotation')).default;

      Chart.register(
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend,
        annotation,
        zoomPlugin
      );

      ChartJS = Chart;
      zoom = zoomPlugin;
      annotationPlugin = annotation;
      setIsClient(true);
    }

    initChart();
  }, []);

  if (!isClient) {
    return <div className="animate-pulse w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />;
  }

  return (
    <div className={`relative ${expanded ? 'h-[70vh]' : 'h-48'} ${className}`}>
      <Line 
        ref={chartRef}
        data={getChartData()} 
        options={getChartOptions()} 
      />
      {expanded && (
        <div className="absolute bottom-4 right-4">
          <button
            onClick={() => chartRef.current?.resetZoom()}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Reset View
          </button>
        </div>
      )}
    </div>
  );
}
