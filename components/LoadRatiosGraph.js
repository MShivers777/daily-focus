'use client';

import React, { useState, useEffect } from 'react'; // Import React
import { parseISO, format, subDays, subMonths } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from 'recharts';

const TIME_SCALES = [
  { key: '14d', label: '14 Days' },
  { key: '1m', label: '1 Month' },
  { key: '3m', label: '3 Months' },
  { key: 'all', label: 'All Time' },
];

const LoadRatiosGraph = ({ data, visibleLines, className = '', expanded = false }) => {
  // VERY TOP LEVEL LOG
  console.log(`[LoadRatiosGraph] Component called. Expanded: ${expanded}`);

  const [activeTimeScale, setActiveTimeScale] = useState(expanded ? 'all' : '14d');

  useEffect(() => {
    setActiveTimeScale(expanded ? 'all' : '14d');
  }, [expanded]);

  if (expanded) {
    console.log('[LoadRatiosGraph Expanded] Received data prop (length):', data?.length);
    console.log('[LoadRatiosGraph Expanded] visibleLines prop:', JSON.parse(JSON.stringify(visibleLines)));
  }

  const baseProcessedData = data
    .map(item => {
      const timestamp = item.workout_date ? parseISO(item.workout_date).getTime() : NaN;
      return {
        ...item,
        timestamp,
        strength_ratio: Number(item.strength_ratio) || 0,
        cardio_ratio: Number(item.cardio_ratio) || 0,
        combined_ratio: Number(item.combined_ratio) || 0,
      };
    })
    .filter(item => !isNaN(item.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);

  if (expanded) {
    console.log('[LoadRatiosGraph Expanded] baseProcessedData (length):', baseProcessedData?.length);
    console.log('[LoadRatiosGraph Expanded] activeTimeScale:', activeTimeScale);
  }

  const getFilteredData = () => {
    if (!baseProcessedData || baseProcessedData.length === 0) {
      if (expanded) console.log('[LoadRatiosGraph Expanded] getFilteredData: baseProcessedData is empty, returning [].');
      return [];
    }
    if (activeTimeScale === 'all') {
      if (expanded) console.log('[LoadRatiosGraph Expanded] getFilteredData: activeTimeScale is "all", returning baseProcessedData.');
      return baseProcessedData;
    }

    const lastEntry = baseProcessedData[baseProcessedData.length - 1];
    if (!lastEntry || lastEntry.timestamp == null) {
        console.warn("[LoadRatiosGraph Expanded] getFilteredData: Cannot determine last date for filtering. Showing all data.");
        return baseProcessedData;
    }
    const lastDate = new Date(lastEntry.timestamp);
    let startDate;

    switch (activeTimeScale) {
      case '14d':
        startDate = subDays(lastDate, 13);
        break;
      case '1m':
        startDate = subMonths(lastDate, 1);
        break;
      case '3m':
        startDate = subMonths(lastDate, 3);
        break;
      default:
        if (expanded) console.log('[LoadRatiosGraph Expanded] getFilteredData: Default case, returning baseProcessedData.');
        return baseProcessedData;
    }
    const startTime = startDate.getTime();
    const filtered = baseProcessedData.filter(item => item.timestamp >= startTime);
    if (expanded) {
      console.log(`[LoadRatiosGraph Expanded] getFilteredData: Filtered data for ${activeTimeScale} (startTime: ${new Date(startTime).toISOString()}):`, JSON.parse(JSON.stringify(filtered)));
    }
    return filtered;
  };

  const processedData = getFilteredData();

  if (expanded) {
    console.log('[LoadRatiosGraph Expanded] Final processedData for chart (length):', processedData.length);
    if (processedData.length > 0) {
        console.log('[LoadRatiosGraph Expanded] Final processedData for chart (first item):', JSON.parse(JSON.stringify(processedData[0])));
        if (processedData.length < 5) {
            console.log('[LoadRatiosGraph Expanded] Final processedData (all items):', JSON.parse(JSON.stringify(processedData)));
        } else {
            console.log('[LoadRatiosGraph Expanded] Final processedData (last item):', JSON.parse(JSON.stringify(processedData[processedData.length -1 ])));
        }
    }
  }

  const dateFormatter = (tickItem) => {
    return format(new Date(tickItem), 'MMM d');
  };

  const tooltipLabelFormatter = (label) => {
    return format(new Date(label), 'MMM d, yyyy');
  };

  const gridStrokeColor = "rgba(128, 128, 128, 0.2)";
  const idealRangeFillColor = "rgba(74, 222, 128, 0.1)";
  const debugAxisColor = expanded ? "#FFFF00" : "#9ca3af";

  let xAxisDomain;
  if (processedData.length > 0) {
    xAxisDomain = ['dataMin', 'dataMax'];
  } else {
    const now = Date.now();
    xAxisDomain = [subDays(now, 7).getTime(), now];
  }
  if (expanded) {
    console.log('[LoadRatiosGraph Expanded] xAxisDomain:', xAxisDomain);
  }

  return (
    <div className={`relative ${expanded ? 'h-[70vh]' : 'h-48'} ${className}`}>
      {/* Let ResponsiveContainer take 100% of its parent by default. */}
      <ResponsiveContainer> {/* Removed explicit width and height props */}
        <LineChart key={expanded ? 'expanded-chart' : 'normal-chart'} data={processedData} margin={{ top: 5, right: 20, left: -20, bottom: expanded ? 20 : 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor} />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={xAxisDomain}
            tickFormatter={dateFormatter}
            dy={expanded ? 10 : 5}
            fontSize={expanded ? 12 : 10}
            interval="preserveStartEnd"
            minTickGap={expanded ? 20 : 10}
            stroke={debugAxisColor}
            tick={{ fill: debugAxisColor }}
          />
          <YAxis
            domain={[0, 2]}
            ticks={[0, 0.5, 1.0, 1.4, 2.0]}
            fontSize={expanded ? 12 : 10}
            stroke={debugAxisColor}
            tick={{ fill: debugAxisColor }}
          />
          <ReferenceArea y1={1.0} y2={1.4} fill={idealRangeFillColor} strokeOpacity={0.3} ifOverflow="visible" />
          <Tooltip
            labelFormatter={tooltipLabelFormatter}
            contentStyle={{ 
              backgroundColor: 'rgba(30, 41, 59, 0.9)', 
              borderColor: 'rgba(75, 85, 99, 0.7)',    
              borderRadius: '0.375rem',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              padding: '4px 8px'
            }}
            labelStyle={{ 
              color: '#e5e7eb',
              marginBottom: '2px',
              fontWeight: 'bold',
              fontSize: '0.75rem'
            }}
            itemStyle={{
              color: '#d1d5db',
              fontSize: '0.7rem',
              padding: '1px 0'
            }}
            cursor={{ stroke: debugAxisColor, strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          {expanded && <Legend wrapperStyle={{ paddingTop: 20, fill: debugAxisColor }} iconSize={10} />}
          {visibleLines.strength && <Line type="monotone" dataKey="strength_ratio" name="Strength" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} connectNulls={true} />}
          {visibleLines.cardio && <Line type="monotone" dataKey="cardio_ratio" name="Cardio" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 6 }} connectNulls={true} />}
          {visibleLines.combined && <Line type="monotone" dataKey="combined_ratio" name="Combined" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 6 }} connectNulls={true} />}
        </LineChart>
      </ResponsiveContainer>
      {expanded && (
        <div className="absolute bottom-4 left-4 right-4 flex justify-start items-center"> {/* Changed justify-between to justify-start */}
          <div className="flex space-x-2">
            {TIME_SCALES.map(scale => (
              <button
                key={scale.key}
                onClick={() => setActiveTimeScale(scale.key)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors
                  ${activeTimeScale === scale.key 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
              >
                {scale.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(LoadRatiosGraph); // Wrap with React.memo
