import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingDown } from 'lucide-react';
import type { CrowdLevel } from '@shared/schema';

export interface CrowdPrediction {
  timestamp: Date;
  crowdLevel: CrowdLevel;
  confidence: number;
}

interface CrowdTimelineProps {
  spotId: number;
  predictions: CrowdPrediction[];
  currentTime?: Date;
}

/**
 * CrowdTimeline Component
 * 
 * Displays a 24-hour timeline graph showing predicted crowd levels.
 * Features:
 * - Renders 24-hour timeline graph using Recharts
 * - Highlights best times to visit (lowest crowd periods)
 * - Displays confidence scores
 * - Updates when new predictions are available
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export default function CrowdTimeline({
  predictions,
  currentTime = new Date(),
}: CrowdTimelineProps) {
  // Transform predictions into chart data
  const chartData = useMemo(() => {
    return predictions.map((pred) => {
      // Convert crowd level to numeric value for charting
      const crowdValue = pred.crowdLevel === 'low' ? 1 : pred.crowdLevel === 'medium' ? 2 : 3;
      
      // Format time for display
      const hour = pred.timestamp.getHours();
      const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
      
      return {
        time: timeLabel,
        timestamp: pred.timestamp,
        crowdValue,
        crowdLevel: pred.crowdLevel,
        confidence: Math.round(pred.confidence * 100),
        confidenceDecimal: pred.confidence,
      };
    });
  }, [predictions]);

  // Find best times to visit (lowest crowd periods) - Requirement 6.2, 6.4
  const bestTimes = useMemo(() => {
    if (predictions.length === 0) return [];
    
    // Find the minimum crowd level
    const minCrowdValue = Math.min(...chartData.map(d => d.crowdValue));
    
    // Get all time slots with the minimum crowd level
    const bestTimeSlots = chartData.filter(d => d.crowdValue === minCrowdValue);
    
    // Group consecutive time slots
    const groups: typeof chartData[] = [];
    let currentGroup: typeof chartData = [];
    
    bestTimeSlots.forEach((slot, index) => {
      if (currentGroup.length === 0) {
        currentGroup.push(slot);
      } else {
        const lastSlot = currentGroup[currentGroup.length - 1];
        const lastHour = parseInt(lastSlot.time.split(':')[0]);
        const currentHour = parseInt(slot.time.split(':')[0]);
        
        // Check if consecutive (accounting for day wrap)
        if (currentHour === (lastHour + 1) % 24) {
          currentGroup.push(slot);
        } else {
          groups.push([...currentGroup]);
          currentGroup = [slot];
        }
      }
      
      // Push last group
      if (index === bestTimeSlots.length - 1 && currentGroup.length > 0) {
        groups.push(currentGroup);
      }
    });
    
    return groups;
  }, [chartData, predictions]);

  // Format best time recommendation
  const bestTimeRecommendation = useMemo(() => {
    if (bestTimes.length === 0) return null;
    
    // Get the longest period of low crowds
    const longestPeriod = bestTimes.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    , bestTimes[0]);
    
    if (longestPeriod.length === 1) {
      return `${longestPeriod[0].time}`;
    } else {
      const startTime = longestPeriod[0].time;
      const endTime = longestPeriod[longestPeriod.length - 1].time;
      return `${startTime} - ${endTime}`;
    }
  }, [bestTimes]);

  // Get color for crowd level
  const getCrowdLevelColor = (level: CrowdLevel): string => {
    switch (level) {
      case 'low':
        return '#22c55e'; // green-500
      case 'medium':
        return '#eab308'; // yellow-500
      case 'high':
        return '#ef4444'; // red-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-sm mb-1">{data.time}</p>
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: getCrowdLevelColor(data.crowdLevel) }}
            />
            <span className="text-sm capitalize">{data.crowdLevel} Crowd</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Confidence: {data.confidence}%
          </p>
        </div>
      );
    }
    return null;
  };

  // If no predictions, show empty state
  if (predictions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            24-Hour Crowd Forecast
          </CardTitle>
          <CardDescription>
            Predicted crowd levels for the next 24 hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <p>No prediction data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          24-Hour Crowd Forecast
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Predicted crowd levels for the next 24 hours
        </CardDescription>
        
        {/* Best time to visit recommendation - Requirement 6.4 */}
        {bestTimeRecommendation && (
          <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-2">
              <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-semibold text-green-700 dark:text-green-400">
                  Best Time to Visit
                </p>
                <p className="text-xs sm:text-sm text-green-600 dark:text-green-500">
                  {bestTimeRecommendation}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Timeline graph - Requirement 6.1 */}
        <div className="w-full h-48 sm:h-56 lg:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id="crowdGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="50%" stopColor="#eab308" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis 
                domain={[0.5, 3.5]}
                ticks={[1, 2, 3]}
                tickFormatter={(value) => {
                  if (value === 1) return 'Low';
                  if (value === 2) return 'Med';
                  if (value === 3) return 'High';
                  return '';
                }}
                tick={{ fontSize: 10 }}
                className="text-gray-600 dark:text-gray-400"
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Highlight best times with reference lines */}
              {bestTimes.flat().map((slot, index) => (
                <ReferenceLine
                  key={`best-${index}`}
                  x={slot.time}
                  stroke="#22c55e"
                  strokeWidth={2}
                  strokeOpacity={0.3}
                />
              ))}
              
              <Area
                type="monotone"
                dataKey="crowdValue"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#crowdGradient)"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill={getCrowdLevelColor(payload.crowdLevel)}
                      stroke="white"
                      strokeWidth={2}
                    />
                  );
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Confidence scores legend - Requirement 6.3 */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500" />
                <span>Low</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500" />
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500" />
                <span>High</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span>Avg. Confidence:</span>
              <Badge variant="secondary" className="text-xs">
                {Math.round(
                  chartData.reduce((sum, d) => sum + d.confidence, 0) / chartData.length
                )}%
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
