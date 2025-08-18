import React from "react";
import AsyncSelect from "react-select/async";
import ReactSlider from "react-slider";
import instance from "../../api/api";
import { Controller, useFormContext } from "react-hook-form";

const MIN_QUERY_LEN = 2;

const normalizeCities = (data) => {
  const list = Array.isArray(data) ? data : data?.results || data?.data || [];
  // map {id, district} -> { value, label, id }
  const mapped = list
    .map((item) => {
      if (!item?.district) return null;
      return {
        value: String(item.district).toLowerCase(), // used later as ?city=
        label: item.district, // shown to user
        id: item.id, // keep original id if you need it
      };
    })
    .filter(Boolean);

  // de-dupe by district (case-insensitive), just in case
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
  } catch (e) {
    console.error("City search failed:", e?.message || e);
    return [];
  }
};

const FilterDrawer = ({
  isOpen,
  onClose,
  onSubmit,
  onClear,
  companyOptions = [],
}) => {
  const {
    control,
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useFormContext();

  if (!isOpen) return null;

  return (
    <div
      className="fixed right-6 top-6 w-96 max-w-[95vw] bg-white border shadow-xl rounded-xl z-50"
      role="dialog"
      aria-label="Companies Filter"
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
          {/* City (async search) */}
          <div className="border-b pb-4">
            <label className="block text-sm mb-1">Search City</label>
            <Controller
              name="city"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  {...field}
                  cacheOptions
                  defaultOptions={false} // user must type to see results
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
                />
              )}
            />
          </div>

          {/* Companies */}
          <div className="border-b pb-4">
            <label className="block text-sm mb-1">Select Companies</label>
            <Controller
              name="companies"
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
                />
              )}
            />
          </div>

          {/* Rating */}
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

          {/* Reviews */}
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
  );
};

export default FilterDrawer;
