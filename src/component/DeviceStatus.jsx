import React, { useEffect, useState } from "react";
import { IoIosArrowBack } from "react-icons/io";
import { GoDotFill } from "react-icons/go";
import instance from "./statusApi";
import CountUp from "react-countup";

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
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const fetchData = async (page) => {
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
  console.log(data);
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
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
      setSearchData(response.data); // Set search results
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle search type change (radio button)
  const handleSearchTypeChange = (e) => {
    setSearchType(e.target.value);
  };

  // Handle search button click
  const handleSearchClick = () => {
    if (searchTerm) {
      fetchSearchData(searchTerm, searchType); // Trigger search with term and type
    } else {
      setSearchData([]); // Clear search results if the term is empty
    }
  };

  // Data to display in the table
  const tableData = searchTerm ? searchData : data;
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
          <div className="mb-4 flex space-x-4">
            <input
              type="text"
              placeholder={`Search by ${searchType === "name" ? "Shop Name" : "Shop ID"}...`}
              value={searchTerm}
              onChange={handleSearchTermChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearchClick}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </div>

          {/* Radio Buttons for Search Type */}
          <div className="mb-4 flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="name"
                checked={searchType === "name"}
                onChange={handleSearchTypeChange}
                className="mr-2"
              />
              By Shop Name
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="id"
                checked={searchType === "id"}
                onChange={handleSearchTypeChange}
                className="mr-2"
              />
              By Shop ID
            </label>
          </div>
        </div>
        <div className="col-span-6 row-span-5 row-start-10 flex flex-col items-center gap-4">
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
            <tbody className="divide-y divide-gray-200">
              {data.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                    {item.mealzoId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.mealzoName}
                  </td>
                  <td className="w-20 text-sm text-gray-900">
                    {item.companies.justeat?.isOpen === true ? (
                      <div className="flex bg-green-100 text-green-700 p-1 rounded-full items-center justify-center">
                        <GoDotFill />
                        <span>On</span>
                      </div>
                    ) : (
                      <div className="flex bg-red-100 text-red-700 p-1 rounded-full items-center justify-center">
                        <GoDotFill />
                        <span>Off</span>
                      </div>
                    )}
                  </td>
                  <td className="w-20 text-sm text-gray-900">
                    {item.companies.ubereats?.isOpen === true ? (
                      <div className="flex bg-green-100 text-green-700 p-1 rounded-full items-center justify-center">
                        <GoDotFill />
                        <span>On</span>
                      </div>
                    ) : (
                      <div className="flex bg-red-100 text-red-700 p-1 rounded-full items-center justify-center">
                        <GoDotFill />
                        <span>Off</span>
                      </div>
                    )}
                  </td>
                  <td className="w-20 text-sm text-gray-900">
                    {item.companies?.foodhub?.isOpen === true ? (
                      <div className="flex bg-green-100 text-green-700 p-1 rounded-full items-center justify-center">
                        <GoDotFill />
                        <span>On</span>
                      </div>
                    ) : (
                      <div className="flex bg-red-100 text-red-700 p-1 rounded-full items-center justify-center">
                        <GoDotFill />
                        <span>Off</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-2">
            <button
              className="p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className=" p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceStatus;
