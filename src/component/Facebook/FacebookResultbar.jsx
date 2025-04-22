import { Virtuoso } from "react-virtuoso";

import { useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../api/userPermission";

const FacebookResultbar = ({
  groupedResults,
  companyList,
  onMarkerFocus,
  activeMarker,
}) => {
  const [visibleShops, setVisibleShops] = useState({});

  const handleLoadMore = (company) => {
    setVisibleShops((prev) => ({
      ...prev,
      [company]: (prev[company] || 3) + 3,
    }));
  };

  const { user } = useUser();

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
                    <p>Total result {shops.length}</p>

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
                      const { shopName, shop_id, postcode } = shop.properties;

                      return (
                        <div
                          key={shop_id}
                          className={`flex flex-col gap-2 cursor-pointer border-b px-2 py-4 ${
                            activeMarker === shop_id ? "bg-orange-50" : ""
                          }`}
                          onClick={() =>
                            onMarkerFocus(
                              shop.geometry.coordinates,
                              shop.properties.shop_id
                            )
                          }
                        >
                          <p className="text-base font-bold text-gray-700">
                            {shopName}
                          </p>

                          <div className="flex justify-between items-center">
                            {user.access.gbDashboardMap ? (
                              <Link
                                to={`/facebook/${shop.properties.pageId}`}
                                target="_blank"
                                className="group relative px-2 border rounded-lg overflow-hidden transition-all duration-300 ease-in-out hover:pr-44 flex items-center"
                              >
                                <div className="my-1 bg-cover bg-facebook-resultbar-icon w-6 h-6"></div>
                                <span className="absolute left-10 opacity-0 whitespace-nowrap transform -translate-x-4 transition-all duration-400 ease-in-out group-hover:opacity-100 group-hover:translate-x-0">
                                  Facebook Dashboard
                                </span>
                              </Link>
                            ) : null}
                            <p className="text-xs text-gray-500">{postcode}</p>
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
                );
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FacebookResultbar;
