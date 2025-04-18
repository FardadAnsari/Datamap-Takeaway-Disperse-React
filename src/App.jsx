import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import GBDashboardByMap from "./pages/GBDashboardByMap";
import PrivateRoute from "./PrivateRoutes";
import "leaflet/dist/leaflet.css";

import "./index.css";
import DataMap from "./pages/DataMap";
import NotFound from "./pages/NotFound";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="*" element={<NotFound />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DataMap />
            </PrivateRoute>
          }
        />
        <Route
          path="/google-business/:locationId"
          element={
            <PrivateRoute>
              <GBDashboardByMap />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
