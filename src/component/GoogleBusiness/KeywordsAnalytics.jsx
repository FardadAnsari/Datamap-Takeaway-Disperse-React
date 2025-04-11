import { useEffect, useState } from "react";
import instance from "../../api/api";

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
          console.log(error);
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
        <div className="m-8 max-h-96 overflow-auto">
          {!notAllowed ? (
            noData ? (
              <div className="flex flex-col justify-center items-center py-4">
                <div className="w-44 h-44 bg-cover bg-empty-state-table"></div>
                <p className="text-sm text-center">
                  No data has been received from Google.
                </p>
              </div>
            ) : (
              <table className="w-full bg-white">
                <thead>
                  <tr className="sticky top-0 bg-gray-100 rounded">
                    <th className="py-2 px-4 text-start border-b">No</th>
                    <th
                      onClick={() => handleSort("searchKeyword")}
                      className="py-2 px-4 text-start cursor-pointer border-b-2"
                    >
                      Keyword
                      <span className="ml-1">
                        {getSortIndicator("searchKeyword")}
                      </span>
                    </th>
                    <th
                      onClick={() => handleSort("insightsValue.value")}
                      className="py-2 px-4 text-center cursor-pointer border-b"
                    >
                      Search Volume
                      <span className="ml-1">
                        {getSortIndicator("insightsValue.value")}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {searchInsights.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-4 text-start">{index + 1}</td>
                      <td className="py-2 px-4 text-start">
                        {item.searchKeyword}
                      </td>
                      <td className="py-2 px-4 text-center">
                        {item.insightsValue.value !== undefined
                          ? item.insightsValue.value
                          : item.insightsValue.threshold}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            <div className="flex flex-col justify-center items-center py-4">
              <div className="w-44 h-44 bg-cover bg-center bg-no-access"></div>
              <p>You don’t have access to this section</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default KeywordsAnalytics;
