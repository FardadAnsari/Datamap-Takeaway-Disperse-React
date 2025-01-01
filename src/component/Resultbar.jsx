import React, { useMemo, useState } from "react";
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
  const [showCommonShops, setShowCommonShops] = useState(false);

  const findCommonShops = () => {
    const shopMap = new Map();

    Object.entries(groupedResults).forEach(([company, shops]) => {
      shops.forEach((shop) => {
        const key =
          `${shop.properties.shopName}-${shop.properties.postcode}`.toLowerCase();
        if (!shopMap.has(key)) {
          shopMap.set(key, { shop, companies: [company] });
        } else {
          shopMap.get(key).companies.push(company);
        }
      });
    });

    return Array.from(shopMap.values())
      .filter(({ companies }) => companies.length > 1)
      .map(({ shop, companies }) => ({ ...shop, commonIn: companies }));
  };

  const commonShops = useMemo(() => findCommonShops(), [groupedResults]);

  const handleLoadMore = (company) => {
    setVisibleShops((prev) => ({
      ...prev,
      [company]: (prev[company] || 3) + 3,
    }));
  };
  return (
    <div className="w-80 absolute top-24 right-5 flex flex-col h-5/6 bg-white z-20 shadow-md rounded-lg transition-transform duration-300 ease-in-out">
      <div className="p-4 flex flex-col"></div>
      <div className="p-4 h-full flex flex-col">
        {commonShops.length > 0 && (
          <button
            className="mb-4 px-4 py-2 bg-orange-100 text-orange-700 rounded flex justify-between items-center"
            onClick={() => setShowCommonShops(!showCommonShops)}
          >
            <span className="font-medium">
              Common Shops ({commonShops.length})
            </span>
            {showCommonShops ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </button>
        )}

        {showCommonShops && (
          <div className="overflow-y-auto">
            {commonShops.map((shop) => (
              <div
                key={shop.properties.shop_id}
                className="p-3 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100 overflow-y-auto"
              >
                <div className="flex justify-between items-start mb-2">
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
                      className="px-2 py-1 text-xs bg-white rounded-full text-orange-700"
                    >
                      {company}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
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
