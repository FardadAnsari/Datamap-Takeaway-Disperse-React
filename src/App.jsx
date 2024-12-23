import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Panel from "./pages/Panel";
import PrivateRoute from "./PrivateRoutes";
import "leaflet/dist/leaflet.css";

import "./index.css";
import DataMap from "./pages/DataMap";

const App = () => {
  return (
    <Router>
      <Routes>
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
          path="/panel"
          element={
            <PrivateRoute>
              <Panel />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
