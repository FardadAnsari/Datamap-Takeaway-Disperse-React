import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ColorRing } from "react-loader-spinner";
import instance from "./component/api";

const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const channel = new BroadcastChannel("auth");

    const handleAuth = async () => {
      try {
        const accessToken = sessionStorage.getItem("accessToken");
        if (!accessToken) {
          channel.postMessage({ type: "REQUEST_TOKEN" });
        } else {
          await validateToken(accessToken);
        }
      } catch (error) {
        console.error("Error during authentication check:", error);
        setIsAuthenticated(false);
        setLoading(false);
      }
    };

    const validateToken = async (token) => {
      try {
        await instance.get("/account/user/", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Access token expired or invalid", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    const onMessage = async (event) => {
      const { type, token } = event.data;
      if (type === "LOGIN" && token) {
        sessionStorage.setItem("accessToken", token);
        setIsAuthenticated(true);
        setLoading(false);
      } else if (type === "LOGOUT") {
        sessionStorage.removeItem("accessToken");
        setIsAuthenticated(false);
        setLoading(false);
      } else if (type === "REQUEST_TOKEN") {
        const token = sessionStorage.getItem("accessToken");
        if (token) {
          channel.postMessage({ type: "LOGIN", token });
        }
      }
    };

    channel.addEventListener("message", onMessage);
    handleAuth();

    return () => {
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
          wrapperStyle={{}}
          wrapperClass="color-ring-wrapper"
          colors={["#e15b64", "#f47e60", "#f8b26a", "#abbd81", "#849b87"]}
        />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
