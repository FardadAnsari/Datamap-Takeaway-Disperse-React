import { useEffect, useState } from "react";
import {
  useForm,
  Controller,
  useFieldArray,
  FormProvider,
} from "react-hook-form";
import instance from "../../api/api";
import DayPeriods from "./DayPeriods";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const dayNames = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

// Simple skeleton block for loading state
const SkeletonLine = ({ className = "" }) => (
  <div
    className={`w-full h-4 rounded bg-gray-200/80 animate-pulse ${className}`}
  />
);

const BusinessHoursEdit = ({ locationId }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const methods = useForm({
    defaultValues: {
      hours: Array(7)
        .fill()
        .map(() => ({
          isClosed: true,
          periods: [],
        })),
    },
  });

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { isSubmitting },
  } = methods;

  const { fields } = useFieldArray({
    control,
    name: "hours",
  });

  useEffect(() => {
    const accessToken = sessionStorage.getItem("accessToken");
    if (!locationId) return;

    setIsLoading(true);
    instance
      .get(`api/v1/google/get-update-open/${locationId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((response) => {
        const fetchedPeriods =
          response.data.location.regularHours?.periods || [];
        const updatedHours = Array(7)
          .fill()
          .map(() => ({
            isClosed: true,
            periods: [],
          }));

        fetchedPeriods.forEach((period) => {
          const dayIndex = dayNames.indexOf(period.openDay);
          if (dayIndex >= 0 && updatedHours[dayIndex]) {
            updatedHours[dayIndex].isClosed = false;
            updatedHours[dayIndex].periods.push({
              openTime: {
                hours: period.openTime?.hours || 0,
                minutes: period.openTime?.minutes || 0,
              },
              closeTime: {
                hours: period.closeTime?.hours || 0,
                minutes: period.closeTime?.minutes || 0,
              },
            });
          }
        });

        reset({ hours: updatedHours });
      })
      .catch((error) => {
        if (error.status === 401) {
          toast.error(
            "Your tokens have been exhausted. Please contact the R&D department to resolve this issue."
          );
          setTimeout(() => navigate("/login"), 5000);
        } else {
          toast.error("Failed to load hours. Please try again.");
        }
      })
      .finally(() => setIsLoading(false));
  }, [locationId, reset, navigate]);

  const onSubmit = async (data) => {
    const formattedData = data.hours
      .map((day, dayIndex) => ({
        dayIndex,
        isClosed: day.isClosed,
        periods: day.periods,
      }))
      .filter((day) => !day.isClosed)
      .flatMap((day) =>
        day.periods.map((period) => ({
          openDay: dayNames[day.dayIndex],
          openTime: {
            hours: period.openTime.hours,
            minutes: period.openTime.minutes || 0,
          },
          closeDay: dayNames[day.dayIndex],
          closeTime: {
            hours: period.closeTime.hours,
            minutes: period.closeTime.minutes || 0,
          },
        }))
      );

    const accessToken = sessionStorage.getItem("accessToken");
    try {
      const response = await instance.post(
        `api/v1/google/update-open-hours/${locationId}/`,
        { periods: formattedData },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 200) {
        toast.success("Your changes have been applied.");
        reset();
      } else {
        toast.error("Error applying changes. Please try again later.");
      }
    } catch (error) {
      if (error.status === 401) {
        toast.error(
          "Your tokens have been exhausted. Please contact the R&D department to resolve this issue."
        );
        setTimeout(() => navigate("/login"), 5000);
      } else {
        toast.error("Failed to save changes. Please try again.");
      }
    }
  };

  return (
    locationId && (
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-96">
          <div className="flex flex-col w-full gap-4 overflow-y-auto mb-4">
            {fields.map((day, dayIndex) => {
              const isClosed = watch(`hours.${dayIndex}.isClosed`);
              return (
                <div
                  key={day.id || dayIndex}
                  className="w-full border p-2 rounded-lg"
                >
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-lg font-medium px-2">
                      {dayNames[dayIndex].charAt(0) +
                        dayNames[dayIndex].slice(1).toLowerCase()}
                    </label>

                    <Controller
                      name={`hours.${dayIndex}.isClosed`}
                      control={control}
                      render={({ field }) => (
                        <button
                          type="button"
                          onClick={() => {
                            if (isLoading || isSubmitting) return; // prevent toggling while loading/submitting
                            field.onChange(!field.value);
                            if (!field.value) {
                              // turning ON closed -> clear periods
                              setValue(`hours.${dayIndex}.periods`, []);
                            } else {
                              // turning OFF closed -> seed one empty period
                              setValue(`hours.${dayIndex}.periods`, [
                                {
                                  openTime: { hours: 0, minutes: 0 },
                                  closeTime: { hours: 0, minutes: 0 },
                                },
                              ]);
                            }
                          }}
                          disabled={isLoading || isSubmitting}
                          className={
                            isLoading || isSubmitting
                              ? "opacity-60 cursor-not-allowed"
                              : ""
                          }
                        >
                          {field.value ? (
                            <div className="bg-close-status w-16 h-8 shadow-md" />
                          ) : (
                            <div className="bg-open-status w-16 h-8 shadow-md" />
                          )}
                        </button>
                      )}
                    />
                  </div>

                  {/* Per-card content: loader vs actual fields */}
                  {isLoading ? (
                    <div className="space-y-3 px-2 py-1">
                      <SkeletonLine className="w-40" />
                      <SkeletonLine />
                      <SkeletonLine className="w-3/4" />
                    </div>
                  ) : (
                    !isClosed && <DayPeriods dayIndex={dayIndex} />
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={isLoading || isSubmitting}
            aria-busy={isSubmitting}
            className={`self-end px-12 py-2 text-white rounded-lg ${
              isLoading || isSubmitting
                ? "bg-orange-400 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {isSubmitting ? "Saving…" : "Save"}
          </button>

          <ToastContainer
            position="top-center"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </form>
      </FormProvider>
    )
  );
};

export default BusinessHoursEdit;
