import React from "react";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const ShopSummaryTable = ({
  labels = [],
  activeLabel = "",
  onChangeActive = () => {},
  month = new Date().getMonth() + 1,
  onChangeMonth = () => {},
  dataByLabel = {},
  loading = false,
  error = "",
}) => {
  const hasActive = Boolean(activeLabel);
  const rows = hasActive ? dataByLabel[activeLabel] || [] : [];

  return (
    <div className="p-4 border rounded-xl shadow-lg mt-6 bg-white relative">
      <h3 className="text-center">Shops Summary Table</h3>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {labels.map((lbl) => (
            <button
              key={lbl}
              type="button"
              onClick={() => onChangeActive(lbl)}
              className={`text-sm font-medium pb-1 border-b-2 -mb-px transition
                  ${
                    activeLabel === lbl
                      ? "text-orange-600 border-orange-600"
                      : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
            >
              {lbl}
            </button>
          ))}
          {!labels.length && (
            <span className="text-sm text-gray-500">No companies selected</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Select Month</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={month}
            onChange={(e) => onChangeMonth(Number(e.target.value))}
          >
            {MONTHS.map((label, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="my-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      {/* Table for ACTIVE company only */}
      {hasActive ? (
        rows.length > 0 ? (
          <table className="min-w-full table-auto">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Shop Name</th>
                <th className="px-4 py-2 border">Open</th>
                <th className="px-4 py-2 border">Closed</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((shop, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 border">{shop.shop_name}</td>
                  <td className="px-4 py-2 border">{shop.open}</td>
                  <td className="px-4 py-2 border">{shop.closed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !loading && !error && <p>No shop summary data for {activeLabel}.</p>
        )
      ) : (
        !loading && !error && <p>Select companies in Filter to see summary.</p>
      )}

      {/* Loading overlay for summary */}
      {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-xl flex items-center justify-center text-gray-700">
          Loading shop summary…
        </div>
      )}
    </div>
  );
};

export default ShopSummaryTable;
