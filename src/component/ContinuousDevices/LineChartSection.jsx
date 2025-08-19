// LineChartSection.jsx
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

const COLORS = ["#2563eb", "#f97316", "#10b981"];

const LineChartSection = ({ data = [] }) => {
  const series =
    data.length > 0 ? Object.keys(data[0]).filter((k) => k !== "name") : [];

  const hasAnyData =
    data.length > 0 &&
    series.some((key) => data.some((row) => Number(row[key] || 0) !== 0));

  if (!hasAnyData) {
    return (
      <div className="mt-5 w-full h-[350px] flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-lg">
        <div className="w-44 h-44 bg-cover bg-empty-state-chart"></div>
        <p className="text-gray-400 text-sm">No data available</p>
      </div>
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
          <XAxis dataKey="name" />
          <YAxis allowDecimals />
          <Tooltip />
          <Legend />
          {series.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[i % COLORS.length]}
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
