import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import L from "leaflet";
import { renderToString } from "react-dom/server";
import { MapContainer, TileLayer, Marker, useMap, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import analyzerPins from "../../assets/analyzer-pin/analyzer-pin";
import PiechartSection from "./PiechartSection";
import { BiLike, BiDislike } from "react-icons/bi";
import { ThreeDots } from "react-loader-spinner";

// ---------- Small UI helpers ----------
const CenteredSpinner = ({ size = 50, className = "" }) => (
  <div className={`absolute inset-0 grid place-items-center ${className}`}>
    <ThreeDots
      visible
      height={size}
      width={size}
      color="#ffa500"
      radius="9"
      ariaLabel="loading"
    />
  </div>
);

const EmptyState = ({
  message = "No data",
  className = "",
  iconSize = "w-44 h-44",
  state = "bg-empty-state-piechart",
}) => (
  <div className={`grid place-items-center text-stone-500 ${className}`}>
    <div className={`${state} bg-no-repeat bg-center bg-contain ${iconSize}`} />
    <div className="mt-2">{message}</div>
  </div>
);

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

  const [selectedCity, setSelectedCity] = useState(null);
  const [hoverCity, setHoverCity] = useState(null);

  const [cityData, setCityData] = useState(null);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityErr, setCityErr] = useState("");

  // Search
  const [query, setQuery] = useState("");
  const searchInputRef = useRef(null);

  const markersRef = useRef({});
  useEffect(() => {
    if (!selectedCity) return;
    markersRef.current[selectedCity]?.openPopup?.();
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

  // City popularity fetch
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

  const displayCity = useMemo(() => {
    if (!selectedCity) return null;
    const row = rows.find((r) => r.city === selectedCity);
    return row?.resolved_city_used || selectedCity;
  }, [rows, selectedCity]);

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
    setSelectedCity(row.city);
    setHoverCity(null);
    setQuery("");
    searchInputRef.current?.blur();
  };

  // selected postcode
  const [selectedPostcode, setSelectedPostcode] = useState(null);

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
      {/* Header */}
      <div className="mx-4 flex justify-between items-center gap-4">
        <span className="text-2xl font-bold">Product Analysis</span>
      </div>

      <div className="grid grid-cols-8 gap-4 py-6 auto-rows-min">
        {/* Map card */}
        <div className="col-span-5 row-span-1 p-0 border rounded-xl shadow-lg h-[560px] overflow-hidden relative">
          {/* Search overlay on map (top-right) */}
          <div className="absolute z-[1000] top-3 right-3 sm:w-[360px] pointer-events-none">
            <div className="pointer-events-auto">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && suggestions[0])
                      handleSelectCity(suggestions[0]);
                    if (e.key === "Escape") setQuery("");
                  }}
                  placeholder="Search city…"
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 shadow-md outline-none focus:ring-2 focus:ring-orange-400"
                  aria-label="Search city"
                  autoComplete="off"
                />
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
          </div>

          {/* Map */}
          <div className="relative h-full w-full">
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
                const isActive =
                  selectedCity === p.city || hoverCity === p.city;
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

            {/* Map loading / error overlays */}
            {loading && <CenteredSpinner />}
            {!!err && !loading && (
              <div className="absolute inset-0 grid place-items-center">
                <EmptyState message={`Error: ${err}`} iconSize="w-44 h-44" />
              </div>
            )}
          </div>
        </div>

        {/* City chart (top-right) */}
        <div className="col-span-3 row-span-1 col-start-6 p-4 border rounded-xl shadow-lg relative">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-lg">
              <span>Products breakdown for </span>
              {displayCity ? (
                <span className="text-orange-600">{displayCity}</span>
              ) : null}
            </div>
          </div>

          {!selectedCity ? (
            <EmptyState message="Select a city on the map" />
          ) : cityLoading ? (
            <CenteredSpinner />
          ) : cityErr ? (
            <EmptyState message={`Error: ${cityErr}`} iconSize="w-44 h-44" />
          ) : !cityData || !cityData?.areas?.products_in_city?.products ? (
            <EmptyState className="h-[260px]" message="No data" />
          ) : (
            <PiechartSection
              key={selectedCity}
              data={cityData.areas.products_in_city.products}
              topN={8}
              innerRadius={100}
              outerRadius={140}
              onSliceClick={(item) => console.log("clicked:", item)}
            />
          )}
        </div>

        {/* Locations list */}
        <div className="col-span-5 row-span-2 p-4 border rounded-xl shadow-lg relative">
          <div className="flex items-center justify-between mb-3">
            {selectedCity && (
              <div className="text-lg font-semibold">
                <span>Popularity analysis in </span>
                <span className="text-orange-600">{displayCity}</span>
              </div>
            )}
          </div>

          <div className="h-[560px] relative">
            {!selectedCity ? (
              <EmptyState
                state="bg-empty-state-card"
                message="Select a city first"
              />
            ) : cityLoading ? (
              <CenteredSpinner />
            ) : !cityData ? (
              <EmptyState state="bg-empty-state-card" message="No data" />
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
                            e.preventDefault();
                            setSelectedPostcode(postcode);
                          }
                        }}
                        aria-pressed={isActive}
                        className={`text-left rounded-xl border p-3 bg-white transition
                          hover:shadow-md focus:outline-none
                          ${isActive ? "border-2 border-orange-500" : "border-stone-200"}`}
                      >
                        <div className="flex items-baseline justify-between border-b pb-2">
                          <div className="text-md text-stone-500">Postcode</div>
                          <div className="font-semibold text-orange-600">
                            {postcode}
                          </div>
                        </div>
                        <div className="mt-3 space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <div>
                              <span className="flex gap-1 text-stone-500">
                                <BiLike size={16} color="green" />
                                <span>Popular:</span>
                              </span>
                              <p>{topList}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div>
                              <div className="flex gap-1 text-stone-500">
                                <BiDislike size={16} color="red" />
                                <span>Unpopular:</span>
                              </div>
                              <p>{bottomList}</p>
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

        {/* Postcode results chart */}
        <div className="col-span-3 row-span-2 col-start-6 p-4 border rounded-xl shadow-lg relative">
          {selectedPostcode && (
            <div className="text-lg font-semibold mb-2">
              <span>Results for </span>
              <span className="text-orange-600">{selectedPostcode}</span>
            </div>
          )}

          <div className="h-[520px] relative">
            {!selectedPostcode ? (
              <EmptyState message="Click a postcode card to see its breakdown" />
            ) : cityLoading ? (
              <CenteredSpinner />
            ) : !postcodeProducts ? (
              <EmptyState message={`No data for ${selectedPostcode}`} />
            ) : (
              <PiechartSection
                data={postcodeProducts}
                innerRadius={100}
                outerRadius={140}
                onSliceClick={(item) => console.log("postcode slice:", item)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductAnalysis;
