import React, { useEffect, useState } from "react";
import {
  IoIosArrowBack,
  IoIosArrowRoundBack,
  IoIosArrowRoundForward,
} from "react-icons/io";
import { GoDotFill } from "react-icons/go";
import instance from "./statusApi";
import CountUp from "react-countup";
import { ThreeDots } from "react-loader-spinner";
import { MdKeyboardDoubleArrowLeft } from "react-icons/md";

const DeviceStatus = ({ isOpen, setIsDeviceOpen }) => {
  const [totalStatus, setTotalStatus] = useState([]);
  useEffect(() => {
    isOpen &&
      instance
        .get("/count")
        .then((response) => {
          console.log(response.data);
          setTotalStatus(response.data);
        })
        .catch();
  }, [isOpen]);

  const [data, setData] = useState([]);
  const [searchData, setSearchData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);

  useEffect(() => {
    if (!isSearchActive) {
      fetchData(currentPage);
    }
  }, [currentPage, isSearchActive]);

  const fetchData = async (page) => {
    setLoading(true);
    try {
      const response = await instance.get(`/status?page=${page}`);
      console.log(response.data.results);

      setData(response.data.results);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setPageInput(newPage.toString());
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
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const fetchSearchData = async (term = "", type = "name") => {
    setLoading(true);
    try {
      let url = "";
      if (type === "name") {
        url = `/status?mealzoName=${term}`;
      } else if (type === "id") {
        url = `/status?mealzoId=${term}`;
      }

      const response = await instance.get(url);
      console.log(response.data);
      setSearchData(response.data.results);
      setIsSearchActive(true);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchTypeChange = (e) => {
    setSearchType(e.target.value);
  };

  const handleSearchClick = () => {
    if (searchTerm) {
      fetchSearchData(searchTerm, searchType);
    } else {
      setSearchData([]);
      setIsSearchActive(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchData([]);
    setIsSearchActive(false);
    fetchData(currentPage);
  };

  const tableData = isSearchActive ? searchData : data;

  return (
    <div
      className={`max-w-screen w-[calc(100%-80px)] p-6 absolute top-0 left-20 flex flex-col h-full overflow-y-auto bg-white z-40 transition-transform duration-700 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="mx-4 flex p justify-between items-center">
        <span className="text-2xl font-bold">Devices Status</span>
        <button
          className="w-8 p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none"
          onClick={() => setIsDeviceOpen(false)}
        >
          <IoIosArrowBack />
        </button>
      </div>
      <div className="grid grid-cols-6 gap-4 py-6">
        <div className="col-span-2 row-span-3 p-4 border rounded-xl shadow-lg">
          <div className="flex items-center gap-4">
            <div className="my-2 bg-cover bg-total-shops w-12 h-12"></div>
            <span className="text-xl font-normal">Total Shops</span>
          </div>
          <div className="text-4xl font-normal">
            <CountUp start={0} end={totalStatus.all_count} duration={5} />
          </div>
        </div>
        <div className="col-span-2 row-span-3 col-start-3 p-4 border rounded-xl shadow-lg">
          <div className="flex items-center gap-4">
            <div className="my-2 bg-cover bg-total-on-devices w-12 h-12"></div>
            <span className="text-xl font-normal">Total On Devices</span>
          </div>
          <div className="text-4xl font-normal">
            <CountUp start={0} end={totalStatus.all_on} duration={5} />
          </div>
        </div>
        <div className="col-span-2 row-span-3 col-start-5 p-4 border rounded-xl shadow-lg">
          <div className="flex items-center gap-4">
            <div className="my-2 bg-cover bg-total-off-devices w-12 h-12"></div>
            <span className="text-xl font-normal">Total Off Devices</span>
          </div>
          <div className="text-4xl font-normal">
            <CountUp start={0} end={totalStatus.all_off} duration={5} />
          </div>
        </div>
        <div className="col-span-2 row-span-3 row-start-4 p-4 border rounded-xl shadow-lg">
          <div className="flex items-center gap-4">
            <div className="my-2 bg-cover bg-justeat-devices w-12 h-12"></div>
            <div className="flex flex-col justify-between">
              <span className="text-xl font-normal">Just Eat Devices</span>
              <span className="text-sm text-gray-400 font-normal">
                {totalStatus.justeat?.last_time}
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-2/3 text-4xl font-normal">
              <CountUp
                start={0}
                end={totalStatus.justeat?.total}
                duration={5}
              />
            </div>
            <div className="w-1/3 flex gap-2 justify-end">
              <div className="flex bg-green-100 text-green-700 px-4 py-1 rounded-full items-center gap-1">
                <GoDotFill />
                <span>On</span>
                <div>
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
                <span>Off</span>
                <div>
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
        <div className="col-span-2 row-span-3 col-start-3 row-start-4 p-4 border rounded-xl shadow-lg">
          <div className="flex items-center gap-4">
            <div className="my-2 bg-cover bg-ubereats-devices w-12 h-12"></div>
            <div className="flex flex-col justify-between">
              <span className="text-xl font-normal">Uber Eats Devices</span>
              <span className="text-sm text-gray-400 font-normal">
                {totalStatus.ubereats?.last_time}
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-2/3 text-4xl font-normal">
              <CountUp
                start={0}
                end={totalStatus.ubereats?.total}
                duration={5}
              />
            </div>
            <div className="w-1/3 flex gap-2 justify-end">
              <div className="flex bg-green-100 text-green-700 px-4 py-1 rounded-full items-center gap-1">
                <GoDotFill />
                <span>On</span>
                <div>
                  (
                  <CountUp
                    start={0}
                    end={totalStatus.ubereats?.on}
                    duration={5}
                  />
                  )
                </div>
              </div>
              <div className="flex bg-red-100 text-red-700 px-4 py-1 rounded-full items-center gap-1">
                <GoDotFill />
                <span>Off</span>
                <div>
                  (
                  <CountUp
                    start={0}
                    end={totalStatus.ubereats?.off}
                    duration={5}
                  />
                  )
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-span-2 row-span-3 col-start-5 row-start-4 p-4 border rounded-xl shadow-lg">
          <div className="flex items-center gap-4">
            <div className="my-2 bg-cover bg-foodhub-devices w-12 h-12"></div>
            <div className="flex flex-col justify-between">
              <span className="text-xl font-normal">FoodHub Devices</span>
              <span className="text-sm text-gray-400 font-normal">
                {totalStatus.foodhub?.last_time}
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-2/3 text-4xl font-normal">
              <CountUp
                start={0}
                end={totalStatus.foodhub?.total}
                duration={5}
              />
            </div>
            <div className="w-1/3 flex gap-2 justify-end">
              <div className="flex bg-green-100 text-green-700 px-4 py-1 rounded-full items-center gap-1">
                <GoDotFill />
                <span>On</span>
                <div>
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
                <span>Off</span>
                <div>
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
        <div className="col-span-2 row-span-2 row-start-7">
          <div className="mb-2 flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="name"
                checked={searchType === "name"}
                onChange={handleSearchTypeChange}
                className="mr-2 w-4 h-4 accent-orange-400"
              />
              By Shop Name
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="id"
                checked={searchType === "id"}
                onChange={handleSearchTypeChange}
                className="mr-2 w-4 h-4 accent-orange-400"
              />
              By Shop ID
            </label>
          </div>
          <div className="mb-4 flex">
            <input
              type="text"
              placeholder={`Search by ${searchType === "name" ? "Shop Name" : "Shop ID"}...`}
              value={searchTerm}
              onChange={handleSearchTermChange}
              className="w-full p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchClick();
                }
              }}
            />
            <button
              onClick={handleSearchClick}
              className="px-6 bg-orange-600 text-white rounded-r-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              Search
            </button>
          </div>
          {isSearchActive && (
            <div className="flex space-x-4">
              <p>
                {searchData.length} Results found for "{searchTerm}"
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
        <div className="col-span-6 row-span-5 row-start-9 flex flex-col items-center gap-4">
          <table className="min-w-full bg-white rounded-lg shadow-md">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 tracking-wider text-center rounded-tl-lg">
                  Mealzo ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 tracking-wider">
                  Mealzo Name
                </th>
                <th className="w-40 px-6 py-3 text-left text-sm font-semibold text-gray-700 tracking-wider text-center">
                  Just Eat
                </th>
                <th className="w-40 px-6 py-3 text-left text-sm font-semibold text-gray-700 tracking-wider text-center">
                  Uber Eats
                </th>
                <th className="w-40 px-6 py-3 text-left text-sm font-semibold text-gray-700 tracking-wider text-center rounded-tr-lg">
                  Food Hub
                </th>
              </tr>
            </thead>
            <tbody className="relative divide-y divide-gray-200 min-h-[200px]">
              {loading === true ? (
                <tr>
                  <td colSpan="5" className="h-80">
                    <div className="flex items-center justify-center h-full">
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
              ) : tableData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="h-80">
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                      <div className="w-44 h-44 bg-cover bg-no-result"></div>
                      <p>No Results Matching</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tableData.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {item.mealzoId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.mealzoName}
                    </td>
                    <td className="w-20 text-sm text-gray-900">
                      {item.companies.justeat ? (
                        item.companies.justeat.isOpen === true ? (
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
                    <td className="w-20 text-sm text-gray-900">
                      {item.companies.ubereats ? (
                        item.companies.ubereats.isOpen === true ? (
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
                    <td className="w-20 text-sm text-gray-900">
                      {item.companies.foodhub ? (
                        item.companies.foodhub.isOpen === true ? (
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
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!isSearchActive && (
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
                    className="p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none flex items-center gap-1"
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    <IoIosArrowRoundBack size={25} />
                  </button>
                )}

                {currentPage !== totalPages && (
                  <button
                    className="flex p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none"
                    onClick={() => handlePageChange(currentPage + 1)}
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
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handlePageSubmit();
                    }
                  }}
                  className="w-12 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-center"
                />
                <span className="text-gray-700">of {totalPages}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceStatus;
