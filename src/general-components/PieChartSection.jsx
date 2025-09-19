import {
  PieChart,
  Pie,
  Sector,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import { useMemo, useState } from "react";

/* ---------- Defaults ---------- */
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

/* ---------- Tooltips ---------- */
function GroupedTooltip({ active, payload, total }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;

  // Non-group slice
  if (!p._isGroup) {
    const pct = total > 0 ? ((p.value / total) * 100).toFixed(2) : "0.00";
    return (
      <div className="bg-white/95 border rounded-md shadow p-2 text-sm">
        <div className="font-semibold">{p.name}</div>
        <div>Percent: {pct}%</div>
      </div>
    );
  }

  // Grouped slice
  return (
    <div className="bg-white/95 border rounded-md shadow p-2 text-sm max-w-[260px]">
      <div className="font-semibold mb-1">{p.name}</div>
      <div className="text-xs text-stone-600 mb-1">
        Combined: {total > 0 ? ((p.value / total) * 100).toFixed(2) : "0.00"}%
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

/* ---------- Active shapes (highlight renderers) ---------- */
// Variant A: center labels (like your GBDashboard)
function CenterActiveShape({
  cx,
  cy,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  payload,
  percent,
  value,
  fill,
  centerLabelLines, // function -> string[]
}) {
  const lines =
    typeof centerLabelLines === "function"
      ? centerLabelLines({ name: payload?.name, value, percent })
      : [payload?.name, `${((percent || 0) * 100).toFixed(1)}%`];

  return (
    <g>
      {/* labels in the middle */}
      <text x={cx} y={cy} dy={-10} textAnchor="middle" fill="rgb(75, 75, 75)">
        {lines[0] || ""}
      </text>
      {lines[1] ? (
        <text x={cx} y={cy} dy={12} textAnchor="middle" fill="rgb(75, 75, 75)">
          {lines[1]}
        </text>
      ) : null}
      {lines[2] ? (
        <text x={cx} y={cy} dy={34} textAnchor="middle" fill="rgb(75, 75, 75)">
          {lines[2]}
        </text>
      ) : null}

      {/* main sector */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      {/* ring highlight */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={(outerRadius || 0) + 6}
        outerRadius={(outerRadius || 0) + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
}

// Variant B: callout line + percent (like your ProductAnalysis)
function CalloutActiveShape(props) {
  const RAD = Math.PI / 180;
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    percent,
    payload,
  } = props;

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
        innerRadius={(outerRadius || 0) + 6}
        outerRadius={(outerRadius || 0) + 10}
        startAngle={startAngle}
        endAngle={endAngle}
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
}

/* ---------- Helpers ---------- */
function normalizeData(input, nameKey, valueKey) {
  if (Array.isArray(input)) {
    return input.map((d) => ({
      name: d?.[nameKey],
      value: Number(d?.[valueKey]) || 0,
    }));
  }
  // object map { name: value }
  return Object.entries(input || {}).map(([name, value]) => ({
    name,
    value: Number(value) || 0,
  }));
}

/* ---------- Main Component ---------- */
export default function PieChartSection({
  data,
  nameKey = "name",
  valueKey = "value",
  height = 400,
  innerRadius = 100,
  outerRadius = 130,
  minValue = 0, // absolute filter
  groupUnderPercent = 0, // e.g. 5 to group items <5%
  groupLabel = "other",
  topN, // apply after grouping
  colors = DEFAULT_COLORS,
  variant = "callout", // 'callout' | 'center'
  centerLabelLines, // fn({name, value, percent}) => [line1, line2?, line3?]
  showLegend = true,
  showTooltip = true,
  onSliceClick,
  activeIndex: controlledActiveIndex, // optional outside control
  onActiveIndexChange, // if you want to control it from parent
}) {
  const [uncontrolledActive, setUncontrolledActive] = useState(0);
  const activeIndex =
    typeof controlledActiveIndex === "number"
      ? controlledActiveIndex
      : uncontrolledActive;

  const { chartData, total } = useMemo(() => {
    let arr = normalizeData(data, nameKey, valueKey);

    if (minValue > 0) arr = arr.filter((d) => d.value >= minValue);

    const total = arr.reduce((s, d) => s + d.value, 0);
    if (total <= 0) return { chartData: [], total: 0 };

    let majors = [];
    let minors = [];

    if (groupUnderPercent > 0) {
      const cut = (groupUnderPercent / 100) * total;
      for (const d of arr) (d.value >= cut ? majors : minors).push(d);
    } else {
      majors = arr.slice();
    }

    // sort majors desc
    majors.sort((a, b) => b.value - a.value);

    // optional topN
    if (topN && topN > 0 && majors.length > topN) {
      majors = majors.slice(0, topN);
    }

    // grouped slice
    if (minors.length) {
      const groupValue = minors.reduce((s, d) => s + d.value, 0);
      majors.push({
        name: groupLabel,
        value: groupValue,
        _isGroup: true,
        _breakdown: minors.slice().sort((a, b) => b.value - a.value),
      });
    }

    return { chartData: majors, total };
  }, [data, nameKey, valueKey, minValue, groupUnderPercent, groupLabel, topN]);

  const safeActive = chartData.length
    ? Math.min(activeIndex, chartData.length - 1)
    : 0;

  const handleEnter = (_, i) => {
    if (typeof onActiveIndexChange === "function") onActiveIndexChange(i);
    else setUncontrolledActive(i);
  };

  const ActiveShape =
    variant === "center"
      ? (props) => (
          <CenterActiveShape {...props} centerLabelLines={centerLabelLines} />
        )
      : CalloutActiveShape;

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
            activeIndex={safeActive}
            activeShape={ActiveShape}
            onMouseEnter={handleEnter}
            onClick={(slice) => onSliceClick && onSliceClick(slice?.payload)}
            isAnimationActive
          >
            {chartData.map((d, i) => (
              <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
            ))}
          </Pie>

          {showTooltip && (
            <Tooltip content={<GroupedTooltip total={total} />} />
          )}
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>

      {!chartData.length && (
        <div className="text-center text-sm text-stone-500 mt-2">No data</div>
      )}
    </div>
  );
}
