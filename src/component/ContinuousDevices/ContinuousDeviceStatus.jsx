import { useEffect, useState } from "react";
import Select from "react-select";
import LineChartSection from "./LineChartSection";
import { useForm, Controller } from "react-hook-form";
import ReactSlider from "react-slider";
import instance from "../../api/continuousApi";
import DailyBarChartSection from "./DailyBarChartSection";

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

const companyToDailyPath = (value) => {
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
  const companies = (
    values.companies?.length ? values.companies : [{ label: "FoodHub" }]
  ).map((c) => c.label);
  const companiesText = joinNatural(companies);

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

// ---------- helpers ----------
const makeSkeleton = (companyLabels = []) =>
  MONTHS.map((m) => {
    const row = { name: m };
    companyLabels.forEach((lbl) => (row[lbl] = 0));
    return row;
  });

const fetchPerCompany = async (companies, params) => {
  const selected = companies?.length
    ? companies
    : [{ value: "foodhub", label: "FoodHub" }];

  const tasks = selected.map((c) => ({
    label: c.label,
    req: instance.get(companyToPath(c.value), { params }),
  }));

  const settled = await Promise.allSettled(tasks.map((t) => t.req));

  const grouped = {};
  settled.forEach((res, idx) => {
    const label = tasks[idx].label;
    if (res.status === "fulfilled" && Array.isArray(res.value?.data)) {
      grouped[label] = res.value.data;
    } else {
      grouped[label] = []; // keep key so UI is stable
    }
  });

  const anyData = Object.values(grouped).some((arr) => arr.length > 0);
  if (!anyData) throw new Error("All requests failed or returned empty.");

  return grouped;
};

const fetchDailyPerCompany = async (companies, params) => {
  const selected = companies?.length
    ? companies
    : [{ value: "foodhub", label: "FoodHub" }];

  const tasks = selected.map((c) => ({
    label: c.label,
    req: instance.get(companyToDailyPath(c.value), { params }),
  }));

  const settled = await Promise.allSettled(tasks.map((t) => t.req));

  const grouped = {};
  settled.forEach((res, idx) => {
    const label = tasks[idx].label;
    if (res.status === "fulfilled") {
      const arr = res.value?.data?.daily_stats;
      grouped[label] = Array.isArray(arr) ? arr : [];
    } else {
      grouped[label] = [];
    }
  });

  const anyData = Object.values(grouped).some((arr) => arr.length > 0);
  if (!anyData) throw new Error("All daily requests failed or returned empty.");

  return grouped;
};

const toMonthlyAvgPerCompany = (groupedRows, year = YEAR) => {
  const now = new Date();
  const currentMonthIndex = now.getMonth(); // 0=Jan
  const labels = Object.keys(groupedRows);

  // build buckets by label -> Map("YYYY-MM" -> [counts])
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

  // compose chart rows
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

// ---------- component ----------
const ContinuousDeviceStatus = ({ isOpen }) => {
  const [showFilter, setShowFilter] = useState(false);
  const [chartData, setChartData] = useState(
    makeSkeleton(companyOptions.map((c) => c.label))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const defaultFormValues = {
    city: { value: "glasgow", label: "Glasgow" },
    companies: [{ value: "foodhub", label: "FoodHub" }],
    ratingRange: [0, 5],
    reviewMin: undefined,
    reviewMax: undefined,
  };
  const [summary, setSummary] = useState(buildFilterSummary(defaultFormValues));

  // Daily: always visible
  const [dailyMonth, setDailyMonth] = useState(new Date().getMonth() + 1);
  const [dailyData, setDailyData] = useState(
    // empty chart by default
    makeDailySkeleton(["FoodHub"], YEAR, dailyMonth)
  );
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [errorDaily, setErrorDaily] = useState("");
  const [lastFilters, setLastFilters] = useState(defaultFormValues);
  const [selectedCompany, setSelectedCompany] = useState("FoodHub"); // tabs

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting },
  } = useForm({ defaultValues: defaultFormValues });

  const refreshDaily = async (filters, monthNum) => {
    setErrorDaily("");
    setLoadingDaily(true);
    try {
      const params = { year: YEAR, month: monthNum, city: filters.city?.value };
      const grouped = await fetchDailyPerCompany(filters.companies, params);
      setDailyData(toDailyRowsPerCompany(grouped, YEAR, monthNum));
    } catch (e) {
      console.error(e);
      const labels = (filters.companies || []).map((c) => c.label);
      setDailyData(
        makeDailySkeleton(labels.length ? labels : ["FoodHub"], YEAR, monthNum)
      );
      setErrorDaily("Failed to load daily stats.");
    } finally {
      setLoadingDaily(false);
    }
  };

  const onSubmit = async (values) => {
    setError("");
    setLoading(true);
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
      const params = {
        year: YEAR,
        city: values.city?.value,
        min_rating: minRating,
        max_rating: maxRating,
      };
      if (values.reviewMin !== "" && values.reviewMin != null)
        params.min_reviews = Number(values.reviewMin);
      if (values.reviewMax !== "" && values.reviewMax != null)
        params.max_reviews = Number(values.reviewMax);

      const grouped = await fetchPerCompany(values.companies, params);
      setChartData(toMonthlyAvgPerCompany(grouped, YEAR));
      setSummary(buildFilterSummary(values));
      setShowFilter(false);

      // daily
      setLastFilters(values);
      await refreshDaily(values, dailyMonth);

      // set active tab to first selected company
      const firstLabel = (
        values.companies?.length ? values.companies : [{ label: "FoodHub" }]
      )[0].label;
      setSelectedCompany(firstLabel);
    } catch (e) {
      console.error(e);
      const labels = (values.companies || []).map((c) => c.label);
      setChartData(makeSkeleton(labels));
      setError("Filtering failed. Please try again.");

      // keep daily visible but empty
      setDailyData(
        makeDailySkeleton(
          labels.length ? labels : ["FoodHub"],
          YEAR,
          dailyMonth
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!lastFilters) return;
    refreshDaily(lastFilters, dailyMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyMonth]);

  const onClear = async () => {
    const defaults = {
      city: { value: "glasgow", label: "Glasgow" },
      companies: [{ value: "foodhub", label: "FoodHub" }],
      ratingRange: [0, 5],
      reviewMin: "",
      reviewMax: "",
    };
    reset(defaults);
    setError("");
    setLoading(true);
    try {
      const params = { year: YEAR, city: defaults.city.value };
      const grouped = await fetchPerCompany(defaults.companies, params);
      setChartData(toMonthlyAvgPerCompany(grouped, YEAR));
      setSummary(buildFilterSummary(defaults));
      setLastFilters(defaults);
      setSelectedCompany("FoodHub");

      // keep daily visible but empty
      setDailyData(makeDailySkeleton(["FoodHub"], YEAR, dailyMonth));
      setErrorDaily("");
    } catch (e) {
      console.error(e);
      setChartData(makeSkeleton(["FoodHub"]));
      setError("Failed to reload defaults.");
      setDailyData(makeDailySkeleton(["FoodHub"], YEAR, dailyMonth));
    } finally {
      setLoading(false);
    }
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

          <p
            className="mx-2 mb-3 text-sm text-gray-700"
            aria-live="polite"
            role="status"
          >
            {summary}
          </p>

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

        {/* DAILY: always rendered */}
        <div className="relative">
          {errorDaily && (
            <div className="my-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {errorDaily}
            </div>
          )}
          <DailyBarChartSection
            data={dailyData}
            companyLabels={(lastFilters.companies?.length
              ? lastFilters.companies
              : [{ label: "FoodHub" }]
            ).map((c) => c.label)}
            activeCompany={selectedCompany}
            setActiveCompany={setSelectedCompany}
            month={dailyMonth}
            setMonth={setDailyMonth}
            openColor="#22c55e" // green
            closedColor="#ef4444" // red
          />
          {loadingDaily && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] rounded-xl flex items-center justify-center text-gray-600">
              Loading daily…
            </div>
          )}
        </div>
      </div>

      {showFilter && (
        <div
          className="fixed right-6 top-6 w-96 max-w-[95vw] bg-white border shadow-xl rounded-xl z-50"
          role="dialog"
          aria-label="Companies Filter"
        >
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col h-full"
          >
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <span className="text-lg font-semibold">Companies Filter</span>
              <button
                type="button"
                onClick={() => setShowFilter(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div className="border-b pb-4">
                <label className="block text-sm mb-1">Select City</label>
                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={cityOptions}
                      placeholder="Choose a city..."
                      isClearable
                    />
                  )}
                />
              </div>

              <div className="border-b pb-4">
                <label className="block text-sm mb-1">Select Companies</label>
                <Controller
                  name="companies"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={companyOptions}
                      isMulti
                      placeholder="Choose companies..."
                      closeMenuOnSelect={false}
                    />
                  )}
                />
              </div>

              <div className="border-b pb-4">
                <p className="text-lg font-normal mb-2">Filter by Rating</p>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Minimum</span>
                  <span>Maximum</span>
                </div>
                <Controller
                  name="ratingRange"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <div className="px-1 py-2">
                      <ReactSlider
                        className="relative w-full h-6 my-4"
                        thumbClassName="bg-orange-500 h-10 w-10 rounded-full cursor-grab border-2 border-white flex items-center justify-center text-white font-bold transform -translate-y-1/2 top-1/2"
                        trackClassName="bg-gray-300 h-1 top-1/2 transform -translate-y-1/2 rounded"
                        min={0}
                        max={5}
                        step={0.1}
                        minDistance={0.1}
                        value={value}
                        onChange={onChange}
                        pearling
                        renderThumb={(props, state) => {
                          const { key, ...rest } = props;
                          return (
                            <div key={key} {...rest}>
                              {state.valueNow.toFixed(1)}
                            </div>
                          );
                        }}
                      />
                    </div>
                  )}
                />
              </div>

              <div>
                <p className="text-lg font-normal mb-2">Set Review Range</p>
                <div className="flex justify-between gap-4">
                  <div className="flex-1">
                    <label className="text-sm mb-1 block">Minimum</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      {...register("reviewMin", {
                        setValueAs: (v) => (v === "" ? undefined : Number(v)),
                      })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm mb-1 block">Maximum</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="1000"
                      {...register("reviewMax", {
                        setValueAs: (v) => (v === "" ? undefined : Number(v)),
                      })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t flex gap-2">
              <button
                type="button"
                onClick={onClear}
                className="w-2/5 py-2 bg-white border-2 border-orange-500 text-orange-600 rounded hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-3/5 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-orange-300"
              >
                {isSubmitting ? "Filtering..." : "Filter"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ContinuousDeviceStatus;
