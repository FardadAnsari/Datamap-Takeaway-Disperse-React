import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import L from "leaflet";
import { renderToString } from "react-dom/server";
import { MapContainer, TileLayer, Marker, useMap, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import analyzerPins from "../../assets/analyzer-pin/analyzer-pin";
import PiechartSection from "./PiechartSection";

// Build Leaflet divIcons from your React SVG components
const makeSvgIcon = (SvgComp, { w = 44, h = 44, className = "" } = {}) =>
  L.divIcon({
    html: renderToString(
      <SvgComp width={w} height={h} className={className} />
    ),
    className: "leaflet-div-icon pin-icon",
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
    popupAnchor: [0, -h + 4],
    tooltipAnchor: [0, -h + 6],
  });

const ICONS = {
  active: makeSvgIcon(analyzerPins.active, { w: 33, h: 33 }),
  simple: makeSvgIcon(analyzerPins.simple, { w: 33, h: 33 }),
};

function FitToPoints({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds.pad(0.2));
  }, [points, map]);
  return null;
}

const ProductAnalysis = ({ isOpen }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [selectedCity, setSelectedCity] = useState(null);
  const [hoverCity, setHoverCity] = useState(null);

  const [cityData, setCityData] = useState(null);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityErr, setCityErr] = useState("");

  // Load cities/points
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr("");
    axios
      .get("https://analysis.mega-data.co.uk/cities/geo/")
      .then((res) => {
        if (cancelled) return;
        const raw = res.data;
        const arr = Array.isArray(raw) ? raw : raw?.cities || [];
        setRows(arr);
      })
      .catch((e) => !cancelled && setErr(e?.message || "Failed to load"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch city-specific popularity whenever a city is selected
  useEffect(() => {
    if (!selectedCity) return;

    const controller = new AbortController();
    setCityLoading(true);
    setCityErr("");
    setCityData(null);

    const url = `https://analysis.mega-data.co.uk/data-analysis/popularity/?city=${encodeURIComponent(
      selectedCity.toLowerCase()
    )}`;

    axios
      .get(url, { signal: controller.signal })
      .then((res) => setCityData(res.data))
      .catch((e) => {
        if (controller.signal.aborted) return;
        setCityErr(e?.message || "Failed to load city data");
      })
      .finally(() => !controller.signal.aborted && setCityLoading(false));

    return () => controller.abort();
  }, [selectedCity]);

  const points = useMemo(
    () =>
      (rows || []).filter(
        (r) => typeof r.lat === "number" && typeof r.lng === "number"
      ),
    [rows]
  );

  // selected postcode
  const [selectedPostcode, setSelectedPostcode] = useState(null);

  // Auto-select first postcode when cityData arrives/changes
  useEffect(() => {
    const pcsObj = cityData?.areas?.products_in_postcodes || {};
    const pcs = Object.keys(pcsObj);
    if (!pcs.length) {
      setSelectedPostcode(null);
      return;
    }
    if (!selectedPostcode || !pcs.includes(selectedPostcode)) {
      setSelectedPostcode(pcs[0]);
    }
  }, [cityData, selectedPostcode]);

  const postcodeProducts = useMemo(() => {
    if (!selectedPostcode) return null;
    return (
      cityData?.areas?.products_in_postcodes?.[selectedPostcode]?.products ||
      null
    );
  }, [cityData, selectedPostcode]);

  return (
    <div
      className={`max-w-screen w-[calc(100%-80px)] p-6 absolute top-0 left-20 flex flex-col h-full overflow-y-auto bg-stone-50 z-40 transition-transform duration-700 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="mx-4 flex justify-between items-center">
        <span className="text-2xl font-bold">Product Analysis</span>
      </div>

      <div className="grid grid-cols-8 gap-4 py-6 auto-rows-min">
        {/* Map card */}
        <div className="col-span-5 row-span-1 p-0 border rounded-xl shadow-lg h-[560px] overflow-hidden">
          <MapContainer
            center={[54.5, -3.5]}
            zoom={6}
            minZoom={5}
            scrollWheelZoom
            className="h-full w-full"
            maxBoundsViscosity={0.8}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FitToPoints points={points} />

            {points.map((p) => {
              const isActive = selectedCity === p.city || hoverCity === p.city;
              return (
                <Marker
                  key={p.city}
                  position={[p.lat, p.lng]}
                  icon={isActive ? ICONS.active : ICONS.simple}
                  zIndexOffset={isActive ? 1000 : 0}
                  eventHandlers={{
                    click: () => setSelectedCity(p.city),
                    mouseover: () => setHoverCity(p.city),
                    mouseout: () =>
                      setHoverCity((c) => (c === p.city ? null : c)),
                  }}
                >
                  <Popup direction="top">
                    <div className="text-sm">
                      <div className="font-semibold">{p.city}</div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* City chart (top-right) */}
        <div className="col-span-3 row-span-1 col-start-6 p-4 border rounded-xl shadow-lg">
          {loading ? (
            "Loading cities…"
          ) : err ? (
            <>Error: {err}</>
          ) : (
            <PiechartSection
              data={cityData?.areas?.products_in_city?.products}
              topN={8}
              innerRadius={70}
              outerRadius={100}
              onSliceClick={(item) => console.log("clicked:", item)}
            />
          )}
        </div>

        {/* Locations list (card design, same grid position) */}
        <div className="col-span-5 row-span-2 p-4 border rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-semibold">
              {selectedCity ? `Popularity: ${selectedCity}` : "Popularity"}
            </div>
            {selectedCity && (
              <button
                className="text-xs underline"
                onClick={() => {
                  setSelectedCity(null);
                  setSelectedPostcode(null); // reset for next city
                  setCityData(null);
                  setCityErr("");
                }}
              >
                Clear selection
              </button>
            )}
          </div>

          <div className="rounded-xl h-[560px] p-2 bg-white">
            {!cityData ? (
              <div className="h-full grid place-items-center text-stone-500">
                Select a city first
              </div>
            ) : (
              <div className="h-full overflow-auto pr-1">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
                  {Object.entries(
                    cityData.areas.products_in_postcodes || {}
                  ).map(([postcode, data]) => {
                    const topList =
                      Object.keys(data.top || {}).join(", ") || "—";
                    const bottomList =
                      Object.keys(data.bottom || {}).join(", ") || "—";
                    const isActive = selectedPostcode === postcode;

                    return (
                      <button
                        key={postcode}
                        type="button"
                        onClick={() => setSelectedPostcode(postcode)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            setSelectedPostcode(postcode);
                        }}
                        aria-pressed={isActive}
                        className={`text-left rounded-xl border p-3 bg-white transition
                          hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-400
                          ${
                            isActive
                              ? "ring-2 ring-orange-500 border-orange-300 bg-orange-50/60"
                              : "border-stone-200"
                          }`}
                      >
                        <div className="flex items-baseline justify-between">
                          <div className="text-xs text-stone-500">Postcode</div>
                          <div className="font-semibold text-orange-600">
                            {postcode}
                          </div>
                        </div>
                        <div className="mt-3 space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <div>
                              <span className="text-stone-500">Popular:</span>{" "}
                              {topList}
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div>
                              <span className="text-stone-500">Unpopular:</span>{" "}
                              {bottomList}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results for selected postcode (bottom-right, unchanged position) */}
        <div className="col-span-3 row-span-2 col-start-6 p-4 border rounded-xl shadow-lg">
          <div className="text-lg font-semibold mb-2">
            {selectedPostcode
              ? `Results for ${selectedPostcode}`
              : "Results for postcode"}
          </div>

          {!selectedPostcode ? (
            <div className="h-[520px] grid place-items-center text-stone-500">
              Click a postcode card to see its breakdown
            </div>
          ) : !postcodeProducts ? (
            <div className="h-[520px] grid place-items-center text-stone-500">
              No data for {selectedPostcode}
            </div>
          ) : (
            <div className="h-[520px]">
              <PiechartSection
                data={postcodeProducts}
                innerRadius={70}
                outerRadius={100}
                onSliceClick={(item) => console.log("postcode slice:", item)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductAnalysis;
