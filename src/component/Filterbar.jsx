import Select from "react-select";
import { Controller, useWatch } from "react-hook-form";
import ReactSlider from "react-slider";
import AutoCompletionMultiSelectStyles from "./AutoCompletionMultiSelectStyles";
import { useUser } from "../api/userPermission";

const Filterbar = ({
  title,
  isOpen,
  control,
  register,
  handleSubmit,
  onSubmit,
  onReset,
  error,
  loading,
  fields = [],
  disableSubmit = false,
  watch,
  companyIcons,
  reqRemainder,
}) => {
  const watchedFields = useWatch({ control });

  const areAllInputsEmpty = () => {
    return Object.values(watchedFields).every(
      (val) =>
        val === undefined ||
        val === null ||
        (typeof val === "string" && val.trim() === "") ||
        (Array.isArray(val) && val.length === 0) ||
        (typeof val === "object" && Object.keys(val).length === 0)
    );
  };

  const { user } = useUser();

  return (
    <div
      className={`w-80 absolute top-0 left-20 flex flex-col h-full bg-white z-10 transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div
        className="mx-4 flex py-2 justify-between items-center border-b-2"
        style={{ height: "10%" }}
      >
        <span className="text-xl font-bold">{title}</span>
        {title === "Companies Filter" && user?.isLimited && (
          <div className="flex text-orange-500 font-bold gap-1">
            <span>{reqRemainder}</span>
            <span>/</span>
            <span>{user?.requestInfo.totalRequest}</span>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-4 flex flex-col"
        style={{ height: "90%" }}
      >
        <div className="px-2 flex-1 overflow-y-auto">
          {fields.map((field, index) => {
            switch (field.type) {
              case "text":
                return (
                  <div key={index} className="border-b pb-3">
                    <input
                      type="text"
                      {...register(field.name)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      placeholder={field.placeholder || ""}
                    />
                  </div>
                );
              case "multi-select":
              case "single-select":
                return (
                  <div key={index} className="border-b py-3">
                    <p className="text-lg font-normal mb-2">{field.label}</p>
                    <Controller
                      name={field.name}
                      control={control}
                      defaultValue={
                        field.defaultValue ||
                        (field.type === "multi-select" ? [] : null)
                      }
                      render={({ field: controllerField }) => (
                        <Select
                          {...controllerField}
                          className="mb-4"
                          placeholder={field.placeholder || "Select"}
                          options={field.options || []}
                          isSearchable
                          isMulti={field.type === "multi-select"}
                          isClearable={field.type === "single-select"}
                          styles={AutoCompletionMultiSelectStyles}
                        />
                      )}
                    />
                  </div>
                );
              case "checkbox-list":
                return (
                  <div key={index} className="border-b py-3">
                    <p className="text-lg font-normal mb-2">{field.label}</p>
                    {field.options.map((option) => {
                      const Icon = companyIcons?.[option.iconKey];
                      return (
                        <div
                          key={option.value}
                          className="flex items-center justify-between mb-2"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={option.value}
                              {...register(field.name)}
                              value={option.value}
                              className="h-4 w-4 text-orange-600 border-gray-500 rounded focus:ring-orange-500 accent-orange-400"
                            />
                            <label htmlFor={option.value} className="text-sm">
                              {option.label}
                            </label>
                          </div>
                          {Icon && <Icon width={24} height={24} />}
                        </div>
                      );
                    })}
                  </div>
                );
              case "rating-slider":
                return (
                  <div key={index} className="border-b py-3">
                    <p className="text-lg font-normal mb-2">{field.label}</p>
                    <Controller
                      name={field.name}
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <div className="px-2 py-2">
                          <ReactSlider
                            className="relative w-full h-6 my-4"
                            thumbClassName="bg-orange-500 h-10 w-10 rounded-full cursor-grab border-2 border-white flex items-center justify-center text-white font-bold transform -translate-y-1/2 top-1/2"
                            trackClassName="bg-gray-300 h-1 top-1/2 transform -translate-y-1/2 rounded"
                            min={0}
                            max={5}
                            step={0.1}
                            value={value}
                            onChange={onChange}
                            renderThumb={(props, state) => {
                              // pull the key out first
                              const { key, ...rest } = props;
                              return (
                                <div key={key} {...rest}>
                                  {state.valueNow}
                                </div>
                              );
                            }}
                          />
                        </div>
                      )}
                    />
                  </div>
                );
              case "review-range":
                return (
                  <div key={index} className="py-3">
                    <p className="text-lg font-normal mb-2">{field.label}</p>
                    <div className="flex justify-between mb-4">
                      <div className="flex flex-col">
                        <label htmlFor="minReview" className="text-sm mb-1">
                          Min Reviews
                        </label>
                        <input
                          type="number"
                          id="minReview"
                          {...register(`${field.name}.min`, field.minRules)}
                          className="w-28 px-1 py-2 border border-gray-300 rounded"
                          placeholder="Min"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label htmlFor="maxReview" className="text-sm mb-1">
                          Max Reviews
                        </label>
                        <input
                          type="number"
                          id="maxReview"
                          {...register(`${field.name}.max`, field.maxRules)}
                          className="w-28 px-1 py-2 border border-gray-300 rounded"
                          placeholder="Max"
                        />
                      </div>
                    </div>
                  </div>
                );
              default:
                return null;
            }
          })}
        </div>

        {error && (
          <div className="text-center text-red-600 bg-red-100 p-2 gap-2 rounded my-2">
            {error}
          </div>
        )}

        <div className="flex py-2 gap-2 border-t-2">
          <button
            type="button"
            onClick={onReset}
            className="w-2/5 py-2 bg-white border-2 border-orange-500 text-orange-600 rounded hover:bg-gray-50 focus:outline-none"
          >
            Clear
          </button>
          <button
            type="submit"
            className="w-3/5 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 focus:outline-none disabled:bg-orange-300"
            disabled={loading || disableSubmit}
          >
            {loading
              ? "Is Loading ..."
              : areAllInputsEmpty()
                ? "View All"
                : "Filter"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Filterbar;
