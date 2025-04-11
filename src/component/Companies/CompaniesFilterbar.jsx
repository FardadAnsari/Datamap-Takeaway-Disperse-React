import { IoIosArrowBack } from "react-icons/io";
import Select from "react-select";
import { Controller } from "react-hook-form";
import ReactSlider from "react-slider";
import AutoCompletionMultiSelectStyles from "../AutoCompletionMultiSelectStyles";

import companyIcons from "../../assets/checkbox-icon/checkboxIcons";
import { useUser } from "../../api/userPermission";

// CompaniesFilterbar component to handle filtering for companies and Google Business data
const CompaniesFilterbar = ({
  isOpen, // Boolean to control the visibility of the filter bar
  setIsFilterOpen, // Function to toggle the filter bar's visibility
  registerCompanies, // React Hook Form's register function for companies form
  handleSubmitCompanies, // React Hook Form's handleSubmit function for companies form
  controlCompanies, // React Hook Form's control object for companies form
  watchCompanies, // React Hook Form's watch function for companies form
  region, // List of regions for filtering
  cuisine, // List of cuisines for filtering
  companies, // List of companies for filtering
  onSubmitCompanies, // Function to handle companies form submission
  loadingCompanies, // Boolean to indicate if companies data is loading
  errorCompanies, // Error message for companies form
  handleResetCompanies, // Function to reset the companies form
  reqRemainder, //Remainder of filter requests limit
}) => {
  // Get the user from the context
  const { user } = useUser();
  return (
    // Main container for the filter bar
    <div
      className={`w-80 absolute top-0 left-20 flex flex-col h-full bg-white z-10 transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Header section with filter title and close button */}
      <div
        className="mx-4 flex py-2 justify-between items-center border-b-2"
        style={{ height: "10%" }}
      >
        <span className="text-xl font-normal">Companies Filter</span>
        <div className="flex items-center gap-3">
          {user?.isLimited && (
            <div className="flex text-orange-500 font-bold gap-1">
              <span>{reqRemainder}</span>
              <span>/</span>
              <span>{user?.requestInfo.totalRequest}</span>
            </div>
          )}
          <button
            className="w-8 p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none"
            onClick={() => setIsFilterOpen(false)}
          >
            <IoIosArrowBack />
          </button>
        </div>
      </div>
      {/* Companies filter form */}
      <form
        onSubmit={handleSubmitCompanies(onSubmitCompanies)} // Handle form submission
        className="p-4 flex flex-col"
        style={{ height: "90%" }}
      >
        <div className="px-2 flex-1 overflow-y-auto">
          {/* Search input for shops */}
          <div className="border-b pb-3">
            <input
              type="text"
              {...registerCompanies("searchTerm")} // Register search term input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              placeholder="Search Shop"
            />
          </div>

          {/* Checkbox list for selecting companies */}
          <div className="border-b py-3">
            <p className="text-lg font-normal mb-2">
              Select Company (required)
            </p>
            {companies.map((company) => {
              const IconComponent =
                companyIcons[company.name.replace(/\s+/g, "").toLowerCase()];
              return (
                <div
                  key={company.id}
                  className="flex items-center justify-between mb-2"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={company.id}
                      {...registerCompanies("selectedCompanies")} // Register company selection
                      value={company.apiUrl}
                      className="h-4 w-4 text-orange-600 border-gray-500 rounded focus:ring-orange-500 accent-orange-400"
                    />
                    <label htmlFor={company.id} className="text-sm">
                      {company.name}
                    </label>
                  </div>
                  {IconComponent && <IconComponent width={24} height={24} />}
                </div>
              );
            })}
          </div>

          {/* Dropdown for selecting regions */}
          <div className="border-b py-3">
            <p className="text-lg font-normal mb-2">Select Regions</p>
            <Controller
              name="region"
              control={controlCompanies} // Control the region input
              defaultValue={[]}
              render={({ field }) => (
                <Select
                  {...field}
                  className="mb-4"
                  placeholder="Select Regions"
                  options={region.map((r) => ({
                    value: r.value,
                    label: r.label,
                  }))}
                  onChange={field.onChange}
                  isSearchable
                  isMulti
                  styles={AutoCompletionMultiSelectStyles}
                />
              )}
            />
          </div>

          {/* Dropdown for selecting categories (cuisines) */}
          <div className="border-b py-3">
            <p className="text-lg font-normal mb-2">Select Categories</p>
            <Controller
              name="cuisine"
              control={controlCompanies} // Control the cuisine input
              defaultValue={[]}
              render={({ field }) => (
                <Select
                  {...field}
                  className="mb-4"
                  placeholder="Select Categories"
                  options={cuisine.map((c) => ({
                    value: c.cuisine_name.toLowerCase(),
                    label: c.cuisine_name,
                  }))}
                  onChange={field.onChange}
                  isSearchable
                  isMulti
                  styles={AutoCompletionMultiSelectStyles}
                />
              )}
            />
          </div>

          {/* Slider for selecting rating range */}
          <div className="border-b py-3">
            <p className="text-lg font-normal mb-2">Select Rating Range</p>
            <Controller
              name="ratingRange"
              control={controlCompanies} // Control the rating range input
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
                    ariaLabel={["Minimum rating", "Maximum rating"]}
                    ariaValuetext={(state) => `Rating: ${state.valueNow}`}
                    renderThumb={(props, state) => (
                      <div {...props}>{state.valueNow}</div>
                    )}
                  />
                </div>
              )}
            />
          </div>

          {/* Inputs for selecting review range */}
          <div className="py-3">
            <p className="text-lg font-normal mb-2">Select Review Range</p>
            <div className="flex justify-between mb-4">
              <div className="flex flex-col">
                <label htmlFor="minReview" className="text-sm mb-1">
                  Min Reviews
                </label>
                <input
                  type="number"
                  id="minReview"
                  {...registerCompanies("reviewRange.min", {
                    valueAsNumber: true,
                    min: {
                      value: 0,
                      message: "Minimum reviews must be at least 0",
                    },
                    validate: (value) =>
                      isNaN(value) ||
                      value <= watchCompanies("reviewRange.max") ||
                      "Min reviews cannot exceed Max reviews",
                  })}
                  className="w-28 px-1 py-2 border border-gray-300 rounded"
                  min={0}
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
                  {...registerCompanies("reviewRange.max", {
                    valueAsNumber: true,
                    min: {
                      value: 0,
                      message: "Maximum reviews must be at least 0",
                    },
                    validate: (value) =>
                      isNaN(value) ||
                      value >= watchCompanies("reviewRange.min") ||
                      "Max reviews cannot be less than Min reviews",
                  })}
                  className="w-28 px-1 py-2 border border-gray-300 rounded"
                  min={0}
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Error management */}
        {errorCompanies && (
          <div className="text-center text-red-600 bg-red-100 p-2 gap-2 rounded my-2">
            {errorCompanies}
          </div>
        )}

        {/* Form action buttons (Clear and Filter) */}
        <div className="flex py-2 gap-2 border-t-2">
          <button
            type="button"
            onClick={handleResetCompanies} // Reset the form
            className="w-2/5 py-2 bg-white border-2 border-orange-500 text-orange-600 rounded hover:bg-gray-50 focus:outline-none"
          >
            Clear
          </button>
          <button
            type="submit"
            className="w-3/5 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 focus:outline-none disabled:bg-orange-300"
            disabled={loadingCompanies || reqRemainder <= 0} // Disable button while loading
          >
            {loadingCompanies ? "Is Loading ..." : "Filter"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompaniesFilterbar;
