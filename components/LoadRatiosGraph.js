'use client';

import { useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import zoom from 'chartjs-plugin-zoom';
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
  annotationPlugin,
  zoom
);

export default function LoadRatiosGraph({ data, visibleLines, className = '', expanded = false }) {
  const chartRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1);

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
      // For expanded view, reverse the labels and datasets
      labels: expanded ? [...data].reverse().map(d => d.workout_date) : data.map(d => d.workout_date),
      datasets: [
        {
          label: 'Strength',
          data: expanded ? [...strengthData].reverse() : strengthData,
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
          data: expanded ? [...cardioData].reverse() : cardioData,
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
          data: expanded ? [...combinedData].reverse() : combinedData,
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

    const getChartOptions = (isExpanded) => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(156, 163, 175, 0.1)' // gray-400 with opacity
          },
          title: {
            display: isExpanded, // Only show in expanded view
            text: 'Load Ratio (Acute:Chronic)',
            color: 'rgb(107, 114, 128)', // text-gray-500
            font: {
              size: isExpanded ? 18 : 12  // 50% bigger in expanded view
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45
          },
          title: {
            display: isExpanded, // Only show in expanded view
            text: 'Date',
            color: 'rgb(107, 114, 128)', // text-gray-500
            font: {
              size: isExpanded ? 18 : 12  // 50% bigger in expanded view
            }
          }
        }
      },
      plugins: {
        legend: {
          display: isExpanded, // Only show in expanded view
          position: 'bottom', // Changed from 'top' to 'bottom'
          align: 'center',
          labels: {
            usePointStyle: true,
            boxWidth: 6,
            boxHeight: 6,
            padding: 20,
            color: 'rgb(107, 114, 128)' // text-gray-500
          }
        },
        title: {
          display: isExpanded, // Only show in expanded view
          text: 'Training Load Ratios',
          color: 'rgb(31, 41, 55)', // text-gray-800
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
                display: isExpanded, // Only show label in expanded view
                content: 'Ideal Range',
                position: 'start',
                color: 'rgb(107, 114, 128)',
                font: {
                  size: 11
                }
              }
            }
          }
        },
        zoom: isExpanded ? {
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
              enabled: true,
              backgroundColor: 'rgba(99,102,241,0.2)'
            }
          },
          pan: {
            enabled: true,
            mode: 'x',
            modifierKey: null
          },
          limits: {
            y: {
              min: 0,
              max: 3
            }
          }
        } : undefined
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    });

    return (
      <div 
        className={`relative ${expanded ? 'h-[70vh]' : 'h-48'} ${className}`}
      >
        <Line 
          ref={chartRef}
          data={chartData} 
          options={getChartOptions(expanded)} 
        />
        {expanded && (
          <div className="absolute bottom-0 right-0 p-4 flex gap-2">
            <button
              onClick={() => {
                if (chartRef.current) {
                  chartRef.current.resetZoom();
                }
              }}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Reset View
            </button>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Chart error:', error);
    return <ErrorMessage message="Failed to load chart" />;
  }
}
