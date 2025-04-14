import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ColorRing } from "react-loader-spinner";
import instance from "./api/api";
import { clearOldCaches } from "./component/indexedDB";

const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [triggerRedirect, setTriggerRedirect] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const channel = new BroadcastChannel("auth");
    let tokenTimeout;

    const logoutAndClear = async () => {
      try {
        await clearOldCaches(0);
      } catch (err) {
        console.error("Failed to clear IndexedDB:", err);
      }
      sessionStorage.removeItem("accessToken");
      const logoutChannel = new BroadcastChannel("auth");
      logoutChannel.postMessage({ type: "LOGOUT" });
      logoutChannel.close();
    };

    const validateToken = async (token) => {
      try {
        await instance.get("/account/user/validate-token", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        setIsAuthenticated(true);
        document.title = "Data Map";
      } catch (error) {
        console.error("Access token expired or invalid", error);
        await logoutAndClear();
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    const onMessage = async (event) => {
      const { type, token } = event.data;

      if (type === "LOGIN" && token) {
        clearTimeout(tokenTimeout);
        sessionStorage.setItem("accessToken", token);
        setIsAuthenticated(true);
        setLoading(false);
        document.title = "Data Map";
      } else if (type === "LOGOUT") {
        await logoutAndClear();
        setIsAuthenticated(false);
        setLoading(false);
        document.title = "Login";
      } else if (type === "REQUEST_TOKEN") {
        const token = sessionStorage.getItem("accessToken");
        if (token) {
          channel.postMessage({ type: "LOGIN", token });
        }
      }
    };

    const handleAuth = async () => {
      const accessToken = sessionStorage.getItem("accessToken");

      if (!accessToken) {
        channel.postMessage({ type: "REQUEST_TOKEN" });

        tokenTimeout = setTimeout(() => {
          setLoading(false);
          setTriggerRedirect(true);
        }, 3000); // wait up to 3 seconds for a response
      } else {
        await validateToken(accessToken);
      }
    };

    channel.addEventListener("message", onMessage);
    handleAuth();

    return () => {
      clearTimeout(tokenTimeout);
      channel.removeEventListener("message", onMessage);
      channel.close();
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-yellow-50 flex justify-center items-center">
        <ColorRing
          visible={true}
          height="80"
          width="80"
          ariaLabel="color-ring-loading"
          wrapperClass="color-ring-wrapper"
          colors={["#e15b64", "#f47e60", "#f8b26a", "#abbd81", "#849b87"]}
        />
      </div>
    );
  }

  if (triggerRedirect) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return isAuthenticated ? (
    children
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
};

export default PrivateRoute;
