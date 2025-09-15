import { useEffect, useMemo, useRef, useState } from "react";
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

// Smoothly fly to the selected city
function FlyToCity({ rows, selectedCity, zoom = 9 }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedCity) return;
    const row = rows.find((r) => r.city === selectedCity);
    if (!row || typeof row.lat !== "number" || typeof row.lng !== "number")
      return;
    map.flyTo([row.lat, row.lng], zoom, { duration: 0.7 });
  }, [selectedCity, rows, map, zoom]);
  return null;
}

const ProductAnalysis = ({ isOpen }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [selectedCity, setSelectedCity] = useState(null); // slug (r.city)
  const [hoverCity, setHoverCity] = useState(null);

  const [cityData, setCityData] = useState(null);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityErr, setCityErr] = useState("");

  // --- Search state ---
  const [query, setQuery] = useState("");
  const searchInputRef = useRef(null);

  // Keep refs to markers to open popup when selected via search
  const markersRef = useRef({});
  useEffect(() => {
    if (!selectedCity) return;
    const m = markersRef.current[selectedCity];
    // react-leaflet Marker has openPopup method on the underlying Leaflet instance
    m?.openPopup?.();
  }, [selectedCity]);

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

  // Pretty label for selected city
  const displayCity = useMemo(() => {
    if (!selectedCity) return null;
    const row = rows.find((r) => r.city === selectedCity);
    return row?.resolved_city_used || selectedCity;
  }, [rows, selectedCity]);

  // Search suggestions (only cities that have coordinates/pins)
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const name = (r) => (r.resolved_city_used || r.city || "").toLowerCase();
    return points
      .filter((r) => name(r).includes(q))
      .sort((a, b) => {
        const na = name(a);
        const nb = name(b);
        const as = na.startsWith(q) ? 0 : 1;
        const bs = nb.startsWith(q) ? 0 : 1;
        return as - bs || na.localeCompare(nb);
      })
      .slice(0, 8);
  }, [query, points]);

  const handleSelectCity = (row) => {
    setSelectedCity(row.city); // slug
    setHoverCity(null);
    setQuery(""); // close dropdown
    searchInputRef.current?.blur();
  };

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
      className={`max-w-screen w-[calc(100%-80px)] p-6 absolute top-0 left-20 flex flex-col h-full overflow-y-auto bg-white z-40 transition-transform duration-700 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Header with search */}
      <div className="mx-4 flex justify-between items-center gap-4">
        <span className="text-2xl font-bold">Product Analysis</span>

        <div className="relative w-full max-w-md">
          <input
            ref={searchInputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && suggestions[0]) {
                handleSelectCity(suggestions[0]);
              }
              if (e.key === "Escape") setQuery("");
            }}
            placeholder="Search city…"
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 pr-8 shadow-sm outline-none focus:ring-2 focus:ring-orange-400"
            aria-label="Search city"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              ×
            </button>
          )}

          {query && (
            <ul className="absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded-xl border border-stone-200 bg-white shadow-lg">
              {suggestions.length ? (
                suggestions.map((r) => (
                  <li key={r.city}>
                    <button
                      type="button"
                      onClick={() => handleSelectCity(r)}
                      className="block w-full text-left px-3 py-2 hover:bg-stone-100"
                    >
                      {r.resolved_city_used || r.city}
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-stone-500">No matches</li>
              )}
            </ul>
          )}
        </div>
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
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FitToPoints points={points} />
            <FlyToCity rows={rows} selectedCity={selectedCity} zoom={9} />

            {points.map((p) => {
              const isActive = selectedCity === p.city || hoverCity === p.city;
              return (
                <Marker
                  key={p.city}
                  position={[p.lat, p.lng]}
                  icon={isActive ? ICONS.active : ICONS.simple}
                  zIndexOffset={isActive ? 1000 : 0}
                  ref={(m) => {
                    if (m) markersRef.current[p.city] = m;
                  }}
                  eventHandlers={{
                    click: () => setSelectedCity(p.city),
                    mouseover: () => setHoverCity(p.city),
                    mouseout: () =>
                      setHoverCity((c) => (c === p.city ? null : c)),
                  }}
                >
                  <Popup direction="top">
                    <div className="text-sm">
                      <div className="font-semibold">
                        {p.resolved_city_used}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* City chart (top-right) */}
        <div className="col-span-3 row-span-1 col-start-6 p-4 border rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-lg">
              <span>Products breakdown for </span>
              {displayCity ? (
                <span className="text-orange-600">{displayCity}</span>
              ) : null}
            </div>
          </div>

          {loading ? (
            "Loading cities…"
          ) : err ? (
            <>Error: {err}</>
          ) : !selectedCity ? (
            <div className="h-[260px] grid place-items-center text-stone-500">
              Select a city on the map
            </div>
          ) : cityLoading ? (
            "Loading city data…"
          ) : cityErr ? (
            <>Error: {cityErr}</>
          ) : !cityData ? (
            <div className="h-[260px] grid place-items-center text-stone-500">
              No data
            </div>
          ) : (
            <PiechartSection
              key={selectedCity} // force re-render when city changes
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
            {selectedCity && (
              <div className="text-lg font-semibold">
                <span>Popularity analysis in </span>
                <span className="text-orange-600">{displayCity}</span>
              </div>
            )}
          </div>

          <div className="h-[560px]">
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
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault(); // avoid page scroll on Space
                            setSelectedPostcode(postcode);
                          }
                        }}
                        aria-pressed={isActive}
                        className={`text-left rounded-xl border p-3 bg-white transition
                          hover:shadow-md focus:outline-none
                          ${
                            isActive
                              ? "border-2 border-orange-500"
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

        {/* Results for selected postcode (bottom-right) */}
        <div className="col-span-3 row-span-2 col-start-6 p-4 border rounded-xl shadow-lg">
          {selectedPostcode && (
            <div className="text-lg font-semibold mb-2">
              <span>Results for </span>
              <span className="text-orange-600">{selectedPostcode}</span>
            </div>
          )}

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
