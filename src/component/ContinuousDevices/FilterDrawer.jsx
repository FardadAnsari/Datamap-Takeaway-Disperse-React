import { useEffect, useRef, useState } from "react";
import AsyncSelect from "react-select/async";
import { default as StaticSelect } from "react-select";
import ReactSlider from "react-slider";
import instance from "../../api/api";
import { Controller, useFormContext } from "react-hook-form";
import AutoCompletionMultiSelectStyles from "../AutoCompletionMultiSelectStyles";

const MIN_QUERY_LEN = 2;

const normalizeCities = (data) => {
  const list = Array.isArray(data) ? data : data?.results || data?.data || [];
  const mapped = list
    .map((item) => {
      if (!item?.district) return null;
      return {
        value: String(item.district).toLowerCase(),
        label: item.district,
        id: item.id,
      };
    })
    .filter(Boolean);

  const seen = new Set();
  return mapped.filter((o) => {
    const key = o.value;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const loadCityOptions = async (inputValue) => {
  const q = String(inputValue || "").trim();
  if (q.length < MIN_QUERY_LEN) return [];
  try {
    const { data } = await instance.get("/api/v1/companies/city-search/", {
      params: { city: q },
    });
    console.log(data);
    return normalizeCities(data);
  } catch (err) {
    console.error("City search failed:", err?.message || err);
    return [];
  }
};

const FilterDrawer = ({
  isOpen,
  onClose,
  onSubmit,
  onClear,
  companyOptions = [],
  containerStyle = {},
}) => {
  const {
    control,
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
    watch,
    setValue,
  } = useFormContext();

  const [postcodeOptions, setPostcodeOptions] = useState([]);
  const [loadingPostcodes, setLoadingPostcodes] = useState(false);
  const postcodeCache = useRef(new Map());

  const city = watch("city");

  useEffect(() => {
    setValue("postcode", null);

    if (!city) {
      setPostcodeOptions([]);
      return;
    }

    const cityKey = city.label || city.value;
    if (postcodeCache.current.has(cityKey)) {
      setPostcodeOptions(postcodeCache.current.get(cityKey));
      return;
    }

    const fetchPostcodes = async () => {
      setLoadingPostcodes(true);
      try {
        const { data } = await instance.get(
          "/api/v1/companies/postcode-search/",
          { params: { district: cityKey } }
        );

        const pcs = (
          Array.isArray(data) ? data : data?.results || data?.data || []
        )
          .map((item) => item?.postcode_area)
          .filter(Boolean);

        const opts = pcs.map((pc) => ({ value: pc, label: pc }));
        postcodeCache.current.set(cityKey, opts);
        setPostcodeOptions(opts);
      } catch (err) {
        console.error("Postcode fetch failed:", err?.message || err);
        setPostcodeOptions([]);
      } finally {
        setLoadingPostcodes(false);
      }
    };

    fetchPostcodes();
  }, [city, setValue]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed w-96 max-w-[95vw] bg-white border shadow-xl rounded-xl z-50"
      role="dialog"
      aria-label="Companies Filter"
      style={containerStyle}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <span className="text-lg font-semibold">Companies Filter</span>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Companies */}
          <div className="border-b pb-4">
            <label className="block text-sm mb-1">Select Companies</label>
            <Controller
              name="companies"
              rules={{ required: "Please select at least one company." }}
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  {...field}
                  defaultOptions={companyOptions}
                  loadOptions={async (input) =>
                    companyOptions.filter((o) =>
                      o.label
                        .toLowerCase()
                        .includes((input || "").toLowerCase())
                    )
                  }
                  isMulti
                  placeholder="Choose companies…"
                  closeMenuOnSelect={false}
                  onChange={(opt) => field.onChange(opt)}
                  value={field.value || []}
                  getOptionLabel={(opt) => opt.label}
                  getOptionValue={(opt) => opt.value}
                  styles={AutoCompletionMultiSelectStyles}
                />
              )}
            />
            {errors.companies && (
              <p id="companies-error" className="mt-1 text-sm text-red-600">
                {errors.companies.message}
              </p>
            )}
          </div>
          {/* City (async search) */}
          <div className="border-b pb-4">
            <label className="block text-sm mb-1">Search City</label>
            <Controller
              name="city"
              control={control}
              rules={{ required: "City is required." }}
              render={({ field }) => (
                <AsyncSelect
                  {...field}
                  cacheOptions
                  defaultOptions={false}
                  loadOptions={loadCityOptions}
                  placeholder="Type to search a city…"
                  noOptionsMessage={({ inputValue }) =>
                    (inputValue || "").trim().length < MIN_QUERY_LEN
                      ? `Type at least ${MIN_QUERY_LEN} letters`
                      : "No matches"
                  }
                  isClearable
                  onChange={(opt) => field.onChange(opt)}
                  onBlur={field.onBlur}
                  value={field.value || null}
                  getOptionLabel={(opt) => opt.label}
                  getOptionValue={(opt) => opt.value}
                  styles={AutoCompletionMultiSelectStyles}
                />
              )}
            />
            {errors.city && (
              <p id="city-error" className="mt-1 text-sm text-red-600">
                {errors.city.message}
              </p>
            )}
          </div>
          {/* Postcode (depends on city) */}
          <div className="border-b pb-4">
            <label className="block text-sm mb-1">Select Postcode</label>
            <Controller
              name="postcode"
              control={control}
              render={({ field }) => (
                <StaticSelect
                  {...field}
                  options={postcodeOptions}
                  isClearable
                  isDisabled={!city}
                  placeholder={
                    city ? "Choose a postcode…" : "Select a city first…"
                  }
                  noOptionsMessage={() =>
                    loadingPostcodes
                      ? "Loading postcodes…"
                      : city
                        ? "No postcodes found."
                        : "Select a city first."
                  }
                  onChange={(opt) => field.onChange(opt)}
                  value={field.value || null}
                  getOptionLabel={(opt) => opt.label}
                  getOptionValue={(opt) => opt.value}
                  styles={AutoCompletionMultiSelectStyles}
                />
              )}
            />
          </div>
          {/* Rating */}
          <div className="border-b pb-4">
            <p className="text-sm font-normal mb-2">Filter by Rating</p>
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
          {/* Reviews */}
          <div>
            <p className="text-sm font-normal mb-2">Set Review Range</p>
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
  );
};

export default FilterDrawer;
