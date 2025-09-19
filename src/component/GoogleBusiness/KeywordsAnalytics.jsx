import { useEffect, useState } from "react";
import instance from "../../api/api";
import EmptyState from "../../general-components/EmptyState";

const KeywordsAnalytics = ({ locationId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchInsights, setSearchInsights] = useState([]);
  const [notAllowed, setNotAllowed] = useState(false);
  const [noData, setNoData] = useState(false);

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const accessToken = sessionStorage.getItem("accessToken");
  useEffect(() => {
    const fetchPerformanceData = async () => {
      if (locationId) {
        setIsLoading(true);
        try {
          const response = await instance.get(
            `api/v1/google/performance/${locationId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          setNoData(false);
          const processedData = response.data.allResults.map((item) => ({
            ...item,
            insightsValue: {
              ...item.insightsValue,
              value:
                item.insightsValue.value !== undefined
                  ? Number(item.insightsValue.value)
                  : Number(item.insightsValue.threshold),
            },
          }));
          setSearchInsights(processedData);
        } catch (error) {
          console.error(error);
          error?.status === 500 && setNoData(true);
          error?.status === 403 && setNotAllowed(true);
        }
      }
    };

    fetchPerformanceData();
  }, [locationId]);

  const handleSort = (key) => {
    let direction = "ascending";

    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }

    setSortConfig({ key, direction });

    const sortedData = [...searchInsights].sort((a, b) => {
      let aValue;
      let bValue;

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

    setSearchInsights(sortedData);
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "ascending" ? " ↑" : " ↓";
    }
    return "";
  };

  return (
    <>
      {locationId && (
        <div>
          {!notAllowed ? (
            noData ? (
              <EmptyState
                state="bg-empty-state-chart"
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
                        className="px-6 py-3 text-sm font-semibold text-gray-700 text-center"
                      >
                        Keyword
                        <span className="ml-1">
                          {getSortIndicator("searchKeyword")}
                        </span>
                      </th>
                      <th
                        onClick={() => handleSort("insightsValue.value")}
                        className="w-44 px-6 py-3 text-sm font-semibold text-gray-700 text-center rounded-tr-lg"
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
                        <tr key={index} className="border-b">
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
            )
          ) : (
            <EmptyState
              state="bg-no-access"
              message="You don’t have access to this section."
              className="h-96"
            />
          )}
        </div>
      )}
    </>
  );
};

export default KeywordsAnalytics;
