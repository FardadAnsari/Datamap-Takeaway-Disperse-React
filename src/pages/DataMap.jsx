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
import { googlebusiness } from "../component/googlebusiness";
import { transformData } from "../component/parsers";
import LogoutModal from "../component/LogoutModal";
import { HiAdjustments } from "react-icons/hi";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { RiAccountCircleFill, RiGoogleLine } from "react-icons/ri";
import { ImSpoonKnife } from "react-icons/im";
import { SlSocialGoogle } from "react-icons/sl";
import { PiDevices, PiPhone } from "react-icons/pi";
import { HiMiniLink, HiOutlineEnvelope } from "react-icons/hi2";
import { CiStar } from "react-icons/ci";
import { GrLocation, GrMapLocation } from "react-icons/gr";
import { GoCommentDiscussion } from "react-icons/go";
import DeviceStatus from "../component/DeviceStatus";
import GoogleBusinessResultbar from "../component/GoogleBusinessResultbar";
import GoogleBusinessFilterbar from "../component/GoogleBusinessFilterbar";

// Function to create a custom icon using a React component
const createCustomIcon = (PinComponent, options = {}) => {
  const { width = 40, height = 40 } = options;

  // Convert the React component to an HTML string
  const iconHTML = ReactDOMServer.renderToString(
    <PinComponent width={width} height={height} />
  );

  // Return a Leaflet divIcon with the rendered HTML
  return L.divIcon({
    html: iconHTML,
    className: "",
    iconSize: [width, height],
  });
};

// Function to create a cluster icon with a count
const createClusterIcon = (count) => {
  // Determine the color and size based on the count
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

  // Create an SVG icon with the count displayed
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

// Component to update map bounds and zoom level
const UpdateMapBounds = ({ setMapBounds, setZoom }) => {
  const map = useMap();

  // Effect to update bounds and zoom when the map moves
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

// Component to fit the map to the given bounds
const MapBounds = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, bounds]);
  return null;
};

// Main DataMap component
const DataMap = () => {
  // Form handling for companies and Google Business data
  const {
    register: registerCompanies,
    handleSubmit: handleSubmitCompanies,
    control: controlCompanies,
    watch: watchCompanies,
    reset: resetCompanies,
  } = useForm({
    defaultValues: {
      selectedCompanies: [],
      region: [],
      cuisine: [],
      ratingRange: [0, 5],
      reviewRange: { min: "", max: "" },
      searchTerm: "",
    },
  });

  const {
    register: registerGoogleBusiness,
    handleSubmit: handleSubmitGoogleBusiness,
    control: controlGoogleBusiness,
    reset: resetGoogleBusiness,
  } = useForm({
    defaultValues: {
      selectedCompanies: googlebusiness,
      region: [],
      cuisine: [],
      postcode: "",
      searchTerm: "",
    },
  });

  // Separate loading and error states for companies and Google Business data
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingGoogleBusiness, setLoadingGoogleBusiness] = useState(false);
  const [errorCompanies, setErrorCompanies] = useState(null);
  const [errorGoogleBusiness, setErrorGoogleBusiness] = useState(null);

  // Reset handlers for the forms
  const handleResetCompanies = () => {
    resetCompanies();
  };

  const handleResetGoogleBusiness = () => {
    resetGoogleBusiness();
  };

  // State for region, cuisine, and region boundary data
  const [region, setRegion] = useState([]);
  const [cuisine, setCuisine] = useState([]);
  const [postcodeData, setPostcodeData] = useState([]);
  const [regionBoundaryData, setRegionBoundaryData] = useState(null);
  const [apiData, setApiData] = useState([]);
  const [mapBounds, setMapBounds] = useState(null);
  const [zoom, setZoom] = useState(13);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isGoogleBusinessFilterOpen, setIsGoogleBusinessFilterOpen] =
    useState(false);
  const [isDeviceOpen, setIsDeviceOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Function to handle logout click
  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  // Function to close the logout modal
  const handleCloseLogoutModal = () => {
    setIsLogoutModalOpen(false);
  };

  // Function to toggle the result bar
  const toggleResult = () => {
    setIsResultOpen((prev) => !prev);
  };

  const [activeTab, setActiveTab] = useState("companies"); // Track active tab

  // Define isGoogleBusiness based on activeTab
  const isGoogleBusiness = activeTab === "google";

  // Ref for the Supercluster instance
  const clusterRef = useRef(
    new Supercluster({
      radius: 75,
      maxZoom: 22,
      minZoom: 0,
    })
  );

  // Fetch region data on component mount
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

  // Fetch cuisine data on component mount
  useEffect(() => {
    const fetchCuisine = async () => {
      try {
        const response = await instance.get("/api/v1/companies/cuisine/");
        console.log("Cuisine:", response.data);
        setCuisine(response.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchCuisine();
  }, []);

  // Fetch postcode data on component mount
  useEffect(() => {
    const fetchPostcode = async () => {
      try {
        const response = await instance.get(
          "/api/v1/google/business-info/postcode/103526686887949354169/"
        );
        console.log("Postcode Data:", response);

        // Ensure the response is an array
        if (Array.isArray(response.data)) {
          setPostcodeData(response.data); // Set postcode correctly
        } else {
          console.error("Postcode data is not an array:", response.data);
          setPostcodeData([]); // Set to an empty array if it's not an array
        }
      } catch (error) {
        console.log(error);
        setPostcodeData([]); // Fallback to an empty array in case of error
      }
    };
    fetchPostcode();
  }, []);

  // Function to fetch region boundary data
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

  // Function to handle Google Business form submission
  const onSubmitGoogleBusiness = async (data) => {
    console.log("form submitted:", data);
    setLoadingGoogleBusiness(true);
    setErrorGoogleBusiness(null);

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

      // Directly use the Google Business object (no need to filter)
      const googleBusinessCompany = googlebusiness[0];

      const fetchCompanyData = async (company) => {
        const cachedData = await getCachedCompanyData(company.id);
        if (cachedData) {
          console.log(`using cached data for ${company.name}`);
          return cachedData;
        } else {
          try {
            const response = await instance.get(company.apiUrl);
            await setCachedCompanyData(company.id, response.data);
            console.log(`received and cached data for ${company.name}`);
            return response.data;
          } catch (error) {
            console.error(`error in fetching data ${company.name}:`, error);
            throw error;
          }
        }
      };

      const response = await fetchCompanyData(googleBusinessCompany);
      console.log("Response from Google Business:", response);

      let points = transformData(response, googleBusinessCompany).filter(
        (point) => {
          const [lon, lat] = point.geometry.coordinates;
          return (
            !isNaN(lon) &&
            !isNaN(lat) &&
            lon >= -180 &&
            lon <= 180 &&
            lat >= -90 &&
            lat <= 90
          );
        }
      );

      console.log("Points after first filter:", points);

      const { searchTerm, cuisine, postcode } = data;

      const lowerCaseSearchTerm = searchTerm?.trim().toLowerCase() || "";

      const selectedCuisines = cuisine.map((c) => c.value.toLowerCase());

      // const selectedPostcode = postcode.map((c) => c.value.toLowerCase());

      const combinedFilter = (point) => {
        const shopName = point.properties.shopName?.toLowerCase() || "";

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

        if (selectedCuisines.length > 0) {
          const shopCuisines = point.properties.cuisines || "";
          const shopCuisinesLower = shopCuisines.toLowerCase();

          const hasCuisine = selectedCuisines.some((cuisine) =>
            shopCuisinesLower.includes(cuisine)
          );

          if (!hasCuisine) return false;
        }

        // if (selectedPostcode) {
        //   const shopPostcode = point.properties.postcode || "";
        //   const shopPostcodeLower = shopPostcode.toLowerCase();

        //   const hasPostcode = selectedPostcode.some((postcode) =>
        //     shopPostcodeLower.includes(postcode)
        //   );

        //   if (!hasPostcode) return false;
        // }

        return true;
      };

      points = points.filter(combinedFilter);
      console.log("Points after combined filter:", points);

      setApiData(points);
    } catch (error) {
      console.error(error.message);
      setErrorGoogleBusiness("error in fetching data");
    } finally {
      setLoadingGoogleBusiness(false);
    }
  };

  // Function to handle companies form submission
  const onSubmitCompanies = async (data) => {
    console.log("form submitted:", data);
    setLoadingCompanies(true);
    setErrorCompanies(null);

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
        setLoadingCompanies(false);
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
      setErrorCompanies("error in fetching data");
    } finally {
      setLoadingCompanies(false);
    }
  };

  // Memoized cluster data based on API data and map bounds
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

  // Memoized clusters and markers to render
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

  // Calculate the center of the map based on API data
  const mapCenter = useMemo(() => {
    if (apiData.length === 0) return [51.505, -0.09];
    const lats = apiData.map((point) => point.geometry.coordinates[1]);
    const lons = apiData.map((point) => point.geometry.coordinates[0]);
    const avgLat = lats.reduce((sum, curr) => sum + curr, 0) / lats.length;
    const avgLon = lons.reduce((sum, curr) => sum + curr, 0) / lons.length;
    return [avgLat, avgLon];
  }, [apiData]);

  // Calculate the bounds of the map based on API data
  const calculatedMapBounds = useMemo(() => {
    if (apiData.length === 0) return null;
    const latLngs = apiData.map((point) => [
      point.geometry.coordinates[1],
      point.geometry.coordinates[0],
    ]);
    return L.latLngBounds(latLngs);
  }, [apiData]);

  // Group results by company
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

  // Separate regular company results
  const regularCompanyResults = useMemo(() => {
    const regularData = { ...groupedResults };
    delete regularData["Google Business"];
    return regularData;
  }, [groupedResults]);

  // Separate Google Business results
  const googleBusinessResults = useMemo(() => {
    const googleBusinessData = {};
    if (groupedResults["Google Business"]) {
      googleBusinessData["Google Business"] = groupedResults["Google Business"];
    }
    return googleBusinessData;
  }, [groupedResults]);

  // State to manage expanded companies in the result bar
  const [expandedCompanies, setExpandedCompanies] = useState({});

  // Function to toggle the expansion of a company in the result bar
  const toggleCompany = (company) => {
    setExpandedCompanies((prev) => ({
      ...prev,
      [company]: !prev[company],
    }));
  };

  // Memoized list of companies
  const companyList = useMemo(
    () => Object.keys(groupedResults),
    [groupedResults]
  );

  // Ref for the map container
  const mapRef = useRef(null);
  // Ref for marker references
  const markerRefs = useRef({});
  // State to track the active marker
  const [activeMarker, setActiveMarker] = useState(null);
  // State to track if the map is moving
  const [isMapMoving, setIsMapMoving] = useState(false);
  // State to control whether to open the popup
  const [shouldOpenPopup, setShouldOpenPopup] = useState(true);

  // Effect to open the popup when the active marker changes
  useEffect(() => {
    if (
      activeMarker &&
      markerRefs.current[activeMarker] &&
      !isMapMoving &&
      shouldOpenPopup
    ) {
      setTimeout(() => {
        if (markerRefs.current[activeMarker]) {
          markerRefs.current[activeMarker].openPopup();
        }
      }, 100);
    }
  }, [activeMarker, isMapMoving, shouldOpenPopup]);

  // Function to focus on a marker and open its popup
  const focusOnMarker = (coordinates, shopId) => {
    if (mapRef.current) {
      const map = mapRef.current;

      if (activeMarker && markerRefs.current[activeMarker]) {
        markerRefs.current[activeMarker].closePopup();
      }

      setShouldOpenPopup(true);
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

  // Function to focus on a marker without opening its popup
  const focusOnDistinct = (coordinates, shopId) => {
    if (mapRef.current) {
      const map = mapRef.current;

      if (activeMarker && markerRefs.current[activeMarker]) {
        markerRefs.current[activeMarker].closePopup();
      }

      setShouldOpenPopup(false);
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

  // Get the user from the context
  const { user } = useUser();
  console.log(user);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Sidebar with navigation buttons */}
      <div className="bg-white w-20 h-screen absolute left-0 z-50 flex flex-col items-center border-r">
        <div className="my-2 bg-cover bg-mealzo-sidebar-icon w-12 h-12"></div>
        <div className="w-full h-full flex flex-col items-center justify-between">
          <div className="w-full flex flex-col">
            <button
              className={`py-4 hover:text-orange-600 ${isFilterOpen && "bg-orange-100 text-orange-600"} text-center flex flex-col items-center`}
              onClick={() => {
                setIsFilterOpen(true);
                setIsGoogleBusinessFilterOpen(false);
                setIsDeviceOpen(false);
                setIsProfileOpen(false);
              }}
            >
              <HiAdjustments size={30} style={{ transform: "rotate(90deg)" }} />
              <p className="text-sm">Companies</p>
            </button>
            <button
              className={`py-4 hover:text-orange-600 ${isGoogleBusinessFilterOpen && "bg-orange-100 text-orange-600"} text-center flex flex-col items-center`}
              onClick={() => {
                setIsGoogleBusinessFilterOpen(true);
                setIsFilterOpen(false);
                setIsDeviceOpen(false);
                setIsProfileOpen(false);
              }}
            >
              <RiGoogleLine size={25} />
              <p className="text-sm">Business</p>
            </button>
            <button
              className={`py-4 hover:text-orange-600 ${isDeviceOpen && "bg-orange-100 text-orange-600"} text-center flex flex-col items-center`}
              onClick={() => {
                setIsDeviceOpen(true);
                setIsGoogleBusinessFilterOpen(false);
                setIsFilterOpen(false);
                setIsProfileOpen(false);
              }}
            >
              <PiDevices size={30} />
              <p className="text-sm">Devices</p>
            </button>
          </div>
          <button
            className={`py-6 px-1 bg-white hover:text-orange-600 ${isProfileOpen && "text-orange-600"} text-center flex flex-col items-center`}
            onClick={() => {
              setIsProfileOpen(true);
              setIsGoogleBusinessFilterOpen(false);
              setIsFilterOpen(false);
              setIsDeviceOpen(false);
            }}
          >
            <RiAccountCircleFill size={40} />
          </button>
        </div>
      </div>

      {/* Filterbar component */}
      <Filterbar
        isOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        registerCompanies={registerCompanies}
        handleSubmitCompanies={handleSubmitCompanies}
        controlCompanies={controlCompanies}
        watchCompanies={watchCompanies}
        region={region}
        cuisine={cuisine}
        companies={companies}
        onSubmitCompanies={onSubmitCompanies}
        onSubmitGoogleBusiness={onSubmitGoogleBusiness}
        loadingCompanies={loadingCompanies}
        errorCompanies={errorCompanies}
        handleResetCompanies={handleResetCompanies}
      />

      <GoogleBusinessFilterbar
        isOpen={isGoogleBusinessFilterOpen}
        setIsFilterOpen={setIsGoogleBusinessFilterOpen}
        registerGoogleBusiness={registerGoogleBusiness}
        handleSubmitGoogleBusiness={handleSubmitGoogleBusiness}
        controlGoogleBusiness={controlGoogleBusiness}
        region={region}
        postcodeData={postcodeData}
        cuisine={cuisine}
        onSubmitGoogleBusiness={onSubmitGoogleBusiness}
        loadingGoogleBusiness={loadingGoogleBusiness}
        errorGoogleBusiness={errorGoogleBusiness}
        handleResetGoogleBusiness={handleResetGoogleBusiness}
      />

      {/* DeviceStatus component */}
      <DeviceStatus isOpen={isDeviceOpen} setIsDeviceOpen={setIsDeviceOpen} />

      {/* Profilebar component */}
      <Profilebar
        isOpen={isProfileOpen}
        setIsProfileOpen={setIsProfileOpen}
        user={user}
        onLogoutClick={handleLogoutClick}
      />

      {/* Logout modal */}
      {isLogoutModalOpen && (
        <LogoutModal
          isOpen={isLogoutModalOpen}
          onClose={handleCloseLogoutModal}
        />
      )}

      {/* Button to toggle the result bar */}
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

      {/* ResultBar component */}
      {isFilterOpen && isResultOpen && (
        <ResultBar
          groupedResults={regularCompanyResults}
          companyList={companyList}
          expandedCompanies={expandedCompanies}
          toggleCompany={toggleCompany}
          onMarkerFocus={focusOnMarker}
          onDistinctFocus={focusOnDistinct}
          activeMarker={activeMarker}
        />
      )}
      {/* GoogleBusinessResultBar component */}
      {isGoogleBusinessFilterOpen && isResultOpen && (
        <GoogleBusinessResultbar
          groupedResults={googleBusinessResults}
          companyList={companyList}
          expandedCompanies={expandedCompanies}
          toggleCompany={toggleCompany}
          onMarkerFocus={focusOnMarker}
          activeMarker={activeMarker}
        />
      )}

      {/* Map container */}
      <div className="relative z-0 h-full w-full">
        <div
          className={`relative h-full w-full transition-all duration-300 ${
            loadingGoogleBusiness || loadingCompanies ? "blur-sm" : ""
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

            {/* Render clusters */}
            {clustersToRender.map((cluster) => (
              <ClusterMarker
                key={`cluster-${cluster.id}`}
                cluster={cluster}
                createClusterIcon={(count) => createClusterIcon(count)}
                clusterRef={clusterRef}
              />
            ))}

            {/* Render individual markers */}
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
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Loading spinner */}
        {(loadingGoogleBusiness || loadingCompanies) && (
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
