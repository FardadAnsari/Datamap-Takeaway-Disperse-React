import { useEffect, useState } from "react";
import LineChartSection from "./LineChartSection";
import { useForm, FormProvider } from "react-hook-form";
import instanceTracker from "../../api/continuousApi";
import FilterDrawer from "./FilterDrawer";
import { ThreeDots } from "react-loader-spinner";
import instance from "../../api/api";

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

// UK-wide archive endpoints (no params; absolute base is set on `instance`)
const companyToArchiveUrl = {
  feedmeonline: "/api/v1/companies/feedmeonline/archive/",
  foodhub: "/api/v1/companies/foodhub/archive/",
  justeat: "/api/v1/companies/justeat/archive/",
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
    req: instanceTracker.get(companyToPath(c.value), { params }),
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

/* ---------- UK-daily helpers: combine rows + month ticks ---------- */

// Merge daily rows by date: [{ name: 'YYYY-MM-DD', FoodHub: 123, JustEat: 456, ... }, ...]
const combineUKDailyByDate = (groupedRows) => {
  const dateMap = new Map(); // key: 'YYYY-MM-DD' -> row object
  const labels = Object.keys(groupedRows); // company labels

  labels.forEach((lbl) => {
    (groupedRows[lbl] || []).forEach((r) => {
      const day = String(r.timestamp).slice(0, 10); // 'YYYY-MM-DD'
      if (!dateMap.has(day)) dateMap.set(day, { name: day });
      // ensure numeric
      dateMap.get(day)[lbl] = Number(r.count ?? 0);
    });
  });

  // Fill missing company keys with 0 so legends/lines always appear
  const rows = Array.from(dateMap.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((row) => {
      const filled = { ...row };
      labels.forEach((lbl) => {
        if (filled[lbl] == null) filled[lbl] = 0;
      });
      return filled;
    });

  return rows;
};

// First available day of each month as X ticks
const buildMonthTicks = (rows) => {
  const seen = new Set(); // 'YYYY-M'
  const ticks = [];
  for (const row of rows) {
    const d = new Date(row.name);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!seen.has(key)) {
      seen.add(key);
      ticks.push(row.name); // exact x value in data
    }
  }
  return ticks;
};

// Month label formatter (e.g., "January")
const monthTickFormatter = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return MONTHS[d.getMonth()];
};

/* ---------- FILTERED (city/postcode) daily helper (no averaging) ---------- */
// Accepts groupedRows from companyToPath responses.
// Tries 'timestamp' first; falls back to 'date' if needed.
const combineFilteredDailyByDate = (groupedRows, year = YEAR) => {
  const dateMap = new Map(); // 'YYYY-MM-DD' -> row
  const labels = Object.keys(groupedRows);

  labels.forEach((lbl) => {
    (groupedRows[lbl] || []).forEach((r) => {
      const day = String(r?.date || "").slice(0, 10);
      if (!day) return;

      // Keep same year scoping as your params
      if (year && day.slice(0, 4) !== String(year)) return;

      if (!dateMap.has(day)) dateMap.set(day, { name: day });
      dateMap.get(day)[lbl] = Number(r.count ?? 0);
    });
  });

  const rows = Array.from(dateMap.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((row) => {
      const filled = { ...row };
      labels.forEach((lbl) => {
        if (filled[lbl] == null) filled[lbl] = 0;
      });
      return filled;
    });

  return rows;
};

/* ---------------- UK-wide fetcher ---------------- */
const fetchUKArchivePerCompany = async (companies) => {
  // Read token at call-time (not module init)
  const token =
    sessionStorage.getItem("accessToken") ||
    localStorage.getItem("accessToken");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  if (!headers.Authorization)
    throw new Error("Missing auth token for UK-wide endpoints.");

  const tasks = companies.map((c) => {
    const url = companyToArchiveUrl[c.value];
    return {
      label: c.label,
      endpoint: url,
      req: instance.get(url, { headers }),
    };
  });

  const settled = await Promise.allSettled(tasks.map((t) => t.req));
  const grouped = {};
  settled.forEach((res, idx) => {
    const { label, endpoint } = tasks[idx];
    if (res.status === "fulfilled" && Array.isArray(res.value?.data)) {
      grouped[label] = res.value.data;
      logFetch(label, endpoint, {}, "success", { rows: grouped[label].length });
    } else {
      grouped[label] = [];
      logFetch(label, endpoint, {}, "error", { error: res.reason?.message });
    }
  });

  const anyData = Object.values(grouped).some((arr) => arr.length > 0);
  if (!anyData) throw new Error("UK archive endpoints returned no data.");
  return grouped;
};

/* ---------------- component ---------------- */
const ContinuousDevicesCount = ({ isOpen }) => {
  const [showFilter, setShowFilter] = useState(false);

  // UK-wide (default) line chart state
  const [ukChartData, setUkChartData] = useState(
    makeSkeleton(companyOptions.map((c) => c.label))
  );
  const [ukTicks, setUkTicks] = useState([]); // X-axis ticks (first day of each month)
  const [ukLoading, setUkLoading] = useState(true);
  const [ukError, setUkError] = useState("");

  // FILTERED (Daily Line) — now using daily rows, no averaging
  const [chartData, setChartData] = useState(
    makeSkeleton(companyOptions.map((c) => c.label))
  );
  const [filteredTicks, setFilteredTicks] = useState([]); // month ticks for filtered daily chart
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const defaultFormValues = {
    city: null,
    postcode: null,
    companies: [],
    ratingRange: [0, 5],
    reviewMin: undefined,
    reviewMax: undefined,
  };

  const [summary, setSummary] = useState("");

  // Shop Summary: tabs + loading/error
  const [shopCompanyLabels, setShopCompanyLabels] = useState([]);
  const [shopActiveCompany, setShopActiveCompany] = useState("");

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

  // Load UK-wide chart on mount (daily points, month ticks)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setUkLoading(true);
        setUkError("");
        const grouped = await fetchUKArchivePerCompany(companyOptions);
        if (!mounted) return;

        const ukRows = combineUKDailyByDate(grouped); // daily rows (no averaging)
        setUkChartData(ukRows);
        setUkTicks(buildMonthTicks(ukRows)); // ticks at month boundaries
      } catch (e) {
        if (!mounted) return;
        setUkError("Failed to load UK-wide data.");
      } finally {
        if (mounted) setUkLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
        setLoading(false);
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

      const grouped = await fetchPerCompany(values.companies, {
        ...paramsCommon,
      });

      // ✅ Build DAILY rows for the filtered endpoints (no averaging)
      const dailyRows = combineFilteredDailyByDate(grouped, YEAR);
      setChartData(dailyRows);
      setFilteredTicks(buildMonthTicks(dailyRows));

      const shopLabels = values.companies.map((c) => c.label);
      setShopCompanyLabels(shopLabels);
      setShopActiveCompany(shopLabels[0] || "");
      setShowFilter(false);
    } catch (err) {
      console.error(err);
      const status = err?.response?.status;
      if (status === 401) setError("Session expired. Please log in again.");
      else if (status === 403)
        setError("You don't have permission to view this data.");
      else setError("Request failed. Please try again.");

      const labels = (values.companies || []).map((c) => c.label);
      setChartData(makeSkeleton(labels));
      setFilteredTicks([]);
      setError("Filtering failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
    setError("");
    setChartData(makeSkeleton(companyOptions.map((c) => c.label)));
    setFilteredTicks([]);
    setShopCompanyLabels([]);
    setShopActiveCompany("");
  };

  return (
    <div
      className={`max-w-screen w-[calc(100%-80px)] p-6 absolute top-0 left-20 flex flex-col h-full overflow-y-auto bg-stone-50 z-40 transition-transform duration-700 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="mx-4 flex justify-between items-center pb-4">
        <span className="text-2xl font-bold">Continuous Devices Count</span>
      </div>

      <div className="flex flex-col gap-4 py-2">
        {/* UK-WIDE (Default) */}
        <div className="p-4 border rounded-xl shadow-lg relative">
          <p className="text-xl p-2">{YEAR} — UK-Wide Daily Chart</p>
          <hr />
          {ukError && (
            <div className="my-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {ukError}
            </div>
          )}
          {ukLoading ? (
            <div className="mt-5 w-full h-[350px] flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-lg">
              <ThreeDots
                visible
                height="50"
                width="50"
                color="#ffa500"
                radius="9"
                ariaLabel="three-dots-loading"
              />
            </div>
          ) : (
            <LineChartSection
              data={ukChartData}
              xTicks={ukTicks} // first day of each month present
              xTickFormatter={(v) => monthTickFormatter(v)} // show month name
            />
          )}
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
        {/* FILTERED (Daily) — behaves like UK-wide (no averaging) */}
        <div className="p-4 border rounded-xl shadow-lg relative">
          <p className="text-xl p-2">{YEAR} — Filtered Daily Chart</p>
          <hr />
          {error && (
            <div className="my-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </div>
          )}
          {loading ? (
            <div className="mt-5 w-full h-[350px] flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-lg">
              <ThreeDots
                visible
                height="50"
                width="50"
                color="#ffa500"
                radius="9"
                ariaLabel="three-dots-loading"
              />
            </div>
          ) : (
            <LineChartSection
              data={chartData}
              xTicks={filteredTicks}
              xTickFormatter={(v) => monthTickFormatter(v)}
            />
          )}
        </div>
      </div>

      {showFilter && (
        <FormProvider {...methods}>
          <FilterDrawer
            isOpen={showFilter}
            onClose={() => setShowFilter(false)}
            onSubmit={onSubmit}
            onClear={onClear}
            companyOptions={companyOptions}
            containerStyle={{ top: 260, right: 25 }}
          />
        </FormProvider>
      )}
    </div>
  );
};

export default ContinuousDevicesCount;
