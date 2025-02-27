import { Virtuoso } from "react-virtuoso";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { FaStar } from "react-icons/fa6";
import companyIcons from "../assets/checkbox-icon/checkboxIcons";
import { useState } from "react";

const GoogleBusinessResultbar = ({
  groupedResults,
  companyList,
  expandedCompanies,
  toggleCompany,
  onMarkerFocus,
  activeMarker,
}) => {
  const [visibleShops, setVisibleShops] = useState({});
  console.log(companyList);

  const handleLoadMore = (company) => {
    setVisibleShops((prev) => ({
      ...prev,
      [company]: (prev[company] || 3) + 3,
    }));
  };

  return (
    <div className="w-96 absolute top-24 right-5 flex flex-col h-5/6 bg-white z-20 shadow-md rounded-lg transition-transform duration-300 ease-in-out">
      <div className="p-4 h-full flex flex-col">
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

                const IconComponent =
                  companyIcons[company.replace(/\s+/g, "").toLowerCase()];

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
                        {IconComponent && (
                          <IconComponent width={24} height={24} />
                        )}
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
                                activeMarker === shop_id ? "bg-orange-50" : ""
                              }`}
                              onClick={() => onMarkerFocus(shop)}
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
                                  {totalReviews && totalReviews !== "None" && (
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
                            className="w-full text-sm text-orange-500 mt-2 hover:underline"
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

export default GoogleBusinessResultbar;
