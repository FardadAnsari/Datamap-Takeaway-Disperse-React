import { useMemo, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { FaStar } from "react-icons/fa6";

import React from "react";

import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

function MyErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" className="text-center text-red-500">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}
export function ErrorBoundary({ children }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={MyErrorFallback}
      onError={(error, errorInfo) => {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}

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
  const [activeTab, setActiveTab] = useState("byCompany");

  const handleShopClick = (shop) => {
    if (
      shop &&
      shop.geometry &&
      Array.isArray(shop.geometry.coordinates) &&
      shop.properties &&
      shop.properties.shop_id
    ) {
      const coordinates = shop.geometry.coordinates;
      onMarkerFocus(coordinates, shop.properties.shop_id);
    } else {
      console.warn("Shop data is incomplete or invalid:", shop);
    }
  };

  const findCommonShops = () => {
    const shopMap = new Map();
    Object.entries(groupedResults).forEach(([company, shops]) => {
      if (!Array.isArray(shops)) {
        console.warn(`Shops for company "${company}" is not an array:`, shops);
        return;
      }

      shops.forEach((shop) => {
        if (!shop || !shop.properties) {
          console.warn(
            `Shop data is incomplete for company "${company}":`,
            shop
          );
          return;
        }

        const { shopName, postcode } = shop.properties;
        if (!shopName || !postcode) {
          console.warn(`Missing shopName or postcode for shop:`, shop);
          return;
        }

        const key = `${shopName}-${postcode}`.toLowerCase();

        if (!shopMap.has(key)) {
          shopMap.set(key, { shop, companies: new Set([company]) });
        } else {
          shopMap.get(key).companies.add(company);
        }
      });
    });

    const commonShops = Array.from(shopMap.values())
      .filter(({ companies }) => companies.size > 1)
      .map(({ shop, companies }) => {
        if (!shop.properties) {
          console.warn("Shop properties missing after mapping:", shop);
          return null;
        }
        return {
          ...shop,
          properties: {
            ...shop.properties,
            commonIn: Array.from(companies),
          },
        };
      })
      .filter((shop) => shop !== null && shop.properties.commonIn);

    console.log("Common Shops:", commonShops);

    return commonShops;
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
    <ErrorBoundary>
      <div className="w-96 absolute top-24 right-5 flex flex-col h-5/6 bg-white z-20 shadow-md rounded-lg transition-transform duration-300 ease-in-out">
        <div className="p-4 h-full flex flex-col">
          <div className="w-full flex justify-center mb-2 h-10 gap-2">
            <button
              className={`w-1/2 text-base font-light text-center rounded border ${
                activeTab === "byCompany"
                  ? "bg-orange-500 text-white"
                  : "bg-white"
              }`}
              onClick={() => setActiveTab("byCompany")}
            >
              By Company ({companyList.length})
            </button>
            <button
              className={`w-1/2 text-base font-light text-center rounded border ${
                activeTab === "commonShops"
                  ? "bg-orange-500 text-white"
                  : "bg-white"
              }`}
              onClick={() => setActiveTab("commonShops")}
            >
              Common shops
            </button>
          </div>

          {activeTab === "commonShops" &&
            (commonShops.length === 0 ? (
              <p className="text-center text-gray-500 mt-8">Result not found</p>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <p>Total result {commonShops.length}</p>
                <Virtuoso
                  style={{ height: "90%", width: "100%" }}
                  totalCount={Math.min(visibleCommonShops, commonShops.length)}
                  itemContent={(index) => {
                    const shop = commonShops[index];
                    if (!shop || !shop.properties) {
                      console.warn(
                        `Common shop at index ${index} is invalid:`,
                        shop
                      );
                      return (
                        <div
                          key={index}
                          className="p-3 cursor-pointer border-b-2 text-red-500"
                        >
                          Invalid shop data
                        </div>
                      );
                    }
                    const { shopName, postcode, shop_id, commonIn } =
                      shop.properties;

                    return (
                      <div
                        key={shop_id}
                        className="p-3 cursor-pointer border-b-2"
                        onClick={() => handleShopClick(shop)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-sm font-medium text-gray-800">
                              {shopName}
                            </h3>
                            <p className="text-xs text-gray-600">{postcode}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {commonIn.map((company) => (
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
                <p className="text-center text-gray-500 mt-8">
                  Result not found
                </p>
              ) : (
                <Virtuoso
                  style={{ height: "100%", width: "100%" }}
                  totalCount={companyList.length}
                  itemContent={(index) => {
                    const company = companyList[index];
                    const shops = groupedResults[company];
                    const isExpanded = expandedCompanies[company] || false;

                    const visibleCount = visibleShops[company] || 3;

                    if (!shops || !Array.isArray(shops)) {
                      console.warn(
                        `Shops data for company "${company}" is invalid:`,
                        shops
                      );
                      return (
                        <div key={company} className="mb-2 text-red-500">
                          Invalid shops data for {company}
                        </div>
                      );
                    }

                    return (
                      <div key={company} className="mb-2">
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
                            {shops.slice(0, visibleCount).map((shop) => {
                              if (!shop || !shop.properties) {
                                console.warn(
                                  `Shop data is invalid for company "${company}":`,
                                  shop
                                );
                                return (
                                  <div
                                    key={`${company}-invalid-${shop?.shop_id || "unknown"}`}
                                    className="flex flex-col gap-2 cursor-pointer border-b px-2 py-4 text-red-500"
                                  >
                                    Invalid shop data
                                  </div>
                                );
                              }
                              const {
                                shopName,
                                shop_id,
                                rating,
                                totalReviews,
                                postcode,
                              } = shop.properties;

                              return (
                                <div
                                  key={shop_id}
                                  className={`flex flex-col gap-2 cursor-pointer border-b px-2 py-4 ${
                                    activeMarker === shop_id
                                      ? "bg-orange-50"
                                      : ""
                                  }`}
                                  onClick={() => handleShopClick(shop)}
                                >
                                  <div>
                                    <p className="text-base font-bold text-gray-700">
                                      {shopName}
                                    </p>
                                  </div>
                                  <div className="flex justify-between">
                                    <div className="flex items-center space-x-1 text-gray-700 text-xs">
                                      {rating && rating !== "None" && (
                                        <div className="flex gap-1">
                                          <FaStar className="text-yellow-400" />
                                          <span>{rating}</span>
                                        </div>
                                      )}
                                      {totalReviews &&
                                        totalReviews !== "None" && (
                                          <span>({totalReviews})</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      {postcode}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
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
    </ErrorBoundary>
  );
};

export default ResultBar;
