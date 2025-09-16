import { useMemo, useState } from "react";
import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const DEFAULT_COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#8dd1e1",
  "#a4de6c",
  "#d0ed57",
  "#ff7f50",
  "#a28cf0",
  "#ffbb28",
  "#00C49F",
];

const renderActiveShape = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  fill,
  payload,
  percent,
  value,
}) => {
  const RAD = Math.PI / 180;
  const sin = Math.sin(-RAD * (midAngle || 1));
  const cos = Math.cos(-RAD * (midAngle || 1));
  const sx = (cx || 0) + ((outerRadius || 0) + 10) * cos;
  const sy = (cy || 0) + ((outerRadius || 0) + 10) * sin;
  const mx = (cx || 0) + ((outerRadius || 0) + 30) * cos;
  const my = (cy || 0) + ((outerRadius || 0) + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
        {payload?.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={(outerRadius || 0) + 6}
        outerRadius={(outerRadius || 0) + 10}
        fill={fill}
      />
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        fill="none"
      />
      <circle cx={ex} cy={ey} r={3} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="#999"
      >
        {`(${((percent || 0) * 100).toFixed(1)}%)`}
      </text>
    </g>
  );
};

function GroupedTooltip({ active, payload, label, total }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;

  // If it’s a normal slice, show simple line
  if (!p._isGroup) {
    const pct = total > 0 ? ((p.value / total) * 100).toFixed(2) : "0.00";
    return (
      <div className="bg-white/95 border rounded-md shadow p-2 text-sm">
        <div className="font-semibold">{p.name}</div>
        <div>Percent: {pct}%</div>
      </div>
    );
  }

  // If it’s the grouped slice, list all small items
  return (
    <div className="bg-white/95 border rounded-md shadow p-2 text-sm max-w-[260px]">
      <div className="font-semibold mb-1">{p.name}</div>
      <div className="text-xs text-stone-600 mb-1">
        Combined:(
        {total > 0 ? ((p.value / total) * 100).toFixed(2) : "0.00"}%)
      </div>
      <div className="max-h-48 overflow-auto pr-1">
        {p._breakdown?.map((it) => {
          const pct =
            total > 0 ? ((it.value / total) * 100).toFixed(2) : "0.00";
          return (
            <div key={it.name} className="flex items-center justify-between">
              <span className="truncate mr-3">{it.name}</span>
              <span className="tabular-nums">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PiechartSection({
  data,
  nameKey = "name",
  valueKey = "value",
  height = 480,
  innerRadius = 100,
  outerRadius = 140,
  topN, // optional: apply after grouping to majors
  minValue = 0, // optional absolute-value filter
  groupUnderPercent = 1, // NEW: group all items < X% into one slice
  groupLabel = "Least interactions",
  colors = DEFAULT_COLORS,
  onSliceClick,
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const { chartData, total } = useMemo(() => {
    // normalize input => [{ name, value }]
    let arr = Array.isArray(data)
      ? data.map((d) => ({
          name: d?.[nameKey],
          value: Number(d?.[valueKey]) || 0,
        }))
      : Object.entries(data || {}).map(([name, value]) => ({
          name,
          value: Number(value) || 0,
        }));

    if (minValue > 0) arr = arr.filter((d) => d.value >= minValue);

    const total = arr.reduce((s, d) => s + d.value, 0);

    // nothing to show
    if (total <= 0) return { chartData: [], total: 0 };

    // split majors vs minors by percentage threshold
    let majors = [];
    let minors = [];

    if (groupUnderPercent > 0) {
      const cut = (groupUnderPercent / 100) * total;
      for (const d of arr) {
        (d.value >= cut ? majors : minors).push(d);
      }
    } else {
      majors = arr.slice();
    }

    // sort majors desc
    majors.sort((a, b) => b.value - a.value);

    // optional topN on majors
    if (topN && topN > 0 && majors.length > topN) {
      majors = majors.slice(0, topN);
    }

    // build group slice if there are minors
    if (minors.length) {
      const groupValue = minors.reduce((s, d) => s + d.value, 0);
      majors.push({
        name: groupLabel,
        value: groupValue,
        _isGroup: true,
        _breakdown: minors
          .slice() // list in descending order by percent
          .sort((a, b) => b.value - a.value),
      });
    }

    return { chartData: majors, total };
  }, [data, nameKey, valueKey, minValue, groupUnderPercent, groupLabel, topN]);

  // keep activeIndex valid
  const safeActiveIndex = chartData.length
    ? Math.min(activeIndex, chartData.length - 1)
    : 0;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            activeIndex={safeActiveIndex}
            activeShape={renderActiveShape}
            onMouseEnter={(_, i) => setActiveIndex(i)}
            onClick={(slice) => onSliceClick && onSliceClick(slice?.payload)}
            isAnimationActive
          >
            {chartData.map((d, i) => (
              <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
            ))}
          </Pie>

          <Tooltip
            content={
              <GroupedTooltip
                // Recharts injects props; we pass total for percentage math
                total={total}
              />
            }
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      {!chartData.length && (
        <div className="text-center text-sm text-stone-500 mt-2">No data</div>
      )}
    </div>
  );
}
