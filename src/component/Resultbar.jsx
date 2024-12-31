import React, { useState } from "react";
import { Virtuoso } from "react-virtuoso";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { FaStar } from "react-icons/fa6";

const ResultBar = ({
  groupedResults,
  companyList,
  expandedCompanies,
  toggleCompany,
}) => {
  const [visibleShops, setVisibleShops] = useState({});

  const handleLoadMore = (company) => {
    setVisibleShops((prev) => ({
      ...prev,
      [company]: (prev[company] || 3) + 3,
    }));
  };

  return (
    <div className="w-80 absolute top-24 right-5 flex flex-col h-5/6 bg-white z-20 shadow-md rounded-lg transition-transform duration-300 ease-in-out">
      <div className="p-4 h-full flex flex-col">
        <div className="flex-1 overflow-hidden">
          {companyList.length === 0 ? (
            <p className="text-center text-gray-500">Result not found</p>
          ) : (
            <Virtuoso
              style={{ height: "100%", width: "100%" }}
              totalCount={companyList.length}
              itemContent={(index) => {
                const company = companyList[index];
                const shops = groupedResults[company];
                const isExpanded = expandedCompanies[company] || false;

                const visibleCount = visibleShops[company] || 3;

                return (
                  <div key={company} className="mb-4">
                    <button
                      className="w-full flex justify-between items-center px-4 py-2 rounded border"
                      onClick={() => toggleCompany(company)}
                    >
                      <span className="text-lg font-medium text-gray-800">
                        {company}
                      </span>
                      {isExpanded ? (
                        <IoIosArrowUp size={20} />
                      ) : (
                        <IoIosArrowDown size={20} />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-4 space-y-2">
                        {shops.slice(0, visibleCount).map((shop) => (
                          <div
                            key={shop.properties.shop_id}
                            className="flex justify-between items-center px-4 py-2 bg-white shadow-sm rounded"
                          >
                            <div>
                              <h3 className="text-sm font-normal text-gray-700">
                                {shop.properties.shopName}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {shop.properties.postcode}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1 text-gray-700 text-xs">
                              <FaStar className="text-yellow-400" />
                              <span>{shop.properties.rating}</span>
                              <span>({shop.properties.totalReviews})</span>
                            </div>
                          </div>
                        ))}

                        {shops.length > visibleCount && (
                          <button
                            className="w-full text-sm text-blue-500 mt-2 hover:underline"
                            onClick={() => handleLoadMore(company)}
                          >
                            Load more...
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultBar;
