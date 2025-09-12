import { RiAccountCircleFill } from "react-icons/ri";
import { useUser } from "../api/userPermission";

// Sidebar navigation component for the DataMap app.

const Sidebar = ({ activePanel, setActivePanel }) => {
  const { user } = useUser();

  // Define each sidebar item: its key, label, icon classes, and access permission
  const items = [
    {
      key: "companiesFilterbar",
      label: "Companies",
      icon: "bg-companies",
      iconActive: "bg-companies-active",
      iconNoAccess: "bg-companies-no-access",
      access: user?.access?.companies,
    },
    {
      key: "gbusinessFilterbar",
      label: "G-Business",
      icon: "bg-gbusiness-map",
      iconActive: "bg-gbusiness-map-active",
      iconNoAccess: "bg-gbusiness-map-no-access",
      access: user?.access?.googleBusinessMap,
    },
    {
      key: "gbusinessDashboard",
      label: "G-Business",
      icon: "bg-gbusiness",
      iconActive: "bg-gbusiness-active",
      iconNoAccess: "bg-gbusiness-no-access",
      access: user?.access?.googleBusinessPanel,
    },
    // {
    //   key: "facebookFilterbar",
    //   label: "Facebook",
    //   icon: "bg-facebook",
    //   iconActive: "bg-facebook-active",
    //   iconNoAccess: "bg-facebook-no-access",
    //   access: user?.access?.facebook,
    // },
    // {
    //   key: "facebookReport",
    //   label: "Facebook",
    //   icon: "bg-facebook-report",
    //   iconActive: "bg-facebook-report-active",
    //   iconNoAccess: "bg-facebook-report-no-access",
    //   access: user?.access?.facebook,
    // },
    {
      key: "analyzer",
      label: "Analyzer",
      icon: "bg-analyzer",
      iconActive: "bg-analyzer-active",
      iconNoAccess: "bg-analyzer-no-access",
      access: user?.access?.devices,
    },
    {
      key: "devices",
      label: "Devices",
      icon: "bg-devices",
      iconActive: "bg-devices-active",
      iconNoAccess: "bg-devices-no-access",
      access: user?.access?.devices,
    },
    {
      key: "continuousDevicesCount",
      label: "Continuous",
      icon: "bg-continuous-count",
      iconActive: "bg-continuous-count-active",
      iconNoAccess: "bg-continuous-count-no-access",
      access: user?.access?.devices,
    },
    {
      key: "continuousDevicesStatus",
      label: "Continuous",
      icon: "bg-continuous-status",
      iconActive: "bg-continuous-status-active",
      iconNoAccess: "bg-continuous-status-no-access",
      access: user?.access?.devices,
    },
  ];

  return (
    <div className="bg-white w-20 h-screen absolute left-0 z-50 flex flex-col items-center border-r">
      {/* Logo or App Icon at the top */}
      <div className="my-2 bg-cover bg-mealzo w-12 h-12" />

      {/* Navigation Items (top) and Profile (bottom) */}
      <div className="w-full h-full flex flex-col items-center justify-between">
        {/* Top buttons (Companies, G-Business, etc) */}
        <div className="w-full flex flex-col">
          {items.map(
            ({ key, label, icon, iconActive, iconNoAccess, access }) => (
              <button
                key={key}
                className={`py-2 text-center flex flex-col items-center ${
                  activePanel === key ? "bg-orange-100" : ""
                }`}
                onClick={() =>
                  setActivePanel((prev) => (prev === key ? null : key))
                }
                disabled={access === false}
              >
                {/* Dynamic icon: focus or default */}
                <div
                  className={`my-1 bg-cover w-7 h-7 ${
                    access === false
                      ? iconNoAccess
                      : activePanel === key
                        ? iconActive
                        : icon
                  }`}
                />
                <p
                  className={`2xl:text-sm text-xs 
                    ${
                      access === false
                        ? "text-gray-400"
                        : activePanel === key
                          ? "text-orange-600"
                          : "text-gray-900"
                    }
                  `}
                >
                  {label}
                </p>
              </button>
            )
          )}
        </div>

        {/* Bottom profile icon */}
        <button
          className={`py-6 px-1 bg-white hover:text-orange-600 text-center flex flex-col items-center ${
            activePanel === "profile" && "text-orange-600"
          }`}
          onClick={() =>
            setActivePanel((prev) => (prev === "profile" ? null : "profile"))
          }
        >
          <RiAccountCircleFill size={40} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
