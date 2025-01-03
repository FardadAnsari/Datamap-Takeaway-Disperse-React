import React from "react";
import { RiLogoutCircleRLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();
  const channel = new BroadcastChannel("auth");

  const handleLogout = () => {
    sessionStorage.removeItem("accessToken");

    channel.postMessage({ type: "LOGOUT" });

    navigate("/login");
  };

  return (
    <button
      className="w-full flex items-center gap-2 px-2 py-2 rounded border border-gray-200 hover:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 transition"
      onClick={handleLogout}
    >
      <div>
        <RiLogoutCircleRLine color="red" size={25} />
      </div>
      <span className="hidden lg:block md:block sm:hidden">Logout</span>
    </button>
  );
};

export default Logout;
