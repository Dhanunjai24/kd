import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  IndianRupee,
  Target,
  Award,
  Zap,
  BarChart3,
  LineChart as LineChartIcon,
  Sparkles,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { Booking, WorkerProfile } from '../../types/kaamdost';
import { triggerHaptic, HAPTIC_PATTERNS } from '../../utils/haptics';

interface WorkerEarningsChartProps {
  completedOrPaidJobs: Booking[];
  activeWorker: WorkerProfile;
  grossEarnings: number;
  netTakeHome: number;
}

type ChartViewMode = 'DAILY' | 'CUMULATIVE' | 'JOBS';

export const WorkerEarningsChart: React.FC<WorkerEarningsChartProps> = ({
  completedOrPaidJobs,
  activeWorker,
  grossEarnings,
  netTakeHome,
}) => {
  const [viewMode, setViewMode] = useState<ChartViewMode>('DAILY');
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  // Compute today's dynamic contribution from active & completed jobs in the current session
  const todayLiveGross = completedOrPaidJobs.reduce((sum, b) => {
    const extras = (b.extraWorkItems || [])
      .filter((x) => x.status === 'APPROVED')
      .reduce((s, x) => s + x.price, 0);
    return sum + b.baseAmount + extras + (b.tipAmount || 0);
  }, 750); // baseline start of day
  const todayCommission = Math.round(todayLiveGross * 0.1);
  const todayLiveNet = todayLiveGross - todayCommission + 200; // includes peak hour incentive
  const todayJobsCount = Math.max(2, completedOrPaidJobs.length);

  // Current week daily income progression (Mon - Sun)
  // Reflects real-world urban service demand spikes (weekend & evening rushes)
  const rawDailyData = [
    {
      day: 'Mon',
      fullDay: 'Monday',
      date: '23 Sep',
      gross: 1450,
      net: 1350,
      commission: 145,
      incentive: 45,
      jobs: 2,
      hours: 4.2,
      peakHour: '11 AM - 1 PM',
      isToday: false,
    },
    {
      day: 'Tue',
      fullDay: 'Tuesday',
      date: '24 Sep',
      gross: 1950,
      net: 1810,
      commission: 195,
      incentive: 55,
      jobs: 3,
      hours: 5.5,
      peakHour: '4 PM - 7 PM',
      isToday: false,
    },
    {
      day: 'Wed',
      fullDay: 'Wednesday',
      date: '25 Sep',
      gross: 1300,
      net: 1220,
      commission: 130,
      incentive: 50,
      jobs: 2,
      hours: 3.8,
      peakHour: '10 AM - 12 PM',
      isToday: false,
    },
    {
      day: 'Thu',
      fullDay: 'Thursday',
      date: '26 Sep',
      gross: 2450,
      net: 2260,
      commission: 245,
      incentive: 55,
      jobs: 4,
      hours: 7.0,
      peakHour: '5 PM - 8 PM',
      isToday: false,
    },
    {
      day: 'Fri',
      fullDay: 'Friday',
      date: '27 Sep',
      gross: 2100,
      net: 1940,
      commission: 210,
      incentive: 50,
      jobs: 3,
      hours: 6.2,
      peakHour: '6 PM - 9 PM',
      isToday: false,
    },
    {
      day: 'Sat',
      fullDay: 'Saturday',
      date: '28 Sep',
      gross: 2850,
      net: 2620,
      commission: 285,
      incentive: 55,
      jobs: 5,
      hours: 8.5,
      peakHour: '11 AM - 4 PM',
      isToday: false,
    },
    {
      day: 'Sun',
      fullDay: 'Sunday (Today)',
      date: '29 Sep',
      gross: Math.max(1650, todayLiveGross),
      net: Math.max(1520, todayLiveNet),
      commission: todayCommission,
      incentive: 200,
      jobs: todayJobsCount,
      hours: 6.0,
      peakHour: '3 PM - 7 PM',
      isToday: true,
    },
  ];

  // Calculate cumulative progression across the current week
  let cumulativeSum = 0;
  const weekData = rawDailyData.map((item) => {
    cumulativeSum += item.net;
    return {
      ...item,
      cumulative: cumulativeSum,
      avgPerJob: Math.round(item.gross / Math.max(1, item.jobs)),
    };
  });

  const totalWeekGross = weekData.reduce((acc, curr) => acc + curr.gross, 0);
  const totalWeekNet = weekData.reduce((acc, curr) => acc + curr.net, 0);
  const totalJobsCompleted = weekData.reduce((acc, curr) => acc + curr.jobs, 0);
  const averageDailyNet = Math.round(totalWeekNet / weekData.length);

  // Weekly earnings target
  const weeklyTarget = 14000;
  const targetPercent = Math.min(100, Math.round((totalWeekNet / weeklyTarget) * 100));

  // Best earning day
  const bestDay = [...weekData].sort((a, b) => b.net - a.net)[0];

  const handleModeChange = (mode: ChartViewMode) => {
    triggerHaptic(HAPTIC_PATTERNS.LIGHT_TAP);
    setViewMode(mode);
  };

  // Custom high-contrast tooltip adhering to anti-slop guidelines
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl text-xs space-y-2 min-w-[200px] backdrop-blur-md">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-sm">
                {data.fullDay}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                ({data.date})
              </span>
            </div>
            {data.isToday && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Live Today
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Net Take-Home:</span>
              </span>
              <span className="font-bold text-emerald-400 tabular-nums text-sm">
                ₹{data.net.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span>Gross Revenue:</span>
              </span>
              <span className="font-medium text-slate-200 tabular-nums">
                ₹{data.gross.toLocaleString('en-IN')}
              </span>
            </div>

            {viewMode === 'CUMULATIVE' && (
              <div className="flex justify-between items-center text-amber-300 pt-1 border-t border-slate-800/80">
                <span>Cumulative Week Total:</span>
                <span className="font-extrabold tabular-nums">
                  ₹{data.cumulative.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Completed Services:</span>
              <span className="font-semibold text-slate-200 tabular-nums">
                {data.jobs} {data.jobs === 1 ? 'job' : 'jobs'} ({data.hours}h active)
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-500 text-[10px]">
              <span>Avg per service:</span>
              <span className="tabular-nums font-medium text-slate-300">
                ₹{data.avgPerJob}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-5 space-y-4 border border-slate-800/80 shadow-lg">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Daily Earnings Progression
              </h3>
              <p className="text-[11px] text-slate-400">
                Current Week (23 Sep - 29 Sep) · Live Sync
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Interactive Segmented Control */}
        <div className="flex items-center p-1 bg-slate-800/90 rounded-xl border border-slate-700/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleModeChange('DAILY')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'DAILY'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            <span>Daily</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('CUMULATIVE')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'CUMULATIVE'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Growth</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('JOBS')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'JOBS'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Jobs</span>
          </button>
        </div>
      </div>

      {/* Quick Performance Metrics Summary Grid */}
      <div className="grid grid-cols-3 gap-2.5 pt-1">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-2.5">
          <span className="text-[10px] font-medium text-slate-400 block">
            Week Net Total
          </span>
          <span className="text-base font-extrabold text-emerald-400 tabular-nums">
            ₹{totalWeekNet.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {totalJobsCompleted} jobs done
          </span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-2.5">
          <span className="text-[10px] font-medium text-slate-400 block">
            Daily Average
          </span>
          <span className="text-base font-extrabold text-slate-200 tabular-nums">
            ₹{averageDailyNet.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-emerald-400/90 font-medium block mt-0.5 flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5" />
            +18% vs last wk
          </span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-2.5">
          <span className="text-[10px] font-medium text-slate-400 block">
            Peak Day
          </span>
          <span className="text-base font-extrabold text-amber-400 tabular-nums">
            {bestDay.day}
          </span>
          <span className="text-[10px] text-slate-400 tabular-nums block mt-0.5">
            ₹{bestDay.net.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Main Recharts Visual Area */}
      <div className="pt-2">
        <div className="w-full h-56 -ml-3">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'DAILY' ? (
              <AreaChart
                data={weekData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                onMouseMove={(state: any) => {
                  if (state && state.activeLabel) {
                    setHoveredDay(state.activeLabel);
                  }
                }}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <defs>
                  <linearGradient id="netIncomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="grossIncomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#334155"
                  strokeDasharray="3 3"
                  vertical={false}
                  opacity={0.4}
                />
                <XAxis
                  dataKey="day"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tick={({ x, y, payload }) => {
                    const isToday = payload.value === 'Sun';
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text
                          x={0}
                          y={12}
                          dy={0}
                          textAnchor="middle"
                          fill={isToday ? '#34D399' : '#94A3B8'}
                          fontWeight={isToday ? 700 : 500}
                          fontSize={11}
                        >
                          {payload.value}
                        </text>
                        {isToday && (
                          <circle cx={0} cy={18} r={2} fill="#34D399" />
                        )}
                      </g>
                    );
                  }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                  domain={[0, 'dataMax + 400']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="gross"
                  stroke="#38BDF8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#grossIncomeGradient)"
                  name="Gross Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="net"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#netIncomeGradient)"
                  name="Net Take-Home"
                  activeDot={{
                    r: 6,
                    fill: '#10B981',
                    stroke: '#FFFFFF',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            ) : viewMode === 'CUMULATIVE' ? (
              <AreaChart
                data={weekData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#334155"
                  strokeDasharray="3 3"
                  vertical={false}
                  opacity={0.4}
                />
                <XAxis
                  dataKey="day"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tick={({ x, y, payload }) => {
                    const isToday = payload.value === 'Sun';
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text
                          x={0}
                          y={12}
                          dy={0}
                          textAnchor="middle"
                          fill={isToday ? '#FBBF24' : '#94A3B8'}
                          fontWeight={isToday ? 700 : 500}
                          fontSize={11}
                        >
                          {payload.value}
                        </text>
                        {isToday && (
                          <circle cx={0} cy={18} r={2} fill="#FBBF24" />
                        )}
                      </g>
                    );
                  }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#cumulativeGradient)"
                  name="Cumulative Earnings"
                  activeDot={{
                    r: 6,
                    fill: '#F59E0B',
                    stroke: '#FFFFFF',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            ) : (
              <BarChart
                data={weekData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="#334155"
                  strokeDasharray="3 3"
                  vertical={false}
                  opacity={0.4}
                />
                <XAxis
                  dataKey="day"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  tickFormatter={(val) => `${val} jobs`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="jobs"
                  fill="#10B981"
                  radius={[6, 6, 0, 0]}
                  name="Completed Jobs"
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Chart Legend & Indicators */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            {viewMode === 'DAILY' ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-1 rounded-full bg-emerald-400"></span>
                  <span className="text-slate-300 font-medium">Net Payout</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 border-t border-dashed border-sky-400"></span>
                  <span className="text-slate-400">Gross</span>
                </div>
              </>
            ) : viewMode === 'CUMULATIVE' ? (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 rounded-full bg-amber-400"></span>
                <span className="text-slate-300 font-medium">Week Accumulation</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                <span className="text-slate-300 font-medium">Completed Jobs</span>
              </div>
            )}
          </div>
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Sun is live tracking
          </span>
        </div>
      </div>

      {/* Weekly Income Target Goal Tracker */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-slate-200">
              Weekly Target: ₹{weeklyTarget.toLocaleString('en-IN')}
            </span>
          </div>
          <span className="font-extrabold text-emerald-400 tabular-nums">
            {targetPercent}% ({totalWeekNet >= weeklyTarget ? 'Goal Reached! 🎉' : `₹${(weeklyTarget - totalWeekNet).toLocaleString('en-IN')} to go`})
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${targetPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
          <span>Current: ₹{totalWeekNet.toLocaleString('en-IN')}</span>
          <span>Goal: ₹{weeklyTarget.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
};
