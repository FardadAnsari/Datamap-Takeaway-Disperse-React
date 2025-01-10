import React, { useMemo, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { FaStar } from "react-icons/fa6";

const ResultBar = ({
  groupedResults,
  companyList,
  expandedCompanies,
  toggleCompany,
  onMarkerFocus,
  activeMarker,
}) => {
  const [visibleCommonShops, setVisibleCommonShops] = useState(3);
  const [visibleShops, setVisibleShops] = useState({});
  const [activeTab, setActiveTab] = useState("byCompany"); // مقدار اولیه: 'byCompany'

  const handleShopClick = (shop) => {
    const coordinates = shop.geometry.coordinates;
    onMarkerFocus(coordinates, shop.properties.shop_id);
  };

  const findCommonShops = () => {
    const shopMap = new Map();
    Object.entries(groupedResults).forEach(([company, shops]) => {
      shops.forEach((shop) => {
        const key =
          `${shop.properties.shopName}-${shop.properties.postcode}`.toLowerCase();

        if (!shopMap.has(key)) {
          shopMap.set(key, { shop, companies: new Set([company]) });
        } else {
          shopMap.get(key).companies.add(company);
        }
      });
    });

    return Array.from(shopMap.values())
      .filter(({ companies }) => companies.size > 1)
      .map(({ shop, companies }) => ({
        ...shop,
        commonIn: Array.from(companies),
      }));
  };

  const commonShops = useMemo(() => findCommonShops(), [groupedResults]);

  const handleLoadMore = (company) => {
    setVisibleShops((prev) => ({
      ...prev,
      [company]: (prev[company] || 3) + 3,
    }));
  };

  const handleLoadMoreCommonShops = () => {
    setVisibleCommonShops((prev) => Math.min(prev + 3, commonShops.length));
  };

  return (
    <div className="w-96 absolute top-24 right-5 flex flex-col h-5/6 bg-white z-20 shadow-md rounded-lg transition-transform duration-300 ease-in-out">
      <div className="p-4 h-full flex flex-col">
        <div className="flex justify-center">
          <button
            className={`text-base font-medium px-5 py-2 rounded-l flex justify-between items-center ${
              activeTab === "byCompany"
                ? "bg-orange-200 text-orange-800"
                : "bg-orange-50 text-orange-700"
            }`}
            onClick={() => setActiveTab("byCompany")}
          >
            By Company ({companyList.length})
          </button>
          <button
            className={`text-base font-medium px-5 py-2 rounded-r flex justify-between items-center ${
              activeTab === "commonShops"
                ? "bg-orange-200 text-orange-800"
                : "bg-orange-50 text-orange-700"
            }`}
            onClick={() => setActiveTab("commonShops")}
          >
            Common Shops ({commonShops.length})
          </button>
        </div>

        {activeTab === "commonShops" &&
          (commonShops.length === 0 ? (
            <p className="text-center text-gray-500 mt-8">Result not found</p>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <Virtuoso
                style={{ height: "90%", width: "100%" }}
                totalCount={visibleCommonShops}
                itemContent={(index) => {
                  const shop = commonShops[index];
                  return (
                    <div
                      key={shop.properties.shop_id}
                      className="p-3 cursor-pointer border-b-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-medium text-gray-800">
                            {shop.properties.shopName}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {shop.properties.postcode}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {shop.commonIn.map((company) => (
                          <span
                            key={company}
                            className="px-2 py-1 text-xs bg-orange-50 rounded-full text-orange-700"
                          >
                            {company}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                }}
              />
              {commonShops.length > visibleCommonShops && (
                <button
                  className="w-full text-sm text-blue-500 mt-2 hover:underline"
                  onClick={handleLoadMoreCommonShops}
                >
                  Load more...
                </button>
              )}
            </div>
          ))}

        {activeTab === "byCompany" && (
          <div className="flex-1 overflow-hidden">
            {companyList.length === 0 ? (
              <p className="text-center text-gray-500 mt-8">Result not found</p>
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
                        className={`w-full flex justify-between items-center px-4 py-2 ${
                          isExpanded ? "rounded-t-lg" : "rounded-lg"
                        }  border`}
                        onClick={() => toggleCompany(company)}
                      >
                        <div className="flex justify-center items-center gap-2">
                          <span className="text-lg font-medium text-gray-800">
                            {company}
                          </span>
                          <span className="text-sm font-base text-gray-600">
                            ({shops.length})
                          </span>
                        </div>
                        {isExpanded ? (
                          <IoIosArrowUp size={20} />
                        ) : (
                          <IoIosArrowDown size={20} />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="border rounded-b-lg">
                          {shops.slice(0, visibleCount).map((shop) => (
                            <div
                              key={shop.properties.shop_id}
                              className={`flex flex-col gap-2 ... cursor-pointer border-b px-2 py-4 ${
                                activeMarker === shop.properties.shop_id
                                  ? "bg-orange-50"
                                  : ""
                              }`}
                              onClick={() => handleShopClick(shop)}
                            >
                              <div>
                                <p className="text-base font-bold text-gray-700">
                                  {shop.properties.shopName}
                                </p>
                              </div>
                              <div className="flex justify-between">
                                <div className="flex items-center space-x-1 text-gray-700 text-xs">
                                  {shop.properties.rating &&
                                    shop.properties.rating !== "None" && (
                                      <div className="flex gap-1">
                                        <FaStar className="text-yellow-400" />
                                        <span>{shop.properties.rating}</span>
                                      </div>
                                    )}
                                  {shop.properties.totalReviews &&
                                    shop.properties.totalReviews !== "None" && (
                                      <span>
                                        ({shop.properties.totalReviews})
                                      </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {shop.properties.postcode}
                                </p>
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
        )}
      </div>
    </div>
  );
};

export default ResultBar;
