import { IoIosArrowBack } from "react-icons/io";
import Select from "react-select";
import { Controller, useWatch } from "react-hook-form";
import AutoCompletionMultiSelectStyles from "../AutoCompletionMultiSelectStyles";

// Filterbar component to handle filtering for companies and Google Business data
const GoogleBusinessFilterbar = ({
  isOpen,
  registerGoogleBusiness,
  handleSubmitGoogleBusiness,
  controlGoogleBusiness,
  region,
  postcodeData,
  cuisine,
  onSubmitGoogleBusiness,
  loadingGoogleBusiness,
  errorGoogleBusiness,
  handleResetGoogleBusiness,
}) => {
  const safePostcode = postcodeData || []; // Ensure it's an array

  // Use useWatch to track form values
  const searchTerm = useWatch({
    control: controlGoogleBusiness,
    name: "searchTerm",
  });
  const selectedRegions = useWatch({
    control: controlGoogleBusiness,
    name: "region",
  });
  const selectedPostcodes = useWatch({
    control: controlGoogleBusiness,
    name: "postcode",
  });
  const selectedCuisines = useWatch({
    control: controlGoogleBusiness,
    name: "cuisine",
  });

  // Function to check if all inputs are empty
  const areAllInputsEmpty = () => {
    return (
      !searchTerm && // No search term
      (!selectedRegions || selectedRegions.length === 0) && // No regions selected
      (!selectedPostcodes || selectedPostcodes.length === 0) && // No postcodes selected
      (!selectedCuisines || selectedCuisines.length === 0) // No cuisines selected
    );
  };

  return (
    // Main container for the filter bar
    <div
      className={`w-80 absolute top-0 left-20 flex flex-col h-full bg-white z-10 transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Header section with filter title and close button */}
      <div
        className="mx-4 flex items-center py-2 border-b-2"
        style={{ height: "10%" }}
      >
        <span className="text-xl font-bold">Google Businesses Filter</span>
      </div>
      {/* Google Business filter form */}
      <form
        onSubmit={handleSubmitGoogleBusiness(onSubmitGoogleBusiness)} // Handle form submission
        className="p-4 flex flex-col"
        style={{ height: "90%" }}
      >
        <div className="px-2 flex-1 overflow-y-auto">
          {/* Search input for shops */}
          <div className="border-b pb-3">
            <input
              type="text"
              {...registerGoogleBusiness("searchTerm")} // Register search term input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              placeholder="Search Shop"
            />
          </div>
          {/* Dropdown for selecting regions */}
          <div className="border-b py-3">
            <p className="text-lg font-normal mb-2">Select Regions</p>
            <Controller
              name="region"
              control={controlGoogleBusiness} // Control the region input
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
          {/* Dropdown for selecting postcodes */}
          <div className="border-b py-3">
            <p className="text-lg font-normal mb-2">Select Postcode</p>
            <Controller
              name="postcode"
              control={controlGoogleBusiness}
              defaultValue={[]}
              render={({ field }) => (
                <Select
                  {...field}
                  className="mb-4"
                  placeholder="Select PostCode"
                  isClearable={true}
                  options={safePostcode.map((p) => ({
                    value: p.postCode,
                    label: p.postCode,
                  }))}
                  onChange={field.onChange}
                  isSearchable
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
              control={controlGoogleBusiness} // Control the cuisine input
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
        </div>
        {/* Form Error management */}
        {errorGoogleBusiness && (
          <div className="text-center text-red-600 bg-red-100 p-2 gap-2 rounded my-2">
            {errorGoogleBusiness}
          </div>
        )}
        {/* Form action buttons (Clear and Filter) */}
        <div className="flex py-2 gap-2 border-t-2">
          {areAllInputsEmpty() ? (
            <button
              type="submit"
              className="w-full py-2 bg-orange-600 text-white rounded hover:bg-orange-700 focus:outline-none disabled:bg-orange-300"
              disabled={loadingGoogleBusiness} // Disable button while loading
            >
              View All
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleResetGoogleBusiness} // Reset the form
                className="w-2/5 py-2 bg-white border-2 border-orange-500 text-orange-600 rounded hover:bg-gray-50 focus:outline-none disabled:bg-orange-300"
              >
                Clear
              </button>
              <button
                type="submit"
                className="w-3/5 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 focus:outline-none disabled:bg-orange-300"
                disabled={loadingGoogleBusiness} // Disable button while loading
              >
                {loadingGoogleBusiness ? "Is Loading ..." : "Filter"}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default GoogleBusinessFilterbar;
