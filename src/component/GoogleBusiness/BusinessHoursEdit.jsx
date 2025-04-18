import { useEffect } from "react";
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

const BusinessHoursEdit = ({ locationId }) => {
  const navigate = useNavigate();

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

  const { control, handleSubmit, setValue, reset, watch } = methods;

  const { fields } = useFieldArray({
    control,
    name: "hours",
  });

  useEffect(() => {
    const accessToken = sessionStorage.getItem("accessToken");
    if (locationId) {
      instance
        .get(`api/v1/google/get-update-open/${locationId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((response) => {
          const fetchedPeriods =
            response.data.location.regularHours?.periods || [];

          // console.log("Fetched Periods:", fetchedPeriods);

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
          error.status === 401 &&
            toast.error(
              "Your tokens have been exhausted. Please contact the R&D department to resolve this issue."
            ) &&
            setTimeout(() => {
              navigate("/login");
            }, 5000);
        });
    }
  }, [locationId, reset]);

  const onSubmit = (data) => {
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

    // console.log("Formatted Data to submit:", formattedData);

    const accessToken = sessionStorage.getItem("accessToken");
    instance
      .post(
        `api/v1/google/update-open-hours/${locationId}/`,
        { periods: formattedData },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      .then((response) => {
        // console.log("Data successfully submitted:", response.data);
        if (response.status === 200) {
          toast.success("Your changes have been applied.");
          reset();
        } else {
          toast.error("Error applying changes. Please try again later.");
        }
      })
      .catch((error) => {
        error.status === 401 &&
          toast.error(
            "Your tokens have been exhausted. Please contact the R&D department to resolve this issue."
          ) &&
          setTimeout(() => {
            navigate("/login");
          }, 5000);
      });
  };

  return (
    locationId && (
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-96">
          <div className="flex flex-col w-full gap-4 overflow-y-auto mb-4">
            {fields.map((day, dayIndex) => (
              <div
                key={day.id || dayIndex}
                className="w-full border p-2 rounded-lg "
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
                          field.onChange(!field.value);
                          if (!field.value) {
                            setValue(`hours.${dayIndex}.periods`, []);
                          } else {
                            setValue(`hours.${dayIndex}.periods`, [
                              {
                                openTime: { hours: 0, minutes: 0 },
                                closeTime: { hours: 0, minutes: 0 },
                              },
                            ]);
                          }
                        }}
                      >
                        {field.value ? (
                          <div className="bg-close-status w-16 h-8 shadow-md"></div>
                        ) : (
                          <div className=" bg-open-status w-16 h-8 shadow-md"></div>
                        )}
                      </button>
                    )}
                  />
                </div>

                {!watch(`hours.${dayIndex}.isClosed`) && (
                  <DayPeriods dayIndex={dayIndex} />
                )}
              </div>
            ))}
          </div>
          <button
            type="submit"
            className="self-end px-12 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
          >
            Save
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
