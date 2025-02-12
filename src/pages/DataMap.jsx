import React, { useState, useRef, useMemo, useEffect } from "react";
import ReactDOMServer from "react-dom/server";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  GeoJSON,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Supercluster from "supercluster";
import L from "leaflet";
import instance from "../component/api";
import ClusterMarker from "../component/ClusterMarker";
import { useForm } from "react-hook-form";
import pointInPolygon from "point-in-polygon";
import { ColorRing } from "react-loader-spinner";
import {
  getCachedCompanyData,
  setCachedCompanyData,
  clearOldCaches,
} from "../component/indexedDB";

import companyIcons from "../assets/checkbox-icon/checkboxIcons";

import ResultBar from "../component/Resultbar";
import { Link } from "react-router-dom";
import companyPins from "../assets/pins/pins";
import { useUser } from "../component/userPermission";
import Filterbar from "../component/Filterbar";
import Profilebar from "../component/Profilebar";
import { companies } from "../component/companies";
import { transformData } from "../component/parsers";
import LogoutModal from "../component/LogoutModal";
import { HiAdjustments } from "react-icons/hi";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { RiAccountCircleFill } from "react-icons/ri";
import { ImSpoonKnife } from "react-icons/im";
import { SlSocialGoogle } from "react-icons/sl";
import { PiDevices, PiPhone } from "react-icons/pi";
import { HiMiniLink, HiOutlineEnvelope } from "react-icons/hi2";
import { CiStar } from "react-icons/ci";
import { GrLocation, GrMapLocation } from "react-icons/gr";
import { GoCommentDiscussion } from "react-icons/go";
import DeviceStatus from "../component/DeviceStatus";

const createCustomIcon = (PinComponent, options = {}) => {
  const { width = 40, height = 40 } = options;

  const iconHTML = ReactDOMServer.renderToString(
    <PinComponent width={width} height={height} />
  );

  return L.divIcon({
    html: iconHTML,
    className: "",
    iconSize: [width, height],
  });
};

const createClusterIcon = (count) => {
  let color = "#555";
  if (count < 10) color = "#1abc9c";
  else if (count < 20) color = "#3498db";
  else if (count < 50) color = "#9b59b6";
  else color = "#e74c3c";

  let size = 30;
  if (count < 10) size = 30;
  else if (count < 20) size = 40;
  else if (count < 50) size = 50;
  else size = 60;

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" 
         width="${size}" height="${size}" 
         viewBox="0 0 24 24" 
         fill="${color}" 
         stroke="white" 
         stroke-width="2" 
         stroke-linecap="round" 
         stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <text x="12" y="16" text-anchor="middle" fill="white" font-size="10px" font-family="Roboto" font-weight="100" >${count}</text>
    </svg>
  `;
  return L.divIcon({
    html: svgIcon,
    className: "",
    iconSize: [size, size],
    popupAnchor: [0, -size / 2],
  });
};

const UpdateMapBounds = ({ setMapBounds, setZoom }) => {
  const map = useMap();
  React.useEffect(() => {
    const update = () => {
      const newBounds = map.getBounds();
      const newZoom = map.getZoom();
      console.log(`
        Map bounds updated: ${newBounds.toBBoxString()}, Zoom: ${newZoom}
      `);
      setMapBounds(newBounds);
      setZoom(newZoom);
    };
    map.on("moveend", update);
    update();
    return () => {
      map.off("moveend", update);
    };
  }, [map, setMapBounds, setZoom]);

  return null;
};

const MapBounds = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, bounds]);
  return null;
};

const DataMap = () => {
  const { register, handleSubmit, control, watch, reset } = useForm({
    defaultValues: {
      selectedCompanies: [],
      region: [],
      cuisine: [],
      ratingRange: [0, 5],
      reviewRange: { min: "", max: "" },
      searchTerm: "",
    },
  });
  const handleReset = () => {
    reset({
      selectedCompanies: [],
      region: [],
      cuisine: [],
      ratingRange: [0, 5],
      reviewRange: { min: "", max: "" },
      searchTerm: "",
    });

    setApiData([]);
  };

  const [region, setRegion] = useState([]);
  const [cuisine, setCuisine] = useState([]);
  const [regionBoundaryData, setRegionBoundaryData] = useState(null);
  const [apiData, setApiData] = useState([]);
  const [mapBounds, setMapBounds] = useState(null);
  const [zoom, setZoom] = useState(13);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDeviceOpen, setIsDeviceOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleCloseLogoutModal = () => {
    setIsLogoutModalOpen(false);
  };

  const toggleResult = () => {
    setIsResultOpen((prev) => !prev);
  };

  const clusterRef = useRef(
    new Supercluster({
      radius: 75,
      maxZoom: 22,
      minZoom: 0,
    })
  );

  useEffect(() => {
    const fetchRegion = async () => {
      try {
        const response = await instance.get("/api/v1/companies/region/");
        console.log(response);
        setRegion(response.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchRegion();
  }, []);

  useEffect(() => {
    const fetchCuisine = async () => {
      try {
        const response = await instance.get("/api/v1/companies/cuisine/");
        console.log("Cuisine:", response);
        setCuisine(response.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchCuisine();
  }, []);

  const getRegionData = async (selectedRegion) => {
    const url = `https://ons-dp-prod-cdn.s3.eu-west-2.amazonaws.com/maptiles/ap-geos/v3/${selectedRegion.substring(0, 3)}/${selectedRegion}.json`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch region data: ${response.statusText}`);
      }

      const data = await response.json();
      const boundaryGeoJSON = data.geometry;

      if (!boundaryGeoJSON) {
        console.warn("No boundary data found for this Region.");
        return null;
      }

      const filteredGeoJSON = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: boundaryGeoJSON,
            properties: data.properties,
          },
        ],
      };

      return filteredGeoJSON;
    } catch (error) {
      console.error("Error fetching Region data:", error);
      return null;
    }
  };

  const onSubmit = async (data) => {
    console.log("form submitted:", data);
    setLoading(true);
    setError(null);

    try {
      await clearOldCaches(24 * 60 * 60 * 1000);

      setRegionBoundaryData(null);
      setApiData([]);

      let combinedRegionData = null;

      if (data.region && data.region.length > 0) {
        const regionDataPromises = data.region.map((selectedRegion) =>
          getRegionData(selectedRegion.value)
        );

        const regionsData = await Promise.all(regionDataPromises);
        const validRegionsData = regionsData.filter(
          (region) => region !== null
        );

        if (validRegionsData.length > 0) {
          combinedRegionData = {
            type: "FeatureCollection",
            features: validRegionsData.flatMap((region) => region.features),
          };
          setRegionBoundaryData(combinedRegionData);
        }
      }

      const selectedCompanyList = companies.filter((company) =>
        data.selectedCompanies.includes(company.apiUrl)
      );

      if (selectedCompanyList.length === 0) {
        setLoading(false);
        return;
      }

      const fetchCompanyData = async (company) => {
        const cachedData = await getCachedCompanyData(company.id);
        if (cachedData) {
          console.log(`using cached data for${company.name}`);
          return cachedData;
        } else {
          try {
            const response = await instance.get(company.apiUrl);
            await setCachedCompanyData(company.id, response.data);
            console.log(`recieve and cache data for ${company.name}`);
            return response.data;
          } catch (error) {
            console.error(`error in fetching data ${company.name}:`, error);
            throw error;
          }
        }
      };

      const requests = selectedCompanyList.map((company) =>
        fetchCompanyData(company)
      );

      const responses = await Promise.all(requests);
      console.log("response from companies", responses);

      let points = responses
        .flatMap((res, index) => transformData(res, selectedCompanyList[index]))
        .filter((point) => {
          const [lon, lat] = point.geometry.coordinates;
          return (
            !isNaN(lon) &&
            !isNaN(lat) &&
            lon >= -180 &&
            lon <= 180 &&
            lat >= -90 &&
            lat <= 90
          );
        });

      console.log("Points after first filter:", points);

      const { searchTerm, ratingRange, reviewRange, cuisine } = data;
      const [minRating, maxRating] = ratingRange || [0, 5];
      const { min: minReview, max: maxReview } = reviewRange || {
        min: "",
        max: "",
      };

      const lowerCaseSearchTerm = searchTerm?.trim().toLowerCase() || "";

      const isRatingFilterActive = !(minRating === 0 && maxRating === 5);
      const isReviewFilterActive = !(isNaN(minReview) && isNaN(maxReview));

      const selectedCuisines = cuisine.map((c) => c.value.toLowerCase());

      const combinedFilter = (point) => {
        const shopName = point.properties.shopName?.toLowerCase() || "";
        const rating = parseFloat(point.properties.rating);
        const reviews = parseInt(point.properties.totalReviews, 10);
        const [lon, lat] = point.geometry.coordinates;
        const pt = [lon, lat];

        if (lowerCaseSearchTerm && !shopName.includes(lowerCaseSearchTerm)) {
          return false;
        }

        if (combinedRegionData && combinedRegionData.features.length > 0) {
          const isInAnyRegion = combinedRegionData.features.some((feature) => {
            const geometry = feature.geometry;
            if (geometry.type === "Polygon") {
              const polygonRings = geometry.coordinates[0];
              return pointInPolygon(pt, polygonRings);
            } else if (geometry.type === "MultiPolygon") {
              return geometry.coordinates.some((polygon) =>
                pointInPolygon(pt, polygon[0])
              );
            }
            return false;
          });
          if (!isInAnyRegion) return false;
        }

        if (isRatingFilterActive) {
          if (isNaN(rating)) return false;
          if (rating < minRating || rating > maxRating) {
            return false;
          }
        }

        if (isReviewFilterActive) {
          if (isNaN(reviews)) return false;
          if (
            (minReview !== "" && reviews < minReview) ||
            (maxReview !== "" && reviews > maxReview)
          ) {
            return false;
          }
        }

        if (selectedCuisines.length > 0) {
          const shopCuisines = point.properties.cuisines || "";
          const shopCuisinesLower = shopCuisines.toLowerCase();

          const hasCuisine = selectedCuisines.some((cuisine) =>
            shopCuisinesLower.includes(cuisine)
          );

          if (!hasCuisine) return false;
        }

        return true;
      };

      points = points.filter(combinedFilter);
      console.log("Points after combined filter:", points);
      console.log(points);

      setApiData(points);
    } catch (error) {
      console.error(error.message);
      setError("error in fetching data");
    } finally {
      setLoading(false);
    }
  };

  const clusterData = useMemo(() => {
    if (apiData.length === 0 || !mapBounds) return [];
    clusterRef.current.load(apiData);
    const clusters = clusterRef.current.getClusters(
      [
        mapBounds.getWest(),
        mapBounds.getSouth(),
        mapBounds.getEast(),
        mapBounds.getNorth(),
      ],
      zoom
    );
    console.log("Cluster data:", clusters);

    return clusters;
  }, [apiData, mapBounds, zoom]);

  const { clustersToRender, markersToRender } = useMemo(() => {
    const clustersToRender = [];
    const markersToRender = [];
    const renderedMarkers = new Set();

    clusterData.forEach((cluster) => {
      if (cluster.properties.cluster) {
        if (cluster.properties.point_count >= 15) {
          clustersToRender.push(cluster);
        } else {
          const leaves = clusterRef.current.getLeaves(
            cluster.id,
            cluster.properties.point_count,
            0
          );
          leaves.forEach((leaf) => {
            const shop_id = leaf.properties.shop_id;
            if (!renderedMarkers.has(shop_id)) {
              markersToRender.push(leaf);
              renderedMarkers.add(shop_id);
            }
          });
        }
      } else {
        const shop_id = cluster.properties.shop_id;
        if (!renderedMarkers.has(shop_id)) {
          markersToRender.push(cluster);
          renderedMarkers.add(shop_id);
        }
      }
    });

    console.log("Clusters to render:", clustersToRender);
    console.log("Markers to render:", markersToRender);

    return { clustersToRender, markersToRender };
  }, [clusterData]);

  const mapCenter = useMemo(() => {
    if (apiData.length === 0) return [51.505, -0.09];
    const lats = apiData.map((point) => point.geometry.coordinates[1]);
    const lons = apiData.map((point) => point.geometry.coordinates[0]);
    const avgLat = lats.reduce((sum, curr) => sum + curr, 0) / lats.length;
    const avgLon = lons.reduce((sum, curr) => sum + curr, 0) / lons.length;
    return [avgLat, avgLon];
  }, [apiData]);

  const calculatedMapBounds = useMemo(() => {
    if (apiData.length === 0) return null;
    const latLngs = apiData.map((point) => [
      point.geometry.coordinates[1],
      point.geometry.coordinates[0],
    ]);
    return L.latLngBounds(latLngs);
  }, [apiData]);

  const groupedResults = useMemo(() => {
    const groups = {};
    apiData.forEach((shop) => {
      const company = shop.properties.company;
      if (!groups[company]) {
        groups[company] = [];
      }
      groups[company].push(shop);
    });
    return groups;
  }, [apiData]);

  const [expandedCompanies, setExpandedCompanies] = useState({});

  const toggleCompany = (company) => {
    setExpandedCompanies((prev) => ({
      ...prev,
      [company]: !prev[company],
    }));
  };

  const companyList = useMemo(
    () => Object.keys(groupedResults),
    [groupedResults]
  );

  const mapRef = useRef(null);
  const markerRefs = useRef({});
  const [activeMarker, setActiveMarker] = useState(null);
  const [isMapMoving, setIsMapMoving] = useState(false);

  useEffect(() => {
    if (activeMarker && markerRefs.current[activeMarker] && !isMapMoving) {
      setTimeout(() => {
        if (markerRefs.current[activeMarker]) {
          markerRefs.current[activeMarker].openPopup();
        }
      }, 100);
    }
  }, [activeMarker, isMapMoving]);

  const focusOnMarker = (coordinates, shopId) => {
    if (mapRef.current) {
      const map = mapRef.current;

      // Close previous popup
      if (activeMarker && markerRefs.current[activeMarker]) {
        markerRefs.current[activeMarker].closePopup();
      }

      setIsMapMoving(true);
      setActiveMarker(shopId);

      map.flyTo([coordinates[1], coordinates[0]], 18, {
        duration: 2,
        easeLinearity: 0.1,
        noMoveStart: true,
      });
      const handleMoveEnd = () => {
        setIsMapMoving(false);
        map.off("moveend", handleMoveEnd);
      };

      map.on("moveend", handleMoveEnd);
    }
  };

  const { user } = useUser();
  console.log(user);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className="bg-white w-20 h-screen absolute left-0 z-50 flex flex-col items-center border-r">
        <div className="my-2 bg-cover bg-mealzo-sidebar-icon w-12 h-12"></div>
        <div className="w-full h-full flex flex-col items-center justify-between">
          <div className="w-full flex flex-col">
            <button
              className={`py-4 hover:text-orange-600 ${isFilterOpen && "bg-orange-100 text-orange-600"} text-center flex flex-col items-center`}
              onClick={() => {
                setIsFilterOpen(true);
                setIsDeviceOpen(false);
                setIsProfileOpen(false);
              }}
            >
              <HiAdjustments size={30} style={{ transform: "rotate(90deg)" }} />
              Filters
            </button>
            <button
              className={`py-4 hover:text-orange-600 ${isDeviceOpen && "bg-orange-100 text-orange-600"} text-center flex flex-col items-center`}
              onClick={() => {
                setIsDeviceOpen(true);
                setIsFilterOpen(false);
                setIsProfileOpen(false);
              }}
            >
              <PiDevices size={30} />
              Devices
            </button>
          </div>
          <button
            className={`py-6 px-1 bg-white hover:text-orange-600 ${isProfileOpen && "text-orange-600"} text-center flex flex-col items-center`}
            onClick={() => {
              setIsProfileOpen(true);
              setIsFilterOpen(false);
              setIsDeviceOpen(false);
            }}
          >
            <RiAccountCircleFill size={40} />
          </button>
        </div>
      </div>
      <Filterbar
        isOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        register={register}
        handleSubmit={handleSubmit}
        control={control}
        watch={watch}
        region={region}
        cuisine={cuisine}
        companies={companies}
        onSubmit={onSubmit}
        loading={loading}
        error={error}
        handleReset={handleReset}
      />
      <DeviceStatus isOpen={isDeviceOpen} setIsDeviceOpen={setIsDeviceOpen} />
      <Profilebar
        isOpen={isProfileOpen}
        setIsProfileOpen={setIsProfileOpen}
        user={user}
        onLogoutClick={handleLogoutClick}
      />
      {isLogoutModalOpen && (
        <LogoutModal
          isOpen={isLogoutModalOpen}
          onClose={handleCloseLogoutModal}
        />
      )}

      <button
        className="bg-white w-96 h-16 absolute top-5 right-5 z-30 flex justify-between items-center px-4 border rounded-lg py-4 hover:text-orange-600 focus:outline-none transition-colors duration-200"
        onClick={toggleResult}
      >
        <span className="text-xl font-medium">Results</span>
        {isResultOpen ? (
          <IoIosArrowUp size={24} />
        ) : (
          <IoIosArrowDown size={24} />
        )}
      </button>

      {isResultOpen && (
        <ResultBar
          groupedResults={groupedResults}
          companyList={companyList}
          expandedCompanies={expandedCompanies}
          toggleCompany={toggleCompany}
          onMarkerFocus={focusOnMarker}
          activeMarker={activeMarker}
        />
      )}

      <div className="relative z-0 h-full w-full">
        <div
          className={`relative h-full w-full transition-all duration-300 ${
            loading ? "blur-sm" : ""
          }`}
        >
          <MapContainer
            ref={mapRef}
            center={mapCenter}
            zoom={zoom}
            minZoom={5}
            maxZoom={22}
            style={{ height: "100%", width: "100%" }}
          >
            <UpdateMapBounds setMapBounds={setMapBounds} setZoom={setZoom} />
            {calculatedMapBounds && <MapBounds bounds={calculatedMapBounds} />}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxZoom={22}
            />
            {regionBoundaryData && (
              <GeoJSON
                data={regionBoundaryData}
                style={{ color: "red", weight: 1 }}
              />
            )}

            {clustersToRender.map((cluster) => (
              <ClusterMarker
                key={`cluster-${cluster.id}`}
                cluster={cluster}
                createClusterIcon={(count) => createClusterIcon(count)}
                clusterRef={clusterRef}
              />
            ))}

            {markersToRender.map((marker) => {
              const companyKey = marker.properties.company
                .replace(/\s+/g, "")
                .toLowerCase();
              const IconComponent = companyIcons[companyKey];
              const PinComponent = companyPins[companyKey];
              const pin = createCustomIcon(PinComponent, {
                width: 44,
                height: 44,
              });
              return (
                <Marker
                  key={`marker-${marker.properties.shop_id}`}
                  position={[
                    marker.geometry.coordinates[1],
                    marker.geometry.coordinates[0],
                  ]}
                  icon={pin}
                  ref={(ref) => {
                    if (ref) {
                      markerRefs.current[marker.properties.shop_id] = ref;
                    }
                  }}
                  eventHandlers={{
                    click: () => {
                      setActiveMarker(marker.properties.shop_id);
                    },
                  }}
                >
                  <Popup className="p-0 m-0 custom-popup" offset={[-1, -30]}>
                    <div className="flex flex-col w-96 py-2 gap-2 pr-4">
                      <div className="flex gap-2 justify-between">
                        <span className="font-bold text-xl">
                          {marker.properties.shopName}
                        </span>

                        {IconComponent && (
                          <IconComponent width={28} height={28} />
                        )}
                      </div>
                      <div className="flex w-full items-center py-2">
                        <span className="w-2/6">Restaurant Details</span>
                        <div className="w-4/6 h-px bg-gray-500"></div>
                      </div>
                      {marker.properties.phone ? (
                        <div className="flex justify-between">
                          <div className="flex gap-1">
                            <PiPhone size={18} />
                            <span>Phone No.</span>
                          </div>
                          <span>{marker.properties.phone}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <div className="flex gap-1">
                            <PiPhone size={18} color="gray" />
                            <span className="text-gray-400">Phone No.</span>
                          </div>
                          <span className="text-gray-400">None</span>
                        </div>
                      )}
                      {marker.properties.postcode ? (
                        <div className="flex justify-between">
                          <div className="flex gap-1">
                            <HiOutlineEnvelope size={17} />
                            <span>Postcode</span>
                          </div>
                          <span>{marker.properties.postcode}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <div className="flex gap-1">
                            <HiOutlineEnvelope size={17} color="gray" />
                            <span className="text-gray-400">Postcode</span>
                          </div>
                          <span className="text-gray-400">None</span>
                        </div>
                      )}

                      {!marker.properties.cuisines ||
                      marker.properties.cuisines === "None" ? (
                        <div className="flex justify-between">
                          <div className="flex gap-1">
                            <ImSpoonKnife size={15} color="gray" />
                            <span className="text-gray-400">Cuisines</span>
                          </div>
                          <span className="text-gray-400">None</span>
                        </div>
                      ) : (
                        <div className="flex justify-between space-x-8">
                          <div className="flex gap-1">
                            <ImSpoonKnife size={15} />
                            <span>Cuisines</span>
                          </div>
                          <span>{marker.properties.cuisines}</span>
                        </div>
                      )}

                      {!marker.properties.rating ||
                      marker.properties.rating === "None" ? (
                        <div className="flex justify-between">
                          <div className="flex gap-1">
                            <CiStar size={19} color="gray" />
                            <span className="text-gray-400">Rating</span>
                          </div>
                          <span className="text-gray-400">None</span>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <div className="flex gap-1">
                            <CiStar size={19} />
                            <span>Rating</span>
                          </div>
                          <span>{marker.properties.rating}</span>
                        </div>
                      )}

                      {!marker.properties.totalReviews ||
                      marker.properties.totalReviews === "None" ? (
                        <div className="flex justify-between">
                          <div className="flex gap-1">
                            <GoCommentDiscussion size={17} color="gray" />
                            <span className="text-gray-400">Reviews</span>
                          </div>
                          <span className="text-gray-400">None</span>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <div className="flex gap-1">
                            <GoCommentDiscussion size={17} />
                            <span>Reviews</span>
                          </div>
                          <span>{marker.properties.totalReviews}</span>
                        </div>
                      )}

                      {marker.properties.address ? (
                        <div className="flex justify-between space-x-8">
                          <div className="flex gap-1">
                            <GrLocation size={17} />
                            <span>Address</span>
                          </div>
                          <span className="text-left">
                            {marker.properties.address}
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-between ">
                          <div className="flex gap-1">
                            <GrLocation size={17} color="gray" />
                            <span className="text-gray-400">Address</span>
                          </div>
                          <span className="text-gray-400">None</span>
                        </div>
                      )}
                      <div className="flex w-full items-center py-2">
                        <span className="w-2/6">Quick Access Links</span>
                        <div className="w-4/6 h-px bg-gray-500"></div>
                      </div>
                      {marker.properties.website ? (
                        <div className="flex justify-between">
                          <div className="flex gap-1">
                            <HiMiniLink size={18} />
                            <span>Website</span>
                          </div>
                          <a
                            href={marker.properties.website}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {marker.properties.website}
                          </a>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <div className="flex gap-1">
                            <HiMiniLink size={18} color="gray" />
                            <span className="text-gray-400">Website</span>
                          </div>
                          <span className="text-gray-400">None</span>
                        </div>
                      )}
                      {marker.properties.googlemap ? (
                        <div className="flex justify-between">
                          <div className="flex gap-1">
                            <GrMapLocation size={16} />
                            <span>Google Maps</span>
                          </div>
                          <a
                            href={marker.properties.googlemap}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Google Map
                          </a>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <div className="flex gap-1">
                            <GrMapLocation size={16} color="gray" />
                            <span className="text-gray-400">Google Maps</span>
                          </div>
                          <span className="text-gray-400">None</span>
                        </div>
                      )}
                      {marker.properties.company.toLowerCase() ===
                        "google business" &&
                      user.access.is_allowed_change &&
                      user.access.is_marketing ? (
                        <div className="flex justify-between">
                          <div className="flex gap-1">
                            <SlSocialGoogle size={16} />
                            <span>Google Business</span>
                          </div>
                          <Link
                            to={`/panel/${marker.properties.locationId}`}
                            target="_blank"
                            className=" text-white rounded"
                          >
                            Google Business Dashboard
                          </Link>
                        </div>
                      ) : null}
                      {/* <div className="flex w-full items-center">
                        <span className="w-2/5">Additional Information</span>
                        <div className="w-3/5 h-px bg-gray-500"></div>
                      </div> */}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {loading && (
          <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-5 z-50">
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
        )}
      </div>
    </div>
  );
};

export default DataMap;
