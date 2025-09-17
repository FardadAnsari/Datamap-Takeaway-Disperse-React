import { RiAccountCircleFill } from "react-icons/ri";
import { useUser } from "../api/userPermission";
import { useEffect } from "react";

const Sidebar = ({ activePanel, setActivePanel }) => {
  const { user } = useUser();
  const analyzerAccess = user?.access?.analysis;
  useEffect(() => {
    if (activePanel === "analyzer" && analyzerAccess === false) {
      setActivePanel(null);
    }
  }, [activePanel, analyzerAccess]);

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
      iconNoAccess: "",
      access: analyzerAccess,
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
      access: user?.access?.gorate,
    },
    {
      key: "continuousDevicesStatus",
      label: "Continuous",
      icon: "bg-continuous-status",
      iconActive: "bg-continuous-status-active",
      iconNoAccess: "bg-continuous-status-no-access",
      access: user?.access?.gorate,
    },
  ];

  return (
    <div className="bg-white w-20 h-screen absolute left-0 z-50 flex flex-col items-center border-r">
      <div className="my-2 bg-cover bg-mealzo w-12 h-12" />

      <div className="w-full h-full flex flex-col items-center justify-between">
        <div className="w-full flex flex-col">
          {items.map(
            ({ key, label, icon, iconActive, iconNoAccess, access }) => {
              // HIDE analyzer entirely if no access
              if (key === "analyzer" && access === false) return null;

              return (
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
                    className={`2xl:text-sm text-xs ${
                      access === false
                        ? "text-gray-400"
                        : activePanel === key
                          ? "text-orange-600"
                          : "text-gray-900"
                    }`}
                  >
                    {label}
                  </p>
                </button>
              );
            }
          )}
        </div>

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
