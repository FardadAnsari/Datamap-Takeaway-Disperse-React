import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import instanceTracker from "../../api/continuousApi";
import DailyBarChartSection from "./DailyBarChartSection";
import ShopSummaryTable from "./ShopSummaryTable";
import FilterDrawer from "./FilterDrawer";
import { ThreeDots } from "react-loader-spinner";

const companyOptions = [
  { value: "foodhub", label: "FoodHub" },
  { value: "justeat", label: "JustEat" },
  { value: "feedmeonline", label: "FeedMeOnline" },
];

const companyToDailyStatsPath = (value) => {
  switch (value) {
    case "foodhub":
      return "/foodhub/foodhub-delivery-status/";
    case "justeat":
      return "/justeat/justeat-delivery-status/";
    case "feedmeonline":
      return "/feedmeonline/feedmeonline-delivery-status/";
    default:
      return "/foodhub/foodhub-delivery-status/";
  }
};

const companyToShopSummaryPath = (value) => {
  switch (value) {
    case "foodhub":
      return "/foodhub/foodhub-shopsummary/";
    case "justeat":
      return "/justeat/justeat-shopsummary/";
    case "feedmeonline":
      return "/feedmeonline/feedmeonline-shopsummary/";
    default:
      return "/foodhub/foodhub-shopsummary/";
  }
};
// const accessToken = sessionStorage.getItem("accessToken");

const YEAR = 2025;

const joinNatural = (arr) =>
  arr.length <= 1
    ? arr.join("")
    : arr.length === 2
      ? arr.join(" and ")
      : `${arr.slice(0, -1).join(", ")} and ${arr[arr.length - 1]}`;

const buildLocationParam = (filters) =>
  filters?.postcode?.value
    ? { postcode: filters.postcode.value }
    : filters?.city?.value
      ? { city: filters.city.value }
      : {};
const buildFilterSummary = (values) => {
  const cityLabel = values.city?.label ?? "";
  const postcodeLabel = values.postcode?.label ?? "";
  const companies = (values.companies ?? []).map((c) => c.label);
  const companiesText = companies.length ? joinNatural(companies) : "—";

  const [minR = 0, maxR = 5] = values.ratingRange || [0, 5];
  const ratingText = `rating ${Number(minR).toFixed(1)}–${Number(maxR).toFixed(1)}`;

  const hasMinReviews =
    values.reviewMin !== "" &&
    values.reviewMin != null &&
    !Number.isNaN(values.reviewMin);
  const hasMaxReviews =
    values.reviewMax !== "" &&
    values.reviewMax != null &&
    !Number.isNaN(values.reviewMax);

  let reviewsText = "";
  if (hasMinReviews && hasMaxReviews)
    reviewsText = `, reviews ${values.reviewMin}–${values.reviewMax}`;
  else if (hasMinReviews) reviewsText = `, min reviews ${values.reviewMin}`;
  else if (hasMaxReviews) reviewsText = `, max reviews ${values.reviewMax}`;

  return `Results for ${companiesText} in ${cityLabel} ${postcodeLabel} (${ratingText}${reviewsText}).`;
};

/* ---------------- logging helper ---------------- */
const logFetch = (label, endpoint, params, status, extra = {}) => {
  const ts = new Date().toISOString();
  console.log(
    `[${ts}] [${label}] endpoint=${endpoint}`,
    "params:",
    params,
    "status:",
    status,
    extra
  );
};

/* ---------------- helpers ---------------- */

const fetchDailyStatsPerCompany = async (companies, params) => {
  if (!companies?.length)
    throw new Error("Please select at least one company.");

  const tasks = companies.map((c) => ({
    label: c.label,
    endpoint: companyToDailyStatsPath(c.value),
    req: instanceTracker.get(
      companyToDailyStatsPath(c.value),
      // {
      //   headers: {
      //     Authorization: `Bearer ${accessToken}`,
      //   },
      // },
      { params }
    ),
  }));

  const settled = await Promise.allSettled(tasks.map((t) => t.req));

  const grouped = {};
  settled.forEach((res, idx) => {
    const { label, endpoint } = tasks[idx];
    if (res.status === "fulfilled") {
      const payload = res.value?.data;
      const arr = Array.isArray(payload) ? payload : payload?.daily_stats;
      grouped[label] = Array.isArray(arr) ? arr : [];
      logFetch(`${label} (Daily)`, endpoint, params, "success", {
        rows: grouped[label].length,
      });
    } else {
      grouped[label] = [];
      logFetch(`${label} (Daily)`, endpoint, params, "error", {
        error: res.reason?.message,
      });
    }
  });

  const anyData = Object.values(grouped).some((arr) => arr.length > 0);
  if (!anyData) throw new Error("All daily requests failed or returned empty.");
  return grouped;
};

// replace your fetchShopSummary with this version
const fetchShopSummary = async (companies, params, pagesByLabel = {}) => {
  if (!companies?.length)
    throw new Error("Please select at least one company.");

  const tasks = companies.map((c) => {
    const endpoint = companyToShopSummaryPath(c.value);
    const label = c.label;
    // IMPORTANT: pass page per company (default 1)
    const page = pagesByLabel[label] ?? 1;
    return {
      label,
      endpoint,
      req: instanceTracker.get(
        endpoint,
        // {
        //   headers: {
        //     Authorization: `Bearer ${accessToken}`,
        //   },
        // },
        { params: { ...params, page } }
      ),
    };
  });

  const settled = await Promise.allSettled(tasks.map((t) => t.req));

  const grouped = {};
  settled.forEach((res, idx) => {
    const { label, endpoint } = tasks[idx];
    if (res.status === "fulfilled") {
      const payload = res.value?.data || {};
      // normalize shapes:
      const rows = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.results)
          ? payload.results
          : Array.isArray(payload?.shop_summary)
            ? payload.shop_summary
            : Array.isArray(payload?.data)
              ? payload.data
              : [];

      const meta = {
        totalPages:
          payload?.totalPages ??
          payload?.total_pages ??
          payload?.pages?.total ??
          1,
        currentPage: payload?.currentPage ?? payload?.page ?? 1,
        totalItems: payload?.total_items ?? payload?.count ?? rows.length,
        next: payload?.pages?.next ?? payload?.next ?? null,
        previous: payload?.pages?.previous ?? payload?.previous ?? null,
        dateRange: payload?.date_range ?? null,
      };

      grouped[label] = { rows, meta };
      logFetch(
        `${label} (Summary)`,
        endpoint,
        { ...params, page: pagesByLabel[label] ?? 1 },
        "success",
        {
          rows: rows.length,
          page: meta.currentPage,
          totalPages: meta.totalPages,
        }
      );
    } else {
      grouped[label] = {
        rows: [],
        meta: { totalPages: 1, currentPage: 1, totalItems: 0 },
      };
      logFetch(`${label} (Summary)`, endpoint, params, "error", {
        error: res.reason?.message,
      });
    }
  });

  const anyData = Object.values(grouped).some(
    (v) => (v?.rows || []).length > 0
  );
  if (!anyData)
    throw new Error("All shop summary requests failed or returned empty.");
  return grouped;
};

const toDailyRowsPerCompany = (grouped, year, month /* 1..12 */) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const labels = Object.keys(grouped);
  const rows = Array.from({ length: daysInMonth }, (_, i) => ({
    name: String(i + 1),
  }));

  labels.forEach((lbl) => {
    const arr = grouped[lbl] || [];
    const byDay = new Map(
      arr
        .filter(
          (d) =>
            d?.date &&
            d.date.startsWith(`${year}-${String(month).padStart(2, "0")}`)
        )
        .map((d) => [
          Number(d.date.slice(-2)),
          { open: Number(d.open || 0), closed: Number(d.closed || 0) },
        ])
    );
    for (let day = 1; day <= daysInMonth; day++) {
      const v = byDay.get(day) || { open: 0, closed: 0 };
      rows[day - 1][`${lbl}_open`] = v.open;
      rows[day - 1][`${lbl}_closed`] = v.closed;
    }
  });

  return rows;
};

const makeDailySkeleton = (labels = [], year = YEAR, month = 1) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const row = { name: String(i + 1) };
    labels.forEach((lbl) => {
      row[`${lbl}_open`] = 0;
      row[`${lbl}_closed`] = 0;
    });
    return row;
  });
};

/* ---------------- component ---------------- */
const ContinuousDevicesStatus = ({ isOpen }) => {
  const [showFilter, setShowFilter] = useState(false);
  const [shopSummaryData, setShopSummaryData] = useState({});
  const [shopPages, setShopPages] = useState({});
  const [loading, setLoading] = useState(false);

  const defaultFormValues = {
    city: null,
    postcode: null,
    companies: [],
    ratingRange: [0, 5],
    reviewMin: undefined,
    reviewMax: undefined,
  };

  const [summary, setSummary] = useState("");
  const [dailyMonth, setDailyMonth] = useState(new Date().getMonth() + 1); // for daily chart
  const [shopMonth, setShopMonth] = useState(new Date().getMonth() + 1); // independent month for summary
  const [dailyData, setDailyData] = useState(
    makeDailySkeleton([], YEAR, dailyMonth)
  );
  const [dailyCompanyLabels, setDailyCompanyLabels] = useState([]);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [errorDaily, setErrorDaily] = useState("");
  const [lastFilters, setLastFilters] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState("");

  // Shop Summary: tabs + loading/error
  const [shopCompanyLabels, setShopCompanyLabels] = useState([]);
  const [shopActiveCompany, setShopActiveCompany] = useState("");
  const [loadingShopSummary, setLoadingShopSummary] = useState(false);
  const [errorShopSummary, setErrorShopSummary] = useState("");

  // const {
  //   register,
  //   handleSubmit,
  //   reset,
  //   control,
  //   formState: { isSubmitting },
  // } = useForm({ defaultValues: defaultFormValues });

  const methods = useForm({ defaultValues: defaultFormValues });
  // Keep active summary tab valid
  useEffect(() => {
    if (!shopCompanyLabels.length) {
      setShopActiveCompany("");
      return;
    }
    if (!shopActiveCompany || !shopCompanyLabels.includes(shopActiveCompany)) {
      setShopActiveCompany(shopCompanyLabels[0]);
    }
  }, [shopCompanyLabels, shopActiveCompany]);

  const refreshDaily = async (filters, monthNum) => {
    if (!filters?.companies?.length) return;
    setErrorDaily("");
    setLoadingDaily(true);
    try {
      const params = {
        year: YEAR,
        month: monthNum,
        ...buildLocationParam(filters),
      };
      const grouped = await fetchDailyStatsPerCompany(
        filters.companies,
        params
      );

      const firstArr = Object.values(grouped).find(
        (a) => Array.isArray(a) && a.length
      );
      const firstDate = firstArr?.find((d) => d?.date)?.date; // "YYYY-MM-DD"
      const detectedMonth = firstDate ? Number(firstDate.slice(5, 7)) : null;

      if (detectedMonth && detectedMonth !== monthNum) {
        setDailyMonth(detectedMonth);
        setDailyData(toDailyRowsPerCompany(grouped, YEAR, detectedMonth));
      } else {
        setDailyData(toDailyRowsPerCompany(grouped, YEAR, monthNum));
      }
    } catch (err) {
      console.error(err);
      const labels = (filters.companies || []).map((c) => c.label);
      setDailyData(makeDailySkeleton(labels, YEAR, monthNum));
      setErrorDaily("Failed to load daily stats.");
    } finally {
      setLoadingDaily(false);
    }
  };

  // Fetch Shop Summary when month or filters change (independent of daily)
  useEffect(() => {
    if (!lastFilters?.companies?.length) return;

    const params = {
      year: YEAR,
      ...buildLocationParam(lastFilters),
      min_rating: lastFilters.ratingRange[0],
      max_rating: lastFilters.ratingRange[1],
      month: shopMonth,
      ...(lastFilters.reviewMin != null && lastFilters.reviewMin !== ""
        ? { min_reviews: Number(lastFilters.reviewMin) }
        : {}),
      ...(lastFilters.reviewMax != null && lastFilters.reviewMax !== ""
        ? { max_reviews: Number(lastFilters.reviewMax) }
        : {}),
    };

    const fetchSummary = async () => {
      setErrorShopSummary("");
      setLoadingShopSummary(true);
      try {
        const shopSummary = await fetchShopSummary(
          lastFilters.companies,
          params,
          shopPages
        );
        setShopSummaryData(shopSummary);
      } catch (err) {
        console.error(err);
        setErrorShopSummary("Failed to load shop summary data.");
        setShopSummaryData({});
      } finally {
        setLoadingShopSummary(false);
      }
    };

    fetchSummary();
  }, [shopMonth, lastFilters, shopPages]);

  const handleShopPageChange = (label, nextPage) => {
    setShopPages((prev) => ({ ...prev, [label]: nextPage }));
  };

  const onSubmit = async (values) => {
    setLoading(true);
    setSummary(buildFilterSummary(values));
    if (!values.city) {
      setLoading(false);
      return;
    }
    if (!values.companies?.length) {
      setLoading(false);
      return;
    }

    try {
      const [minRating, maxRating] = values.ratingRange || [0, 5];

      if (
        values.reviewMin != null &&
        values.reviewMax != null &&
        !Number.isNaN(values.reviewMin) &&
        !Number.isNaN(values.reviewMax) &&
        values.reviewMin > values.reviewMax
      ) {
        return;
      }

      const paramsCommon = {
        year: YEAR,
        ...buildLocationParam(values),
        min_rating: minRating,
        max_rating: maxRating,
      };
      if (values.reviewMin !== "" && values.reviewMin != null)
        paramsCommon.min_reviews = Number(values.reviewMin);
      if (values.reviewMax !== "" && values.reviewMax != null)
        paramsCommon.max_reviews = Number(values.reviewMax);

      // DAILY
      const labels = values.companies.map((c) => c.label);
      setDailyCompanyLabels(labels);
      setSelectedCompany(labels[0] || "");
      setLastFilters(values);
      await refreshDaily(values, dailyMonth);

      // SHOP SUMMARY — setup tabs and fetch with independent month
      const shopLabels = values.companies.map((c) => c.label);
      setShopCompanyLabels(shopLabels);
      setShopActiveCompany(shopLabels[0] || "");
      setShopPages(Object.fromEntries(shopLabels.map((lbl) => [lbl, 1])));

      setLoadingShopSummary(true);
      try {
        const shopSummary = await fetchShopSummary(values.companies, {
          ...paramsCommon,
          month: shopMonth,
        });
        setShopSummaryData(shopSummary);
      } catch (err) {
        console.error(err);
        setErrorShopSummary("Failed to load shop summary data.");
        setShopSummaryData({});
      } finally {
        setLoadingShopSummary(false);
      }

      setShowFilter(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!lastFilters?.companies?.length) return;
    refreshDaily(lastFilters, dailyMonth);
  }, [dailyMonth]);

  const onClear = () => {
    const defaults = {
      city: null,
      postcode: null,
      companies: [],
      ratingRange: [0, 5],
      reviewMin: "",
      reviewMax: "",
    };
    methods.reset(defaults);
    setSummary("");
    setLastFilters(null);
    setDailyCompanyLabels([]);
    setSelectedCompany("");
    setDailyData(makeDailySkeleton([], YEAR, dailyMonth));
    setErrorDaily("");
    setShopSummaryData({});
    setShopMonth(new Date().getMonth() + 1);
    setShopCompanyLabels([]);
    setShopActiveCompany("");
    setLoadingShopSummary(false);
    setErrorShopSummary("");
  };

  return (
    <div
      className={`max-w-screen w-[calc(100%-80px)] p-6 absolute top-0 left-20 flex flex-col h-full overflow-y-auto bg-stone-50 z-40 transition-transform duration-700 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="mx-4 flex justify-between items-center pb-4">
        <span className="text-2xl font-bold">Continuous Devices Status</span>
      </div>
      <hr />
      <div className="mx-2 py-2 flex justify-between items-center">
        <p
          className="mx-2 text-md text-gray-700"
          aria-live="polite"
          role="status"
        >
          {summary ? summary : ""}
        </p>

        <button
          onClick={() => setShowFilter(true)}
          className="flex gap-2 items-center px-6 py-3 rounded-lg border text-gray-600 border-gray-300 hover:bg-gray-50"
        >
          <div className="w-6 h-6 bg-filter-button bg-cover" />
          <p className="text-md">Filter</p>
        </button>
      </div>

      <div className="flex flex-col gap-4 py-2">
        {/* DAILY (Bar) */}
        <div className="p-4 border rounded-xl shadow-lg relative">
          {errorDaily && (
            <div className="my-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {errorDaily}
            </div>
          )}

          {loadingDaily || loading ? (
            <div className="mt-2 w-full h-[350px] flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-lg">
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
          ) : (
            <DailyBarChartSection
              data={dailyData}
              companyLabels={dailyCompanyLabels}
              activeCompany={selectedCompany}
              setActiveCompany={setSelectedCompany}
              month={dailyMonth}
              setMonth={setDailyMonth}
              openColor="#22c55e"
              closedColor="#ef4444"
            />
          )}
        </div>

        {/* SHOP SUMMARY */}
        <ShopSummaryTable
          labels={shopCompanyLabels}
          activeLabel={shopActiveCompany}
          onChangeActive={setShopActiveCompany}
          month={shopMonth}
          onChangeMonth={setShopMonth}
          dataByLabel={shopSummaryData}
          loading={loadingShopSummary}
          error={errorShopSummary}
          onChangePage={(page) => handleShopPageChange(shopActiveCompany, page)}
        />
      </div>

      {showFilter && (
        <FormProvider {...methods}>
          <FilterDrawer
            isOpen={showFilter}
            onClose={() => setShowFilter(false)}
            onSubmit={onSubmit}
            onClear={onClear}
            companyOptions={companyOptions}
            containerStyle={{ top: 75, right: 25 }}
          />
        </FormProvider>
      )}
    </div>
  );
};

export default ContinuousDevicesStatus;
