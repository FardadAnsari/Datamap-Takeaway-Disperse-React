import { useEffect, useState } from "react";
import { MdKeyboardDoubleArrowLeft } from "react-icons/md";
import { IoIosArrowRoundBack, IoIosArrowRoundForward } from "react-icons/io";
import { default as StaticSelect } from "react-select";
import AutoCompletionMultiSelectStyles from "../AutoCompletionMultiSelectStyles";
import { ThreeDots } from "react-loader-spinner";
import EmptyState from "../EmptyState";

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

const MONTH_OPTIONS = MONTHS.map((label, i) => ({ value: i + 1, label }));

const ShopSummaryTable = ({
  labels = [],
  activeLabel = "",
  onChangeActive = () => {},
  month = new Date().getMonth() + 1,
  onChangeMonth = () => {},
  dataByLabel = {},
  loading = false,
  error = "",
  onChangePage = () => {},
}) => {
  const hasActive = Boolean(activeLabel);
  const activeBlock = hasActive
    ? dataByLabel[activeLabel] || { rows: [], meta: {} }
    : { rows: [], meta: {} };

  const rows = Array.isArray(activeBlock?.rows)
    ? activeBlock.rows
    : Array.isArray(activeBlock)
      ? activeBlock
      : [];
  const {
    totalPages = 1,
    currentPage = 1,
    totalItems = rows.length,
  } = activeBlock?.meta || {};

  // local input state for "go to page"
  const [pageInput, setPageInput] = useState(currentPage);
  useEffect(() => setPageInput(currentPage), [currentPage, activeLabel]);

  const handleNextPage = () => {
    if (currentPage < totalPages) onChangePage(currentPage + 1);
  };
  const handlePreviousPage = () => {
    if (currentPage > 1) onChangePage(currentPage - 1);
  };
  const handlePageChange = (page) => {
    const n = Math.max(1, Math.min(totalPages, Number(page) || 1));
    onChangePage(n);
  };
  const handleInputChange = (e) => setPageInput(e.target.value);
  const handlePageSubmit = () => handlePageChange(pageInput);

  const monthValue =
    MONTH_OPTIONS.find((m) => m.value === Number(month)) || null;

  return (
    <div className="p-6 border rounded-xl shadow-lg bg-white relative">
      <div className="mb-4 flex items-center justify-between">
        {/* Tabs */}
        <div className="flex items-center gap-6">
          {labels.length > 0 ? (
            labels.map((lbl) => (
              <button
                key={lbl}
                type="button"
                onClick={() => onChangeActive(lbl)}
                className={`text-md font-medium pb-1 border-b-2 -mb-px transition ${
                  activeLabel === lbl
                    ? "text-orange-600 border-orange-600"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                {lbl}
              </button>
            ))
          ) : (
            <span className="text-sm text-gray-500">No companies selected</span>
          )}
        </div>

        {/* Month selector (react-select styled like Filter Drawer) */}
        <div className="flex items-center gap-2">
          <div className="w-36">
            <StaticSelect
              instanceId="shop-summary-month"
              options={MONTH_OPTIONS}
              value={monthValue}
              onChange={(opt) => onChangeMonth(opt?.value ?? null)}
              isClearable={false}
              placeholder="Select month…"
              styles={AutoCompletionMultiSelectStyles}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="my-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      {/* Optional meta summary */}
      {hasActive && !loading && !error && (
        <div className="mb-2 text-sm text-gray-600">
          Total items: {totalItems} • Page {currentPage} of {totalPages}
        </div>
      )}

      <table className="min-w-full bg-white rounded-lg shadow-md">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 tracking-wider text-center rounded-tl-lg">
              Shop Name
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 tracking-wider text-center">
              Open
            </th>
            <th className="w-40 px-6 py-3 text-left text-sm font-semibold text-gray-700 tracking-wider text-center rounded-tr-lg">
              Closed
            </th>
          </tr>
        </thead>

        <tbody className="relative divide-y divide-gray-200 min-h-[200px]">
          {loading ? (
            <tr>
              <td colSpan={3} className="h-80">
                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                  <ThreeDots
                    visible={true}
                    height="50"
                    width="50"
                    color="#ffa500"
                    radius="9"
                    ariaLabel="three-dots-loading"
                    wrapperStyle={{}}
                    wrapperClass=""
                  />
                </div>
              </td>
            </tr>
          ) : hasActive ? (
            rows.length > 0 ? (
              rows.map((shop, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {shop.shop_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {shop.open}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {shop.closed}
                  </td>
                </tr>
              ))
            ) : !error ? (
              <tr>
                <td colSpan={3} className="h-80">
                  <EmptyState
                    state="bg-empty-state-table"
                    message={`No shop summary data for ${activeLabel}.`}
                    className="h-80"
                  />
                </td>
              </tr>
            ) : null
          ) : !error ? (
            <tr>
              <td colSpan={3} className="h-80">
                <EmptyState
                  state="bg-empty-state-table"
                  message="Select companies in Filter to see summary."
                  className="h-80"
                />
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {/* Pagination */}
      {hasActive && !loading && totalPages > 1 && (
        <div className="w-full mt-4 flex items-center justify-between">
          {currentPage > 2 ? (
            <button
              className="flex items-center p-2 text-orange-600 rounded-lg hover:text-orange-700 focus:outline-none"
              onClick={() => onChangePage(1)}
              disabled={currentPage === 1}
            >
              <MdKeyboardDoubleArrowLeft size={20} />
              <span className="ml-1">Go to Page 1</span>
            </button>
          ) : (
            <div className="flex items-center p-2 text-gray-400 rounded-lg">
              <MdKeyboardDoubleArrowLeft size={20} />
              <span className="ml-1">Go to Page 1</span>
            </div>
          )}

          <div className="flex gap-2">
            {currentPage > 1 && (
              <button
                className="p-2 border-2 border-orange-600 rounded-lg focus:outline-none flex items-center gap-1"
                onClick={handlePreviousPage}
              >
                <IoIosArrowRoundBack size={25} color="#EA580C" />
              </button>
            )}

            {currentPage !== totalPages && (
              <button
                className="flex items-center p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                <span>Next Page</span>
                <IoIosArrowRoundForward size={25} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700">Page</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={pageInput}
              onChange={handleInputChange}
              onBlur={handlePageSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                  handlePageSubmit();
                }
              }}
              className="w-14 h-[43px] px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-center"
            />
            <span className="text-gray-700">of {totalPages}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopSummaryTable;
