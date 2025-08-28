import { useEffect, useState } from "react";
import LineChartSection from "./LineChartSection";
import { useForm, FormProvider } from "react-hook-form";
import instance from "../../api/continuousApi";
import FilterDrawer from "./FilterDrawer";
import { ThreeDots } from "react-loader-spinner";

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
    req: instance.get(
      companyToPath(c.value),
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
      row[lbl] = Math.round(avg);
    });

    return row;
  });
};

/* ---------------- component ---------------- */
const ContinuousDevicesCount = ({ isOpen }) => {
  const [showFilter, setShowFilter] = useState(false);

  // MONTHLY (Line)
  const [chartData, setChartData] = useState(
    makeSkeleton(companyOptions.map((c) => c.label))
  );
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
        ...buildLocationParam(values),
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
      });
      setChartData(toMonthlyAvgPerCompany(grouped, YEAR));

      // SHOP SUMMARY — setup tabs and fetch with independent month
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
        {/* MONTHLY (Line) */}
        <div className="p-4 border rounded-xl shadow-lg relative">
          <p className="text-xl p-2">{YEAR}</p>
          <hr />
          {error && (
            <div className="my-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-5 w-full h-[350px] flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-lg">
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
            <LineChartSection data={chartData} />
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
          />
        </FormProvider>
      )}
    </div>
  );
};

export default ContinuousDevicesCount;
