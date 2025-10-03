import { useEffect, useState } from "react";
import instance from "../../api/api";
import EmptyState from "../../general-components/EmptyState";
import { ThreeDots } from "react-loader-spinner";

const Loader = ({ className = "", size = 50 }) => (
  <div className={`grid place-items-center ${className}`}>
    <ThreeDots
      visible
      height={size}
      width={size}
      color="#ffa500"
      radius="9"
      ariaLabel="loading"
    />
  </div>
);

// ---- error helpers (aligned with GBDashboard) ----
const isAbort = (e) => e?.name === "CanceledError" || e?.name === "AbortError";
const getErrorKind = (e) => {
  if (isAbort(e)) return { kind: "aborted", status: null };
  const status = e?.response?.status;
  if (!status) return { kind: "network", status: null }; // no response => network/offline
  if (status === 403) return { kind: "forbidden", status };
  if (status === 404 || status === 204) return { kind: "no_data", status };
  if (status >= 500) return { kind: "server", status };
  return { kind: "unknown", status };
};

const KeywordsAnalytics = ({ locationId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchInsights, setSearchInsights] = useState([]);
  const [notAllowed, setNotAllowed] = useState(false);
  const [noData, setNoData] = useState(false);
  const [networkErr, setNetworkErr] = useState(false);

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  const accessToken = sessionStorage.getItem("accessToken");

  useEffect(() => {
    if (!locationId) return;

    const controller = new AbortController();

    const fetchPerformanceData = async () => {
      setIsLoading(true);
      setNotAllowed(false);
      setNoData(false);
      setNetworkErr(false);
      setSearchInsights([]);
      setSortConfig({ key: null, direction: "ascending" });

      try {
        const response = await instance.get(
          `api/v1/google/performance/${locationId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
          }
        );

        const processedData = (response?.data?.allResults || []).map(
          (item) => ({
            ...item,
            insightsValue: {
              ...item.insightsValue,
              value:
                item.insightsValue.value !== undefined
                  ? Number(item.insightsValue.value)
                  : Number(item.insightsValue.threshold),
            },
          })
        );

        setSearchInsights(processedData);
        setNoData(processedData.length === 0);
      } catch (error) {
        if (isAbort(error)) return;
        console.error(error);
        const { kind } = getErrorKind(error);
        if (kind === "forbidden") {
          setNotAllowed(true);
        } else if (kind === "network") {
          setNetworkErr(true);
        } else if (
          kind === "no_data" ||
          kind === "server" ||
          kind === "unknown"
        ) {
          setNoData(true);
        }
        setSearchInsights([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPerformanceData();
    return () => controller.abort();
  }, [locationId, accessToken]);

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });

    setSearchInsights((prev) => {
      const data = [...prev];
      data.sort((a, b) => {
        let aValue, bValue;

        if (key === "insightsValue.value") {
          aValue =
            a.insightsValue.value !== undefined
              ? a.insightsValue.value
              : a.insightsValue.threshold;
          bValue =
            b.insightsValue.value !== undefined
              ? b.insightsValue.value
              : b.insightsValue.threshold;
        } else {
          aValue = a[key];
          bValue = b[key];
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return direction === "ascending" ? aValue - bValue : bValue - aValue;
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          const aLower = aValue.toLowerCase();
          const bLower = bValue.toLowerCase();
          if (aLower < bLower) return direction === "ascending" ? -1 : 1;
          if (aLower > bLower) return direction === "ascending" ? 1 : -1;
          return 0;
        }

        return 0;
      });
      return data;
    });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "ascending" ? " ↑" : " ↓";
    }
    return "";
  };

  // If this component is ever used standalone, you can uncomment the next block
  // to show a proper "no selection" state.
  // if (!locationId) {
  //   return (
  //     <EmptyState
  //       state="bg-empty-state-table"
  //       message="You have not selected an account or business information."
  //       className="py-32"
  //     />
  //   );
  // }

  return (
    <>
      {locationId && (
        <div>
          {notAllowed ? (
            <EmptyState
              state="bg-no-access"
              message="You don’t have access to this section."
              className="h-96"
            />
          ) : isLoading ? (
            <Loader className="h-96" />
          ) : networkErr ? (
            <EmptyState
              state="bg-empty-state-table"
              message="Network error. Please check your connection and try again."
              className="h-96"
            />
          ) : noData ? (
            <EmptyState
              state="bg-empty-state-table"
              message="No data has been received from Google."
              className="h-96"
            />
          ) : (
            <div className="m-8">
              {/* Header table (not scrollable) */}
              <table className="w-full bg-white table-fixed ">
                <thead className="bg-gray-100">
                  <tr className="rounded">
                    <th className="w-20 px-6 py-3 text-sm font-semibold text-gray-700 text-center rounded-tl-lg">
                      No
                    </th>
                    <th
                      onClick={() => handleSort("searchKeyword")}
                      className="px-6 py-3 text-sm font-semibold text-gray-700 text-center cursor-pointer select-none"
                    >
                      Keyword
                      <span className="ml-1">
                        {getSortIndicator("searchKeyword")}
                      </span>
                    </th>
                    <th
                      onClick={() => handleSort("insightsValue.value")}
                      className="w-44 px-6 py-3 text-sm font-semibold text-gray-700 text-center rounded-tr-lg cursor-pointer select-none"
                    >
                      Search Volume
                      <span className="ml-1">
                        {getSortIndicator("insightsValue.value")}
                      </span>
                    </th>
                  </tr>
                </thead>
              </table>

              {/* Scrollable body */}
              <div className="h-80 overflow-y-auto">
                <table className="w-full bg-white table-fixed">
                  <tbody>
                    {searchInsights.map((item, index) => (
                      <tr
                        key={`${item.searchKeyword}-${index}`}
                        className="border-b"
                      >
                        <td className="w-20 px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          {item.searchKeyword}
                        </td>
                        <td className="w-36 px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          {item.insightsValue.value ??
                            item.insightsValue.threshold}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default KeywordsAnalytics;
