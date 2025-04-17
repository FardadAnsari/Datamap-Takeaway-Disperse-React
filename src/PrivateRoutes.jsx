import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ColorRing } from "react-loader-spinner";
import instance from "./api/api";
import { clearOldCaches } from "./component/indexedDB";

// A protected route component that checks for valid authentication before rendering children
const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Track whether user is authenticated
  const [loading, setLoading] = useState(true); // Track loading state while checking auth
  const [triggerRedirect, setTriggerRedirect] = useState(false); // Flag to trigger redirect to login if needed
  const location = useLocation(); // React Router hook to get current location

  useEffect(() => {
    const channel = new BroadcastChannel("auth"); // Setup cross-tab communication channel
    let tokenTimeout; // Timeout handler for delayed token response

    // Clears session data and IndexedDB, then notifies other tabs to logout
    const logoutAndClear = async () => {
      try {
        await clearOldCaches(0); // Clear stored caches (e.g., IndexedDB)
      } catch (err) {
        console.error("Failed to clear IndexedDB:", err);
      }
      sessionStorage.removeItem("accessToken"); // Remove token from session
      const logoutChannel = new BroadcastChannel("auth"); // Create a new channel to broadcast logout
      logoutChannel.postMessage({ type: "LOGOUT" });
      logoutChannel.close(); // Close the channel after sending
    };

    // Validate token by hitting backend API
    const validateToken = async (token) => {
      try {
        await instance.get("/account/user/validate-token", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        setIsAuthenticated(true); // Token is valid
        document.title = "Data Map"; // Set page title
      } catch (error) {
        console.error("Access token expired or invalid", error);
        await logoutAndClear(); // If validation fails, log out
        setIsAuthenticated(false);
      } finally {
        setLoading(false); // Done checking token
      }
    };

    // Handle incoming BroadcastChannel messages from other tabs
    const onMessage = async (event) => {
      const { type, token } = event.data;

      if (type === "LOGIN" && token) {
        clearTimeout(tokenTimeout); // Cancel any pending redirect
        sessionStorage.setItem("accessToken", token); // Save received token
        setIsAuthenticated(true);
        setLoading(false);
        document.title = "Data Map";
      } else if (type === "LOGOUT") {
        await logoutAndClear(); // Perform logout and cleanup
        setIsAuthenticated(false);
        setLoading(false);
        document.title = "Login";
      } else if (type === "REQUEST_TOKEN") {
        const token = sessionStorage.getItem("accessToken");
        if (token) {
          channel.postMessage({ type: "LOGIN", token }); // Respond with current tab's token
        }
      }
    };

    // Initial auth check logic
    const handleAuth = async () => {
      const accessToken = sessionStorage.getItem("accessToken");

      if (!accessToken) {
        channel.postMessage({ type: "REQUEST_TOKEN" }); // Ask other tabs for a token

        // Wait up to 3 seconds for another tab to respond with a token
        tokenTimeout = setTimeout(() => {
          setLoading(false);
          setTriggerRedirect(true); // Redirect if no token is received
        }, 3000);
      } else {
        await validateToken(accessToken); // If token exists, validate it
      }
    };

    // Set up message listener and run initial auth check
    channel.addEventListener("message", onMessage);
    handleAuth();

    // Cleanup on component unmount
    return () => {
      clearTimeout(tokenTimeout);
      channel.removeEventListener("message", onMessage);
      channel.close();
    };
  }, []);

  // Show loading spinner while authentication is being checked
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

  // If no token was found after waiting, redirect to login
  if (triggerRedirect) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If authenticated, render protected content; otherwise, redirect to login
  return isAuthenticated ? (
    children
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
};

export default PrivateRoute;
