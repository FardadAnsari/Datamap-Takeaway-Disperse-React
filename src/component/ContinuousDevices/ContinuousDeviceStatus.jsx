import { useEffect, useState } from "react";
import LineChartSection from "./LineChartSection";
import { useForm, FormProvider } from "react-hook-form";
import instance from "../../api/continuousApi";
import DailyBarChartSection from "./DailyBarChartSection";
import ShopSummaryTable from "./ShopSummaryTable";
import FilterDrawer from "./FilterDrawer";

const cityOptions = [
  { value: "glasgow", label: "Glasgow" },
  { value: "edinburgh", label: "Edinburgh" },
  { value: "aberdeen", label: "Aberdeen" },
];

const companyOptions = [
  { value: "foodhub", label: "FoodHub" },
  { value: "justeat", label: "JustEat" },
  { value: "feedmeonline", label: "FeedMeOnline" },
];

const companyToPath = (value) => {
  switch (value) {
    case "foodhub":
      return "/foodhub/";
    case "justeat":
      return "/justeat/";
    case "feedmeonline":
      return "/feedmeonline/";
    default:
      return "/foodhub/";
  }
};

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

const YEAR = 2025;
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const joinNatural = (arr) =>
  arr.length <= 1
    ? arr.join("")
    : arr.length === 2
      ? arr.join(" and ")
      : `${arr.slice(0, -1).join(", ")} and ${arr[arr.length - 1]}`;

const buildFilterSummary = (values) => {
  const cityLabel = values.city?.label ?? "—";
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

  return `Results for ${companiesText} in ${cityLabel} (${ratingText}${reviewsText}).`;
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
const makeSkeleton = (companyLabels = []) =>
  MONTHS.map((m) => {
    const row = { name: m };
    companyLabels.forEach((lbl) => (row[lbl] = 0));
    return row;
  });

const fetchPerCompany = async (companies, params) => {
  if (!companies?.length)
    throw new Error("Please select at least one company.");

  const tasks = companies.map((c) => ({
    label: c.label,
    endpoint: companyToPath(c.value),
    req: instance.get(companyToPath(c.value), { params }),
  }));

  const settled = await Promise.allSettled(tasks.map((t) => t.req));

  const grouped = {};
  settled.forEach((res, idx) => {
    const { label, endpoint } = tasks[idx];
    if (res.status === "fulfilled" && Array.isArray(res.value?.data)) {
      grouped[label] = res.value.data;
      logFetch(label, endpoint, params, "success", {
        rows: grouped[label].length,
      });
    } else {
      grouped[label] = [];
      logFetch(label, endpoint, params, "error", {
        error: res.reason?.message,
      });
    }
  });

  const anyData = Object.values(grouped).some((arr) => arr.length > 0);
  if (!anyData) throw new Error("All requests failed or returned empty.");
  return grouped;
};

// Accepts either top-level array OR { daily_stats: [...] }
const fetchDailyStatsPerCompany = async (companies, params) => {
  if (!companies?.length)
    throw new Error("Please select at least one company.");

  const tasks = companies.map((c) => ({
    label: c.label,
    endpoint: companyToDailyStatsPath(c.value),
    req: instance.get(companyToDailyStatsPath(c.value), { params }),
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

const fetchShopSummary = async (companies, params) => {
  if (!companies?.length)
    throw new Error("Please select at least one company.");

  const tasks = companies.map((c) => ({
    label: c.label,
    endpoint: companyToShopSummaryPath(c.value),
    req: instance.get(companyToShopSummaryPath(c.value), { params }),
  }));

  const settled = await Promise.allSettled(tasks.map((t) => t.req));

  const grouped = {};
  settled.forEach((res, idx) => {
    const { label, endpoint } = tasks[idx];
    if (res.status === "fulfilled") {
      const payload = res.value?.data;
      const arr = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.shop_summary)
          ? payload.shop_summary
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
      grouped[label] = arr;
      logFetch(`${label} (Summary)`, endpoint, params, "success", {
        rows: grouped[label].length,
      });
    } else {
      grouped[label] = [];
      logFetch(`${label} (Summary)`, endpoint, params, "error", {
        error: res.reason?.message,
      });
    }
  });

  const anyData = Object.values(grouped).some((arr) => arr.length > 0);
  if (!anyData)
    throw new Error("All shop summary requests failed or returned empty.");
  return grouped;
};

const toMonthlyAvgPerCompany = (groupedRows, year = YEAR) => {
  const now = new Date();
  const currentMonthIndex = now.getMonth(); // 0=Jan
  const labels = Object.keys(groupedRows);

  const bucketsByLabel = new Map();
  labels.forEach((lbl) => {
    const rows = groupedRows[lbl] || [];
    const m = new Map();
    rows.forEach((r) => {
      if (!r?.date) return;
      const [y, mm] = String(r.date).split("-");
      if (Number(y) !== Number(year)) return;
      const key = `${y}-${mm}`;
      const v = Number(r.count ?? 0);
      if (v !== 0) {
        if (!m.has(key)) m.set(key, []);
        m.get(key).push(v);
      }
    });
    bucketsByLabel.set(lbl, m);
  });

  return MONTHS.slice(0, currentMonthIndex + 1).map((labelMonth, idx) => {
    const mm = String(idx + 1).padStart(2, "0");
    const key = `${year}-${mm}`;
    const row = { name: labelMonth };

    labels.forEach((lbl) => {
      const arr = bucketsByLabel.get(lbl)?.get(key) || [];
      const avg = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      row[lbl] = Number(avg.toFixed(2));
    });

    return row;
  });
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
const ContinuousDeviceStatus = ({ isOpen }) => {
  const [showFilter, setShowFilter] = useState(false);
  const [shopSummaryData, setShopSummaryData] = useState({});

  // MONTHLY (Line)
  const [chartData, setChartData] = useState(
    makeSkeleton(companyOptions.map((c) => c.label))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const defaultFormValues = {
    city: null,
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
      const params = { year: YEAR, month: monthNum, city: filters.city?.value };
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
    } catch (e) {
      console.error(e);
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
      city: lastFilters.city?.value,
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
          params
        );
        setShopSummaryData(shopSummary);
      } catch (e) {
        console.error(e);
        setErrorShopSummary("Failed to load shop summary data.");
        setShopSummaryData({});
      } finally {
        setLoadingShopSummary(false);
      }
    };

    fetchSummary();
  }, [shopMonth, lastFilters]);

  const onSubmit = async (values) => {
    setError("");
    setLoading(true);
    setSummary(buildFilterSummary(values));
    if (!values.city) {
      setLoading(false);
      setError("Please select a city.");
      return;
    }
    if (!values.companies?.length) {
      setLoading(false);
      setError("Please select at least one company.");
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
        setError("Minimum reviews cannot be greater than maximum.");
        return;
      }

      const paramsCommon = {
        year: YEAR,
        city: values.city?.value,
        min_rating: minRating,
        max_rating: maxRating,
      };
      if (values.reviewMin !== "" && values.reviewMin != null)
        paramsCommon.min_reviews = Number(values.reviewMin);
      if (values.reviewMax !== "" && values.reviewMax != null)
        paramsCommon.max_reviews = Number(values.reviewMax);

      // MONTHLY
      const grouped = await fetchPerCompany(values.companies, {
        ...paramsCommon,
        month: dailyMonth,
      });
      setChartData(toMonthlyAvgPerCompany(grouped, YEAR));

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

      setLoadingShopSummary(true);
      try {
        const shopSummary = await fetchShopSummary(values.companies, {
          ...paramsCommon,
          month: shopMonth,
        });
        setShopSummaryData(shopSummary);
      } catch (e) {
        console.error(e);
        setErrorShopSummary("Failed to load shop summary data.");
        setShopSummaryData({});
      } finally {
        setLoadingShopSummary(false);
      }

      setShowFilter(false);
    } catch (e) {
      console.error(e);
      const labels = (values.companies || []).map((c) => c.label);
      setChartData(makeSkeleton(labels));
      setError("Filtering failed. Please try again.");

      setDailyCompanyLabels(labels);
      setSelectedCompany(labels[0] || "");
      setDailyData(makeDailySkeleton(labels, YEAR, dailyMonth));
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
      city: { value: "glasgow", label: "Glasgow" },
      companies: [],
      ratingRange: [0, 5],
      reviewMin: "",
      reviewMax: "",
    };
    methods.reset(defaults);
    setSummary("");
    setError("");
    setChartData(makeSkeleton(companyOptions.map((c) => c.label)));
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
      <div className="mx-4 flex justify-between items-center">
        <span className="text-2xl font-bold">Continuous Devices Status</span>
      </div>

      <div className="flex flex-col gap-4 py-6">
        {/* MONTHLY (Line) */}
        <div className="p-4 border rounded-xl shadow-lg relative">
          <div className="mx-2 mb-2 flex justify-between items-center">
            <span className="text-xl">{YEAR}</span>
            <button
              onClick={() => setShowFilter(true)}
              className="flex gap-2 items-center px-3 py-1 rounded-lg border text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              <div className="w-6 h-6 bg-filter-button bg-cover" />
              <span>Filter</span>
            </button>
          </div>

          {summary && (
            <p
              className="mx-2 mb-3 text-sm text-gray-700"
              aria-live="polite"
              role="status"
            >
              {summary}
            </p>
          )}

          <hr />
          {error && (
            <div className="my-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </div>
          )}
          <LineChartSection data={chartData} />
          {loading && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] rounded-xl flex items-center justify-center text-gray-600">
              Loading…
            </div>
          )}
        </div>

        {/* DAILY (Bar) */}
        <div className="relative">
          {errorDaily && (
            <div className="my-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {errorDaily}
            </div>
          )}
          <DailyBarChartSection
            data={dailyData}
            companyLabels={dailyCompanyLabels}
            activeCompany={selectedCompany} /* ignored by child, harmless */
            setActiveCompany={
              setSelectedCompany
            } /* ignored by child, harmless */
            month={dailyMonth}
            setMonth={setDailyMonth}
            openColor="#22c55e" /* ignored by child, harmless */
            closedColor="#ef4444" /* ignored by child, harmless */
          />
          {loadingDaily && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] rounded-xl flex items-center justify-center text-gray-600">
              Loading daily…
            </div>
          )}
        </div>
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
      />

      {showFilter && (
        <FormProvider {...methods}>
          <FilterDrawer
            isOpen={showFilter}
            onClose={() => setShowFilter(false)}
            onSubmit={onSubmit}
            onClear={onClear}
            cityOptions={cityOptions}
            companyOptions={companyOptions}
          />
        </FormProvider>
      )}
    </div>
  );
};

export default ContinuousDeviceStatus;
