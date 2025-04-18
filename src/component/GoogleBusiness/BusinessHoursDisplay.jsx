import { useEffect, useState } from "react";
import instance from "../../api/api";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";

const BusinessHoursDisplay = ({ locationId }) => {
  const navigate = useNavigate();
  const dayNames = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];

  const [businessHours, setBusinessHours] = useState(
    Array(7).fill({ isClosed: true, periods: [] })
  );

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
                  hours: period.openTime?.hours || "00",
                  minutes: period.openTime?.minutes || "00",
                },
                closeTime: {
                  hours: period.closeTime?.hours || "00",
                  minutes: period.closeTime?.minutes || "00",
                },
              });
            }
          });

          setBusinessHours(updatedHours);
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
  }, [locationId]);

  return (
    locationId && (
      <div className="flex flex-col gap-2 py-2 h-max">
        {businessHours.map((day, dayIndex) => (
          <div key={dayIndex} className="flex justify-between py-1">
            <span className="text-base">{dayNames[dayIndex]}</span>
            <div className="flex flex-col gap-2">
              {day.isClosed ? (
                <span className="text-red-500">Closed</span>
              ) : (
                day.periods.map((period, idx) => (
                  <span key={idx} className="text-base font-medium">
                    {period.openTime.hours}:{period.openTime.minutes} -{" "}
                    {period.closeTime.hours}:{period.closeTime.minutes}
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
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
      </div>
    )
  );
};

export default BusinessHoursDisplay;
