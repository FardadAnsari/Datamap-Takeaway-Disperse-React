import { useMemo, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import { levenshtein } from "fastest-levenshtein";
import { useUser } from "../../api/userPermission";
import companyIcons from "../../assets/checkbox-icon/checkboxIcons";
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

const normalize = (str) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

const areShopsSimilar = (shopA, shopB, threshold = 0.7) => {
  const nameA = normalize(shopA.properties.shopName);
  const nameB = normalize(shopB.properties.shopName);
  const postcodeA = shopA.properties.postcode.trim().toLowerCase();
  const postcodeB = shopB.properties.postcode.trim().toLowerCase();

  if (postcodeA !== postcodeB) return false;
  const distance = levenshtein(nameA, nameB);
  const similarity = 1 - distance / Math.max(nameA.length, nameB.length);
  return similarity >= threshold;
};

const Resultbar = ({
  groupedResults,
  companyList,
  onMarkerFocus,
  onDistinctFocus,
  activeMarker,
  showCommon = false,
}) => {
  const [visibleShops, setVisibleShops] = useState({});
  const [visibleCommonShops, setVisibleCommonShops] = useState(3);
  const { user } = useUser();

  const findCommonShops = () => {
    const allShops = [];
    Object.entries(groupedResults).forEach(([company, shops]) => {
      shops.forEach((shop) => {
        allShops.push({ ...shop, company });
      });
    });

    const matched = [];
    const seen = new Set();

    for (let i = 0; i < allShops.length; i++) {
      if (seen.has(i)) continue;
      const baseShop = allShops[i];
      const similar = [baseShop];

      for (let j = i + 1; j < allShops.length; j++) {
        if (seen.has(j)) continue;
        const compareShop = allShops[j];
        if (areShopsSimilar(baseShop, compareShop)) {
          similar.push(compareShop);
          seen.add(j);
        }
      }

      if (similar.length > 1) {
        matched.push({
          ...baseShop,
          properties: {
            ...baseShop.properties,
            commonIn: Array.from(new Set(similar.map((s) => s.company))),
          },
        });
        seen.add(i);
      }
    }

    return matched;
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
          <div className="flex-1 overflow-hidden">
            <Virtuoso
              style={{ height: "100%", width: "100%" }}
              totalCount={
                showCommon
                  ? Math.min(visibleCommonShops, commonShops.length)
                  : companyList.length
              }
              itemContent={(index) => {
                if (showCommon) {
                  const shop = commonShops[index];
                  const { shopName, postcode, shop_id, commonIn } =
                    shop.properties;
                  return (
                    <div
                      key={shop_id}
                      className={`flex flex-col gap-2 cursor-pointer border-b px-2 py-4 ${activeMarker === shop_id ? "bg-orange-50" : ""}`}
                      onClick={() =>
                        onDistinctFocus(
                          shop.geometry.coordinates,
                          shop.properties.shop_id
                        )
                      }
                    >
                      <div>
                        <p className="text-base font-bold text-gray-700">
                          {shopName}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {commonIn.map((company) => (
                          <span
                            key={company}
                            className="mt-1 px-2 py-1 text-xs bg-orange-50 rounded-full text-orange-700"
                          >
                            {company}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">{postcode}</p>
                    </div>
                  );
                } else {
                  const company = companyList[index];
                  const shops = groupedResults[company];
                  const visibleCount = visibleShops[company] || 3;

                  const IconComponent =
                    companyIcons[company.replace(/\s+/g, "").toLowerCase()];

                  return (
                    <div key={company} className="mb-2">
                      <div className="flex items-center gap-2 px-2 py-1 border-b">
                        {IconComponent && (
                          <IconComponent width={24} height={24} />
                        )}
                        <span className="text-lg font-medium text-gray-800">
                          {company}
                        </span>
                        <span className="text-sm text-gray-600">
                          ({shops.length})
                        </span>
                      </div>
                      {shops.slice(0, visibleCount).map((shop) => {
                        const { shopName, shop_id, postcode } = shop.properties;
                        return (
                          <div
                            key={shop_id}
                            className={`flex flex-col gap-2 cursor-pointer border-b px-2 py-4 ${activeMarker === shop_id ? "bg-orange-50" : ""}`}
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
                            <p className="text-xs text-gray-500">{postcode}</p>
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
                }
              }}
              components={
                showCommon && commonShops.length > visibleCommonShops
                  ? {
                      Footer: () => (
                        <button
                          className="w-full text-sm text-orange-500 mt-4 hover:underline"
                          onClick={handleLoadMoreCommonShops}
                        >
                          Load more...
                        </button>
                      ),
                    }
                  : {}
              }
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Resultbar;
