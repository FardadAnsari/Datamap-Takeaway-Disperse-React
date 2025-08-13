import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const monthOpts = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];
const DailyBarChartSection = ({
  data,
  companyLabels = [],
  month,
  setMonth,
  headerRightExtra,
}) => {
  const [active, setActive] = useState(companyLabels[0] || "");

  // keep active tab valid if company list changes
  useEffect(() => {
    if (!companyLabels.length) {
      setActive("");
      return;
    }
    if (!active || !companyLabels.includes(active)) {
      setActive(companyLabels[0]);
    }
  }, [companyLabels, active]);

  // Shape data for the active company only -> keys "open"/"closed"
  const filtered = useMemo(() => {
    if (!active) return [];
    const ok = `${active}_open`;
    const ck = `${active}_closed`;
    return (data || []).map((row) => ({
      name: row.name,
      open: Number(row[ok] || 0),
      closed: Number(row[ck] || 0),
    }));
  }, [data, active]);

  return (
    <div className="p-4 border rounded-xl shadow-lg relative bg-white">
      {/* Header */}
      <div className="mx-2 mb-2 flex items-center justify-between">
        {/* Tabs */}
        <div className="flex items-center gap-6">
          {companyLabels.map((lbl) => (
            <button
              key={lbl}
              type="button"
              onClick={() => setActive(lbl)}
              className={`text-sm font-medium pb-1 border-b-2 -mb-px transition
                ${
                  active === lbl
                    ? "text-orange-600 border-orange-600"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
            >
              {lbl}
            </button>
          ))}
          {!companyLabels.length && (
            <span className="text-sm text-gray-500">No companies</span>
          )}
        </div>

        {/* Month selector + optional extra */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Select Month</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {monthOpts.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          {headerRightExtra}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={360}>
        <BarChart
          data={filtered}
          margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tickMargin={6} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          {/* Green = ON/OPEN, Red = OFF/CLOSED; stacked per day */}
          <Bar
            dataKey="open"
            name="On / Open"
            stackId="status"
            fill="#aee34cff"
          />
          <Bar
            dataKey="closed"
            name="Off / Closed"
            stackId="status"
            fill="#f66464ff"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DailyBarChartSection;
