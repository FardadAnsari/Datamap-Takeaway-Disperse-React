import { RiAccountCircleFill } from "react-icons/ri";

// Sidebar navigation component for the DataMap app.

const Sidebar = ({ activePanel, setActivePanel, user }) => {
  // Define each sidebar item: its key, label, icon classes, and access permission
  const items = [
    {
      key: "companiesFilterbar",
      label: "Companies",
      icon: "bg-companies-sidebar-icon",
      iconActive: "bg-companies-focus-sidebar-icon",
      access: user?.access?.companies,
    },
    {
      key: "gbusinessFilterbar",
      label: "G-Business",
      icon: "bg-gbusiness-map-sidebar-icon",
      iconActive: "bg-gbusiness-map-focus-sidebar-icon",
      access: user?.access?.googleBusinessMap,
    },
    {
      key: "gbusinessDashboard",
      label: "G-Business",
      icon: "bg-gbusiness-sidebar-icon",
      iconActive: "bg-gbusiness-focus-sidebar-icon",
      access: user?.access?.googleBusinessPanel,
    },
    {
      key: "devices",
      label: "Devices",
      icon: "bg-devices-sidebar-icon",
      iconActive: "bg-devices-focus-sidebar-icon",
      access: user?.access?.devices,
    },
  ];

  return (
    <div className="bg-white w-20 h-screen absolute left-0 z-50 flex flex-col items-center border-r">
      {/* Logo or App Icon at the top */}
      <div className="my-2 bg-cover bg-mealzo-sidebar-icon w-12 h-12" />

      {/* Navigation Items (top) and Profile (bottom) */}
      <div className="w-full h-full flex flex-col items-center justify-between">
        {/* Top buttons (Companies, G-Business, etc) */}
        <div className="w-full flex flex-col">
          {items.map(({ key, label, icon, iconActive, access }) => (
            <button
              key={key}
              className={`py-4 text-center flex flex-col items-center ${
                activePanel === key ? "bg-orange-100 text-orange-600" : ""
              } ${
                access === false
                  ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                  : ""
              }`}
              onClick={() =>
                setActivePanel((prev) => (prev === key ? null : key))
              }
              disabled={access === false}
            >
              {/* Dynamic icon: focus or default */}
              <div
                className={`my-1 bg-cover w-7 h-7 ${
                  activePanel === key ? iconActive : icon
                }`}
              />
              <p className="text-sm">{label}</p>
            </button>
          ))}
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
