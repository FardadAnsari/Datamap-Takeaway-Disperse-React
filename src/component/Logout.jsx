import { useNavigate } from "react-router-dom";
import { clearOldCaches } from "./indexedDB";

const Logout = () => {
  const navigate = useNavigate();
  const channel = new BroadcastChannel("auth");

  const handleLogout = async () => {
    try {
      await clearOldCaches(0); // Clear all caches immediately
      console.log("IndexedDB cache cleared.");
    } catch (error) {
      console.error("Error clearing IndexedDB cache:", error);
    }
    sessionStorage.removeItem("accessToken");
    channel.postMessage({ type: "LOGOUT" });
    navigate("/");
  };

  return (
    <button
      className="text-center bg-red-500 text-white w-1/2 py-2 rounded-full border border-gray-200 hover:border-red-600 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 transition"
      onClick={handleLogout}
    >
      Logout
    </button>
  );
};

export default Logout;
