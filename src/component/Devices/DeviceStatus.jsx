import { useEffect, useState } from "react";
import { IoIosArrowRoundBack, IoIosArrowRoundForward } from "react-icons/io";
import { GoDotFill } from "react-icons/go";
import instance from "../../api/deviceApi";
import CountUp from "react-countup";
import { ThreeDots } from "react-loader-spinner";
import { MdKeyboardDoubleArrowLeft } from "react-icons/md";
import EmptyState from "../EmptyState";

const companyBg = {
  mealzo: "bg-mealzo-check-devices",
  justeat: "bg-justeat-check-devices",
  feedmeonline: "bg-feedmeonline-check-devices",
  foodhub: "bg-foodhub-check-devices",
};

const DEBOUNCE_MS = 1000; // typing pause before auto search

const DeviceStatus = ({ isOpen }) => {
  const [totalStatus, setTotalStatus] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    instance
      .get("/count")
      .then((response) => setTotalStatus(response.data))
      .catch(() => {});
  }, [isOpen]);

  const [data, setData] = useState([]);
  const [searchData, setSearchData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("id");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);

  const [filters, setFilters] = useState({
    mealzo: null,
    justeat: null,
    feedmeonline: null,
    foodhub: null,
  });

  const companyOrder = ["mealzo", "justeat", "feedmeonline", "foodhub"];
  const companyLabel = {
    mealzo: "Mealzo",
    justeat: "Just Eat",
    feedmeonline: "Feed Me Online",
    foodhub: "Food Hub",
  };

  const isFilterActive = Object.values(filters).some((v) => v !== null);
  const visibleCompanies = isFilterActive
    ? companyOrder.filter((k) => filters[k] !== null)
    : companyOrder;

  // toggle helper — clicking the active button again sets it to null
  const toggleFilter = (company, nextValue /* true | false */) => {
    setFilters((prev) => ({
      ...prev,
      [company]: prev[company] === nextValue ? null : nextValue,
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      mealzo: null,
      justeat: null,
      feedmeonline: null,
      foodhub: null,
    });
  };

  const buildStatusUrl = ({ page, term, type, activeSearch, filtersObj }) => {
    const params = new URLSearchParams();
    params.set("page", String(page ?? 1));

    if (activeSearch && term) {
      if (type === "name") params.set("mealzoName", term);
      else if (type === "id") params.set("mealzoId", term);
    }

    Object.entries(filtersObj || {}).forEach(([k, v]) => {
      if (v !== null) params.set(k, v ? "true" : "false");
    });

    return `/status?${params.toString()}`;
  };

  const fetchData = async (page) => {
    setLoading(true);
    try {
      const url = buildStatusUrl({
        page,
        activeSearch: false,
        filtersObj: filters,
      });
      const response = await instance.get(url);
      setData(response.data.results);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSearchData = async (term = "", type = "name", page = 1) => {
    setLoading(true);
    try {
      const url = buildStatusUrl({
        page,
        term,
        type,
        activeSearch: true,
        filtersObj: filters,
      });
      const response = await instance.get(url);
      setSearchData(response.data.results);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);
      setIsSearchActive(true);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // main data loader when page/filters/search-mode changes
  useEffect(() => {
    if (!isSearchActive) {
      fetchData(currentPage);
    } else {
      fetchSearchData(searchTerm, searchType, currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, isSearchActive, filters]);

  // NEW: automatic (debounced) search when typing or switching ID/Name
  useEffect(() => {
    const term = (searchTerm ?? "").toString().trim();

    // If input cleared: exit search mode and refresh normal list
    if (!term) {
      setIsSearchActive(false);
      setSearchData([]);
      fetchData(1);
      setCurrentPage(1);
      setPageInput("1");
      return;
    }

    const t = setTimeout(() => {
      setCurrentPage(1);
      setPageInput("1");
      fetchSearchData(term, searchType, 1);
    }, DEBOUNCE_MS);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, searchType]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setPageInput(newPage.toString());
      if (isSearchActive) {
        fetchSearchData(searchTerm, searchType, newPage);
      } else {
        fetchData(newPage);
      }
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const handleInputChange = (e) => {
    setPageInput(e.target.value);
  };

  const handlePageSubmit = () => {
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      if (isSearchActive) {
        fetchSearchData(searchTerm, searchType, page);
      } else {
        fetchData(page);
      }
    } else {
      setPageInput(currentPage.toString());
    }
  };

  // keep handlers but we no longer need a button press
  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    setPageInput("1");
  };
  const handleSearchTypeChange = (e) => {
    setSearchType(e.target.value);
    setCurrentPage(1);
    setPageInput("1");
  };

  const showSearchResult =
    isSearchActive && String(searchTerm).trim().length > 0;

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchData([]);
    setIsSearchActive(false);
    setCurrentPage(1);
    setPageInput("1");
    fetchData(1);
  };

  const handleNextPage = () => {
    const nextPage = currentPage + 1;
    if (nextPage <= totalPages) {
      setCurrentPage(nextPage);
      setPageInput(nextPage.toString());
      if (isSearchActive) {
        fetchSearchData(searchTerm, searchType, nextPage);
      } else {
        fetchData(nextPage);
      }
    }
  };

  const handlePreviousPage = () => {
    const prevPage = currentPage - 1;
    if (prevPage >= 1) {
      setCurrentPage(prevPage);
      setPageInput(prevPage.toString());
      if (isSearchActive) {
        fetchSearchData(searchTerm, searchType, prevPage);
      } else {
        fetchData(prevPage);
      }
    }
  };

  const tableData = isSearchActive ? searchData : data;

  return (
    <div
      className={`max-w-screen w-[calc(100%-80px)] p-6 absolute top-0 left-20 flex flex-col h-full overflow-y-auto bg-white z-40 transition-transform duration-700 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="mx-4 flex justify-between items-center">
        <span className="text-2xl font-bold">Devices Status</span>
      </div>

      <div className="grid grid-cols-8 gap-4 py-6">
        {/* Top four summary cards */}
        <div className="col-span-2 row-span-3 p-4 border rounded-xl shadow-lg">
          <div className="flex items-center gap-4">
            <div className="bg-cover bg-mealzo-devices w-20 h-20"></div>
            <div className="flex flex-col justify-between">
              <span className="text-xl font-normal">Mealzo</span>
              <span className="text-sm text-gray-400 font-normal">
                {totalStatus.mealzo?.last_time}
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-2/3 text-2xl font-normal">
              <CountUp start={0} end={totalStatus.mealzo?.total} duration={5} />
            </div>
            <div className="w-1/3 flex gap-2 justify-end">
              <div className="flex bg-green-100 text-green-700 px-4 py-1 rounded-full items-center gap-1">
                <GoDotFill />
                <span className="text-sm">On</span>
                <div className="text-xs">
                  (
                  <CountUp
                    start={0}
                    end={totalStatus.mealzo?.on}
                    duration={5}
                  />
                  )
                </div>
              </div>
              <div className="flex bg-red-100 text-red-700 px-4 py-1 rounded-full items-center gap-1">
                <GoDotFill />
                <span className="text-sm">Off</span>
                <div className="text-xs">
                  (
                  <CountUp
                    start={0}
                    end={totalStatus.mealzo?.off}
                    duration={5}
                  />
                  )
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-2 row-span-3 col-start-3 p-4 border rounded-xl shadow-lg">
          <div className="flex items-center gap-4">
            <div className="bg-cover bg-justeat-devices w-20 h-20"></div>
            <div className="flex flex-col justify-between">
              <span className="text-xl font-normal">Just Eat</span>
              <span className="text-sm text-gray-400 font-normal">
                {totalStatus.justeat?.last_time}
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-2/3 text-2xl font-normal">
              <CountUp
                start={0}
                end={totalStatus.justeat?.total}
                duration={5}
              />
            </div>
            <div className="w-1/3 flex gap-2 justify-end">
              <div className="flex bg-green-100 text-green-700 px-4 py-1 rounded-full items-center gap-1">
                <GoDotFill />
                <span className="text-sm">On</span>
                <div className="text-xs">
                  (
                  <CountUp
                    start={0}
                    end={totalStatus.justeat?.on}
                    duration={5}
                  />
                  )
                </div>
              </div>
              <div className="flex bg-red-100 text-red-700 px-4 py-1 rounded-full items-center gap-1">
                <GoDotFill />
                <span className="text-sm">Off</span>
                <div className="text-xs">
                  (
                  <CountUp
                    start={0}
                    end={totalStatus.justeat?.off}
                    duration={5}
                  />
                  )
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-2 row-span-3 col-start-5 p-4 border rounded-xl shadow-lg">
          <div className="flex items-center gap-4">
            <div className="bg-cover bg-feedmeonline-devices w-20 h-20"></div>
            <div className="flex flex-col justify-between">
              <span className="text-xl font-normal">Feed Me Online</span>
              <span className="text-sm text-gray-400 font-normal">
                {totalStatus.feedmeonline?.last_time}
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-2/3 text-2xl font-normal">
              <CountUp
                start={0}
                end={totalStatus.feedmeonline?.total}
                duration={5}
              />
            </div>
            <div className="w-1/3 flex gap-2 justify-end">
              <div className="flex bg-green-100 text-green-700 px-4 py-1 rounded-full items-center gap-1">
                <GoDotFill />
                <span className="text-sm">On</span>
                <div className="text-xs">
                  (
                  <CountUp
                    start={0}
                    end={totalStatus.feedmeonline?.on}
                    duration={5}
                  />
                  )
                </div>
              </div>
              <div className="flex bg-red-100 text-red-700 px-4 py-1 rounded-full items-center gap-1">
                <GoDotFill />
                <span className="text-sm">Off</span>
                <div className="text-xs">
                  (
                  <CountUp
                    start={0}
                    end={totalStatus.feedmeonline?.off}
                    duration={5}
                  />
                  )
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-2 row-span-3 col-start-7 p-4 border rounded-xl shadow-lg">
          <div className="flex items-center gap-4">
            <div className="bg-cover bg-foodhub-devices w-20 h-20"></div>
            <div className="flex flex-col justify-between">
              <span className="text-xl font-normal">FoodHub</span>
              <span className="text-sm text-gray-400 font-normal">
                {totalStatus.foodhub?.last_time}
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-2/3 text-2xl font-normal">
              <CountUp
                start={0}
                end={totalStatus.foodhub?.total}
                duration={5}
              />
            </div>
            <div className="w-1/3 flex gap-2 justify-end">
              <div className="flex bg-green-100 text-green-700 px-4 py-1 rounded-full items-center gap-1">
                <GoDotFill />
                <span className="text-sm">On</span>
                <div className="text-xs">
                  (
                  <CountUp
                    start={0}
                    end={totalStatus.foodhub?.on}
                    duration={5}
                  />
                  )
                </div>
              </div>
              <div className="flex bg-red-100 text-red-700 px-4 py-1 rounded-full items-center gap-1">
                <GoDotFill />
                <span className="text-sm">Off</span>
                <div className="text-xs">
                  (
                  <CountUp
                    start={0}
                    end={totalStatus.foodhub?.off}
                    duration={5}
                  />
                  )
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="col-span-2 row-span-2 row-start-4">
          <div className="mb-2 flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="id"
                checked={searchType === "id"}
                onChange={handleSearchTypeChange}
                className="mr-2 form-radio text-orange-500 focus:ring-orange-500"
              />
              By Shop ID
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="name"
                checked={searchType === "name"}
                onChange={handleSearchTypeChange}
                className="mr-2 form-radio text-orange-500 focus:ring-orange-500"
              />
              By Shop Name
            </label>
          </div>
          <div className="mb-4 flex">
            <input
              placeholder={`Search by ${
                searchType === "name" ? "Shop Name" : "Shop ID"
              }...`}
              value={searchTerm}
              type={searchType === "name" ? "text" : "number"}
              onChange={handleSearchTermChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          {showSearchResult && (
            <div className="flex space-x-4">
              <p>
                {searchData.length} Results found for " {searchTerm} "
              </p>
              <button
                onClick={handleClearSearch}
                className="text-orange-500 hover:text-orange-800"
              >
                remove
              </button>
            </div>
          )}
        </div>

        {/* Company Filters UI */}
        <div className="col-span-8 row-start-6 flex items-start">
          <div className="mt-2 flex items-center gap-3">
            {[
              { key: "mealzo", label: "Mealzo" },
              { key: "justeat", label: "Just Eat" },
              { key: "feedmeonline", label: "Feed Me Online" },
              { key: "foodhub", label: "FoodHub" },
            ].map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center gap-2 bg-white border rounded-lg px-2 py-1 shadow-sm"
              >
                <div className={`bg-cover ${companyBg[key]} w-8 h-8`} />
                <span className="text-sm">{label}</span>

                <button
                  className={`text-xs px-2 py-1 rounded-md border ${
                    filters[key] === true
                      ? "bg-green-600 text-white border-green-600"
                      : "border-gray-300 text-gray-700"
                  }`}
                  onClick={() => toggleFilter(key, true)}
                  title="On"
                  aria-pressed={filters[key] === true}
                >
                  On
                </button>

                <button
                  className={`text-xs px-2 py-1 rounded-md border ${
                    filters[key] === false
                      ? "bg-red-600 text-white border-red-600"
                      : "border-gray-300 text-gray-700"
                  }`}
                  onClick={() => toggleFilter(key, false)}
                  title="Off"
                  aria-pressed={filters[key] === false}
                >
                  Off
                </button>
              </div>
            ))}

            {isFilterActive && (
              <button
                onClick={clearAllFilters}
                className="flex gap-2 items-center p-2 rounded-lg border text-sm text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="col-span-8 row-span-5 row-start-7 flex flex-col items-center gap-4">
          <table className="min-w-full bg-white rounded-lg shadow-md">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 tracking-wider text-center rounded-tl-lg">
                  Mealzo ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 tracking-wider">
                  Mealzo Name
                </th>

                {visibleCompanies.map((key, idx) => (
                  <th
                    key={key}
                    className={`w-40 px-6 py-3 text-left text-sm font-semibold text-gray-700 tracking-wider text-center ${
                      idx === visibleCompanies.length - 1 ? "rounded-tr-lg" : ""
                    }`}
                  >
                    {companyLabel[key]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="relative divide-y divide-gray-200 min-h-[200px]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="h-80">
                    <div className="flex items-center justify-center h-full">
                      <ThreeDots
                        visible={true}
                        height="50"
                        width="50"
                        color="#ffa500"
                        radius="9"
                        ariaLabel="three-dots-loading"
                      />
                    </div>
                  </td>
                </tr>
              ) : tableData.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <EmptyState
                      state="bg-empty-state-table"
                      message="No results matching"
                      className="h-80"
                    />
                  </td>
                </tr>
              ) : (
                tableData.map((item) => (
                  <tr key={item.mealzoId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {item.mealzoId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.mealzoName}
                    </td>

                    {/* Mealzo */}
                    {item.companies.mealzo && (
                      <td className="w-20 text-sm text-gray-900">
                        {item.companies.mealzo?.deviceAvailability === true ? (
                          item.companies.mealzo.data.isOpen === true ? (
                            <div className="flex bg-green-100 text-green-700 p-1 rounded-full items-center justify-center">
                              <GoDotFill />
                              <span>On</span>
                            </div>
                          ) : (
                            <div className="flex bg-red-100 text-red-700 p-1 rounded-full items-center justify-center">
                              <GoDotFill />
                              <span>Off</span>
                            </div>
                          )
                        ) : (
                          <div className="flex bg-gray-100 text-gray-700 p-1 rounded-full items-center justify-center">
                            <GoDotFill />
                            <span>No device</span>
                          </div>
                        )}
                      </td>
                    )}

                    {/* Just Eat */}
                    {item.companies.justeat && (
                      <td className="w-20 text-sm text-gray-900">
                        {item.companies.justeat.deviceAvailability === true ? (
                          item.companies.justeat.data.isOpen === true ? (
                            <div className="flex bg-green-100 text-green-700 p-1 rounded-full items-center justify-center">
                              <GoDotFill />
                              <span>On</span>
                            </div>
                          ) : (
                            <div className="flex bg-red-100 text-red-700 p-1 rounded-full items-center justify-center">
                              <GoDotFill />
                              <span>Off</span>
                            </div>
                          )
                        ) : (
                          <div className="flex bg-gray-100 text-gray-700 p-1 rounded-full items-center justify-center">
                            <GoDotFill />
                            <span>No device</span>
                          </div>
                        )}
                      </td>
                    )}

                    {/* Feed Me Online */}
                    {item.companies.feedmeonline && (
                      <td className="w-20 text-sm text-gray-900">
                        {item.companies.feedmeonline.deviceAvailability ===
                        true ? (
                          item.companies.feedmeonline.data.isOpen === true ? (
                            <div className="flex bg-green-100 text-green-700 p-1 rounded-full items-center justify-center">
                              <GoDotFill />
                              <span>On</span>
                            </div>
                          ) : (
                            <div className="flex bg-red-100 text-red-700 p-1 rounded-full items-center justify-center">
                              <GoDotFill />
                              <span>Off</span>
                            </div>
                          )
                        ) : (
                          <div className="flex bg-gray-100 text-gray-700 p-1 rounded-full items-center justify-center">
                            <GoDotFill />
                            <span>No device</span>
                          </div>
                        )}
                      </td>
                    )}

                    {/* FoodHub */}
                    {item.companies.foodhub && (
                      <td className="w-20 text-sm text-gray-900">
                        {item.companies.foodhub.deviceAvailability === true ? (
                          item.companies.foodhub.data.isOpen === true ? (
                            <div className="flex bg-green-100 text-green-700 p-1 rounded-full items-center justify-center">
                              <GoDotFill />
                              <span>On</span>
                            </div>
                          ) : (
                            <div className="flex bg-red-100 text-red-700 p-1 rounded-full items-center justify-center">
                              <GoDotFill />
                              <span>Off</span>
                            </div>
                          )
                        ) : (
                          <div className="flex bg-gray-100 text-gray-700 p-1 rounded-full items-center justify-center">
                            <GoDotFill />
                            <span>No device</span>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="w-full flex items-center justify-between">
            {currentPage > 2 ? (
              <button
                className="flex items-center p-2 text-orange-600 rounded-lg hover:text-orange-700 focus:outline-none"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                <MdKeyboardDoubleArrowLeft size={20} />
                <span>Go to Page 1</span>
              </button>
            ) : (
              <div className="flex items-center p-2 text-gray-400 rounded-lg focus:outline-none">
                <MdKeyboardDoubleArrowLeft size={20} />
                <span>Go to Page 1</span>
              </div>
            )}

            <div className="flex gap-2">
              {currentPage > 1 && (
                <button
                  className="p-2 border-2 border-orange-600 text-white rounded-lg hover:border-orange-700 focus:outline-none flex items-center gap-1"
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
                  if (e.key === "Enter" || e.key === "NumpadEnter") {
                    e.target.blur();
                    handlePageSubmit();
                  }
                }}
                className="w-12 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-center"
              />
              <span className="text-gray-700">of {totalPages}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceStatus;
