import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import EmptyState from "../../general-components/EmptyState";

// Fixed mapping from company label → color
const COMPANY_COLORS = {
  FoodHub: "#2563eb", // blue
  JustEat: "#f97316", // orange
  FeedMeOnline: "#10b981", // green
};

const LineChartSection = ({
  data = [],
  xDataKey = "name",
  xTicks, // optional custom ticks (e.g., first day of month)
  xTickFormatter, // optional formatter (e.g., show month names)
}) => {
  // Union of keys across all rows (so missing keys in first row don't hide a line)
  const series = Array.from(
    new Set(
      data.flatMap((row) => Object.keys(row)).filter((k) => k !== xDataKey)
    )
  );

  const hasAnyData =
    data.length > 0 &&
    series.some((key) => data.some((row) => Number(row[key] || 0) !== 0));

  if (!hasAnyData) {
    return (
      <EmptyState
        state="bg-empty-state-chart"
        message="No data available"
        className="h-80"
      />
    );
  }

  return (
    <div className="mt-5 w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={xDataKey}
            ticks={xTicks}
            tickFormatter={xTickFormatter}
          />
          <YAxis allowDecimals />
          <Tooltip />
          <Legend />
          {series.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COMPANY_COLORS[key] || "#8884d8"} // fallback color
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChartSection;
