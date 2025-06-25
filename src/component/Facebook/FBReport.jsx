import { useEffect, useState } from "react";
import { IoIosArrowRoundBack, IoIosArrowRoundForward } from "react-icons/io";
import CountUp from "react-countup";
import { ThreeDots } from "react-loader-spinner";
import { MdKeyboardDoubleArrowLeft } from "react-icons/md";
import instanceF from "../../api/facebookApi";
import { Link } from "react-router-dom";

const FBReport = ({ isOpen }) => {
  const [AccountPagesCount, setAccountPagesCount] = useState([]);
  const [data, setData] = useState([]);
  const [searchResultCount, setSearchResultCount] = useState(0);
  const [searchData, setSearchData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Fetch data when currentPage or search toggle changes
  useEffect(() => {
    if (!isSearchActive) {
      fetchData(currentPage);
    }
  }, [currentPage, isSearchActive]);

  //get access token from session storage
  const accessToken = sessionStorage.getItem("accessToken");

  // Fetch paginated report data
  const fetchData = async (page) => {
    setLoading(true);
    try {
      const response = await instanceF.get(`/fb-report-table?page=${page}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      // console.log("facebook report pageData", response.data);
      setData(response.data.results);

      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update single item metrics and refresh data
  const updateItem = async (item) => {
    setLoading(true);
    try {
      const response = await instanceF.get(
        `/update-fb-report-metric/${item.page_last_post_id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      console.log("Updated item response:", response.data);
      if (isSearchActive) {
        fetchSearchData(searchTerm, currentPage);
      } else {
        fetchData(currentPage);
      }
    } catch (error) {
      console.error("Error updating item:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch overall account stats when report panel opens
  useEffect(() => {
    isOpen &&
      instanceF
        .get("/fb-count-page", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((response) => {
          // console.log(response.data);
          setAccountPagesCount(response.data);
        })
        .catch();
  }, [isOpen]);

  // Navigate to a specific page
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setPageInput(newPage.toString());
      if (isSearchActive) {
        fetchSearchData(searchTerm, newPage);
      } else {
        fetchData(newPage);
      }
    } else {
      setPageInput(currentPage.toString());
    }
  };

  // Handle manual page number input
  const handleInputChange = (e) => {
    setPageInput(e.target.value);
  };

  const handlePageSubmit = () => {
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      if (isSearchActive) {
        fetchSearchData(searchTerm, page);
      } else {
        fetchData(page);
      }
    } else {
      setPageInput(currentPage.toString());
    }
  };

  // Fetch search results by term and page
  const fetchSearchData = async (term = "", page = 1) => {
    setLoading(true);
    try {
      const response = await instanceF.get(
        `/fb-report-table/?page=${page}&search=${term}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      console.log(response.data);
      setSearchData(response.data.results);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);
      setSearchResultCount(response.data.totalSearchhItem);
      setIsSearchActive(true);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Search input handlers
  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchClick = () => {
    if (searchTerm) {
      fetchSearchData(searchTerm, 1);
    } else {
      setSearchData([]);
      setIsSearchActive(false);
    }
  };
  // Clear search results
  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchData([]);
    setIsSearchActive(false);
    fetchData(currentPage);
  };
  // Navigate to next page
  const handleNextPage = () => {
    const nextPage = currentPage + 1;
    if (nextPage <= totalPages) {
      setCurrentPage(nextPage);
      setPageInput(nextPage.toString());
      if (isSearchActive) {
        fetchSearchData(searchTerm, nextPage);
      } else {
        fetchData(nextPage);
      }
    }
  };
  // Navigate to previous page
  const handlePreviousPage = () => {
    const prevPage = currentPage - 1;
    if (prevPage >= 1) {
      setCurrentPage(prevPage);
      setPageInput(prevPage.toString());
      if (isSearchActive) {
        fetchSearchData(searchTerm, prevPage);
      } else {
        fetchData(prevPage);
      }
    }
  };
  // Determine which dataset to render
  const tableData = isSearchActive ? searchData : data;

  return (
    <div
      className={`max-w-screen w-[calc(100%-80px)] p-6 absolute top-0 left-20 flex flex-col h-full overflow-y-auto bg-stone-50 z-40 transition-transform duration-700 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="mx-4 flex p justify-between items-center">
        <span className="text-2xl font-bold">Facebook Report</span>
      </div>
      <div className="grid grid-cols-6 gap-4 py-6">
        <div className="col-span-2 row-span-3 p-4 border rounded-xl shadow-lg">
          <div className="flex items-center gap-4">
            <div className="my-2 bg-cover bg-total-shops w-12 h-12"></div>
            <span className="text-xl font-normal">Account Shops</span>
          </div>
          <div className="text-4xl font-normal">
            <CountUp
              start={0}
              end={AccountPagesCount.allCountPageHessam}
              duration={5}
            />
          </div>
        </div>
        {/* Search bar */}
        <div className="col-span-2 row-span-2 row-start-7">
          <div className="mb-4 flex">
            <input
              placeholder="Search Shop..."
              value={searchTerm}
              type="text"
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
              <p>{searchResultCount} Results found</p>
              <button
                onClick={handleClearSearch}
                className="text-orange-500 hover:text-orange-800"
              >
                remove
              </button>
            </div>
          )}
        </div>
        {/* Data table section */}
        <div className="col-span-6 row-span-5 row-start-9 flex flex-col items-center gap-4">
          <table className="min-w-full bg-white rounded-lg shadow-md">
            <thead className="bg-gray-100">
              <tr>
                <th className="w-24 py-3 text-center text-sm font-semibold text-gray-700 tracking-wider rounded-tl-lg"></th>
                <th className="w-52 py-3 text-center text-sm font-semibold text-gray-700 tracking-wider ">
                  Shop Name
                </th>
                <th className="w-32 py-3 text-center text-sm font-semibold text-gray-700 tracking-wider">
                  Create Date
                </th>
                <th className="w-24 py-3 text-center text-sm font-semibold text-gray-700 tracking-wider">
                  Reach
                </th>
                <th className="w-24 py-3 text-center text-sm font-semibold text-gray-700 tracking-wider">
                  Shares
                </th>

                <th className="w-44 py-3 text-center text-sm font-semibold text-gray-700 tracking-wider">
                  Average Watch Time
                </th>
                <th className="w-24 py-3 text-center text-sm font-semibold text-gray-700 tracking-wider">
                  Link Clicks
                </th>
                <th className="w-24 py-3 text-center text-sm font-semibold text-gray-700 tracking-wider">
                  Reactions
                </th>
                <th className="w-24 py-3 text-center text-sm font-semibold text-gray-700 tracking-wider rounded-tr-lg">
                  Comments
                </th>
              </tr>
            </thead>
            <tbody className="relative divide-y divide-gray-200 min-h-[200px]">
              {loading === true ? (
                <tr>
                  <td colSpan="10" className="h-80">
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
                  <td colSpan="10" className="h-80">
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                      <div className="w-44 h-44 bg-cover bg-no-result"></div>
                      <p>No Results Matching</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tableData.map((item, index) => (
                  <tr key={index}>
                    <td className="text-sm text-center">
                      <button
                        onClick={() => updateItem(item)}
                        className="w-8 h-8 bg-refresh-button bg-cover border border-green-400 rounded-lg border-2 text-blue-600 hover:text-blue-800 font-semibold"
                      ></button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-ellipsis">
                      <Link
                        to={`/facebook/${item.page_last_post_id}`}
                        target="_blank"
                        className="text-blue-500"
                      >
                        {item.page_name}
                      </Link>
                    </td>
                    <td className="text-sm text-center text-gray-900">
                      {item.page_last_post_created_time}
                    </td>
                    <td className="text-sm text-center text-gray-900">
                      {item.page_last_post_impressions_unique}
                    </td>
                    <td className="text-sm text-center text-gray-900">
                      {item.page_last_post_shares_count}
                    </td>
                    <td className="text-sm text-center text-gray-900">
                      {item.page_last_post_video_avg_watched}
                    </td>
                    <td className="text-sm text-center text-gray-900">
                      {item.page_last_post_link_clicks}
                    </td>
                    <td className="text-sm text-center text-gray-900">
                      {item.page_last_post_reactions_count}
                    </td>
                    <td className="text-sm text-center text-gray-900">
                      {item.page_last_post_comments_count}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Pagination controls */}
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
                  if (e.key === "Enter") {
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

export default FBReport;
