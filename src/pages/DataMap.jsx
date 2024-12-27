import React, { useState, useRef, useMemo, useEffect } from "react";
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
import { HiAdjustments } from "react-icons/hi";
import { IoIosArrowBack } from "react-icons/io";
import { RiAccountCircleFill } from "react-icons/ri";
import instance from "../component/api";
import ClusterMarker from "../component/ClusterMarker";
import { Controller, useForm } from "react-hook-form";
import Select from "react-select";
import AutoCompletionMultiSelectStyles from "../component/AutoCompletionMultiSelectStyles";
import pointInPolygon from "point-in-polygon";
import ReactSlider from "react-slider";
import { ColorRing } from "react-loader-spinner";

const companies = [
  {
    id: "dlv",
    name: "Delivero",
    apiUrl: "/api/v1/companies/deliveroo/",
    requiresAuth: true,
    type: "type1",
    color: "#572349",
  },
  {
    id: "fhs",
    name: "Food House",
    apiUrl: "/api/v1/companies/foodhouse/",
    requiresAuth: true,
    type: "type1",
    color: "#c2008e",
  },
  {
    id: "fhb",
    name: "Food Hub",
    apiUrl: "/api/v1/companies/foodhub/",
    requiresAuth: true,
    type: "type1",
    color: "#cc171b",
  },
  {
    id: "gbs",
    name: "Google Business",
    apiUrl: "/api/v1/google/business-info/front/103526686887949354169/",
    requiresAuth: false,
    type: "type3",
    color: "#0000FF",
  },
  {
    id: "jet",
    name: "Just Eat",
    apiUrl: "/api/v1/companies/justeat/",
    requiresAuth: true,
    type: "type1",
    color: "#c0f70a",
  },
  {
    id: "mlz",
    name: "Mealzo",
    apiUrl: "/api/v1/zoho/mealzo/",
    requiresAuth: true,
    type: "type2",
    color: "#e9540d",
  },
  {
    id: "mnl",
    name: "Menu List",
    apiUrl: "/api/v1/companies/menulist/",
    requiresAuth: true,
    type: "type1",
    color: "#7f9741",
  },
  {
    id: "scf",
    name: "Scoffable",
    apiUrl: "/api/v1/companies/scoffable/",
    requiresAuth: false,
    type: "type1",
    color: "#d9685b",
  },
  {
    id: "stf",
    name: "Straight From",
    apiUrl: "/api/v1/companies/straightfrom/",
    requiresAuth: true,
    type: "type1",
    color: "#5bd9a5",
  },
  {
    id: "uet",
    name: "Uber Eats",
    apiUrl: "/api/v1/companies/ubereats",
    requiresAuth: true,
    type: "type1",
    color: "#0bab0b",
  },
  {
    id: "wtf",
    name: "What The Fork",
    apiUrl: "/api/v1/companies/whatthefork/",
    requiresAuth: true,
    type: "type1",
    color: "#f7d205",
  },
];

const parseType1 = (item, company) => {
  const lon = parseFloat(item.longitude);
  const lat = parseFloat(item.latitude);
  if (isNaN(lat) || isNaN(lon)) return null;

  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [lon, lat],
    },
    properties: {
      cluster: false,
      shop_id: item.id || `${company.id}-${lon}-${lat}`,
      shopName: item.shop_name,
      company: company.name,
      address: item.address,
      postcode: item.postcode,
      cuisines: item.cuisines,
      googlemap: item.map_url,
      rating: item.rating,
      totalReviews: item.total_reviews,
      phone: item.phone,
      description: item.description,
      color: company.color,
    },
  };
};

const parseType2 = (item, company) => {
  const lon = parseFloat(item.Longitude);
  const lat = parseFloat(item.Latitude);
  if (isNaN(lat) || isNaN(lon)) return null;

  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [lon, lat],
    },
    properties: {
      cluster: false,
      shop_id: item.id || `${company.id}-${lon}-${lat}`,
      shopName: item.Account_Name,
      company: company.name,
      postcode: item.Billing_Code,
      rating: item.Rating,
      phone: item.Phone,
      color: company.color,
    },
  };
};

const parseGoogleBusiness = (item, company) => {
  if (
    !item.latlng ||
    typeof item.latlng.longitude === "undefined" ||
    typeof item.latlng.latitude === "undefined"
  ) {
    console.warn(`
      Location data missing for shop_id: ${item.shop_id || "Unknown"}
    `);
    return null;
  }
  const lon = parseFloat(item.latlng.longitude);
  const lat = parseFloat(item.latlng.latitude);
  if (isNaN(lat) || isNaN(lon)) {
    console.warn(`
      Invalid coordinates for shop_id: ${item.shop_id || "Unknown"}
    `);
    return null;
  }

  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [lon, lat],
    },
    properties: {
      cluster: false,
      shop_id: item.shop_id || `${company.id}-${lon}-${lat}`,
      shopName: item.title,
      company: company.name,
      address: `${item?.storefrontAddress.addressLines || ""} ${
        item?.storefrontAddress.locality || ""
      }`,
      postcode: item.storefrontAddress.postalCode,
      website: item.websiteUri,
      googlemap: item.metadata.mapsUri,
      phone: item.phoneNumbers.primaryPhone,
      canDelete: item.metadata.canDelete,
      canHaveFoodMenus: item.metadata.canHaveFoodMenus,
      hasGoogleUpdated: item.metadata.hasGoogleUpdated,
      hasVoiceOfMerchant: item.metadata.hasVoiceOfMerchant,
      newReviewUri: item.metadata.newReviewUri,
      description: item.description,
      color: company.color,
    },
  };
};

const transformData = (items, company) => {
  const transformed = items
    .map((item) => {
      switch (company.type) {
        case "type1":
          return parseType1(item, company);
        case "type2":
          return parseType2(item, company);
        case "type3":
          return parseGoogleBusiness(item, company);
        default:
          console.warn(`company type unknown: ${company.type}`);
          return null;
      }
    })
    .filter((item) => item !== null);

  console.log(`Transformed data for ${company.name}:, transformed`);
  return transformed;
};

const createCustomIcon = (color) => {
  const svgIcon = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="${color}"
      stroke="white"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: "",
    iconSize: [24, 24],
    popupAnchor: [0, -12],
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
  const { register, handleSubmit, control, watch } = useForm({
    defaultValues: {
      selectedCompanies: [],
      region: [],
      cuisine: [],
      ratingRange: [0, 5],
      reviewRange: { min: "", max: "" },
      searchTerm: "",
    },
  });

  const [region, setRegion] = useState([]);
  const [cuisine, setCuisine] = useState([]);
  const [regionBoundaryData, setRegionBoundaryData] = useState(null);
  const [apiData, setApiData] = useState([]);
  const [mapBounds, setMapBounds] = useState(null);
  const [zoom, setZoom] = useState(13);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
    const url = ` https://ons-dp-prod-cdn.s3.eu-west-2.amazonaws.com/maptiles/ap-geos/v3/${selectedRegion.substring(0, 3)}/${selectedRegion}.json`;
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
    console.log("Form Data Submitted:", data);
    setLoading(true);
    setError(null);

    try {
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

      const requests = selectedCompanyList.map((company) =>
        instance.get(company.apiUrl)
      );

      const responses = await Promise.all(requests);
      console.log("Responses from companies:", responses);

      let points = responses
        .flatMap((res, index) =>
          transformData(res.data, selectedCompanyList[index])
        )
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

      console.log("Points after initial filtering:", points);

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
      console.log("Points after combined filtering:", points);

      setApiData(points);
    } catch (error) {
      console.error(error.message);
      setError("Error fetching data");
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

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className="bg-white w-20 h-screen absolute left-0 z-20 flex flex-col items-center">
        <div className="mt-2 bg-cover bg-mealzo-sidebar-icon w-12 h-12"></div>
        <div className="h-full flex flex-col justify-between ">
          <button
            className="py-6 px-1 bg-white hover:text-orange-600 focus:outline-none text-center flex flex-col items-center"
            onClick={() => {
              setIsFilterOpen(true) && setIsProfileOpen(null);
            }}
          >
            <HiAdjustments size={30} style={{ transform: "rotate(90deg)" }} />
            Filters
          </button>
          <button
            className="py-6 px-1 bg-white hover:text-orange-600 focus:outline-none text-center flex flex-col items-center"
            onClick={() => {
              setIsProfileOpen(true) && setIsFilterOpen(null);
            }}
          >
            <RiAccountCircleFill size={40} />
          </button>
        </div>
      </div>
      <div
        className={`absolute top-0 left-20 h-full bg-white shadow-md z-10 transition-transform duration-300 ease-in-out ${
          isFilterOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "20rem" }}
      >
        <div className="p-4 h-full flex flex-col">
          <button
            className="w-8 mb-4 p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none"
            onClick={() => setIsFilterOpen(false)}
          >
            <IoIosArrowBack />
          </button>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="px-2 flex-1 overflow-y-auto transform scale-x-[-1]"
            style={{ direction: "ltr" }}
          >
            <div className="transform scale-x-[-1]">
              <input
                type="text"
                {...register("searchTerm")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
                placeholder="Serach Shop"
              />

              <Controller
                name="region"
                control={control}
                defaultValue={[]}
                render={({ field }) => (
                  <Select
                    {...field}
                    className="mb-4"
                    placeholder="Select Regions"
                    options={region.map((r) => ({
                      value: r.value,
                      label: r.label,
                    }))}
                    onChange={field.onChange}
                    isSearchable
                    isMulti
                    styles={AutoCompletionMultiSelectStyles}
                  />
                )}
              />
              <Controller
                name="cuisine"
                control={control}
                defaultValue={[]}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Categories"
                    options={cuisine.map((c) => ({
                      value: c.cuisine_name.toLowerCase(),
                      label: c.cuisine_name,
                    }))}
                    onChange={field.onChange}
                    isSearchable
                    isMulti
                    styles={AutoCompletionMultiSelectStyles}
                  />
                )}
              />

              <h2 className="text-lg font-bold my-2">Select Company</h2>
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center space-x-2 mb-2"
                >
                  <input
                    type="checkbox"
                    id={company.id}
                    {...register("selectedCompanies")}
                    value={company.apiUrl}
                    className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor={company.id} className="text-sm">
                    {company.name}
                  </label>
                </div>
              ))}
              <h2 className="text-lg font-bold my-2">Select Rating Range</h2>
              <Controller
                name="ratingRange"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <div className="px-2 py-2">
                    <ReactSlider
                      className="relative w-full h-6 my-4"
                      thumbClassName="bg-orange-500 h-10 w-10 rounded-full cursor-grab border-2 border-white flex items-center justify-center text-white font-bold transform -translate-y-1/2 top-1/2"
                      trackClassName="bg-gray-300 h-1 top-1/2 transform -translate-y-1/2 rounded"
                      min={0}
                      max={5}
                      step={0.1}
                      value={value}
                      onChange={onChange}
                      ariaLabel={["Minimum rating", "Maximum rating"]}
                      ariaValuetext={(state) => `Rating: ${state.valueNow}`}
                      renderThumb={(props, state) => (
                        <div {...props}>{state.valueNow}</div>
                      )}
                    />
                  </div>
                )}
              />
              <h2 className="text-lg font-bold my-2">Select Review Range</h2>
              <div className="flex justify-between">
                <div className="flex flex-col">
                  <label htmlFor="minReview" className="text-sm mb-1">
                    Min Reviews
                  </label>
                  <input
                    type="number"
                    id="minReview"
                    {...register("reviewRange.min", {
                      valueAsNumber: true,
                      min: {
                        value: 0,
                        message: "Minimum reviews must be at least 0",
                      },
                      validate: (value) =>
                        isNaN(value) ||
                        value <= watch("reviewRange.max") ||
                        "Min reviews cannot exceed Max reviews",
                    })}
                    className="w-28 px-1 py-2 border border-gray-300 rounded"
                    min={0}
                    placeholder="Min"
                  />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="maxReview" className="text-sm mb-1">
                    Max Reviews
                  </label>
                  <input
                    type="number"
                    id="maxReview"
                    {...register("reviewRange.max", {
                      valueAsNumber: true,
                      min: {
                        value: 0,
                        message: "Maximum reviews must be at least 0",
                      },
                      validate: (value) =>
                        isNaN(value) ||
                        value >= watch("reviewRange.min") ||
                        "Max reviews cannot be less than Min reviews",
                    })}
                    className="w-28 px-1 py-2 border border-gray-300 rounded"
                    min={0}
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
            <div className="transform scale-x-[-1]">
              <button
                type="submit"
                className="mt-4 w-full py-2 bg-orange-600 text-white rounded hover:bg-orange-700 focus:outline-none disabled:bg-orange-300"
                disabled={loading}
              >
                {loading ? "Is Loading ..." : "Filter"}
              </button>
            </div>

            {error && (
              <div className="mt-4 text-center text-red-600">{error}</div>
            )}
          </form>
        </div>
      </div>
      <div
        className={`absolute top-0 left-20 h-full bg-gradient-to-b from-orange-200 to-white shadow-md z-10 transition-transform duration-300 ease-in-out ${
          isProfileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "20rem" }}
      >
        <div className="p-4 h-full flex flex-col">
          <button
            className="w-8 mb-4 p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none"
            onClick={() => setIsProfileOpen(false)}
          >
            <IoIosArrowBack />
          </button>
        </div>
      </div>
      <div className="relative z-0 h-full w-full">
        <div
          className={`relative h-full w-full transition-all duration-300 ${
            loading ? "blur-sm" : ""
          }`}
        >
          <MapContainer
            center={mapCenter}
            zoom={zoom}
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
                style={{ color: "red", weight: 2 }}
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

            {markersToRender.map((marker) => (
              <Marker
                key={`marker-${marker.properties.shop_id}`}
                position={[
                  marker.geometry.coordinates[1],
                  marker.geometry.coordinates[0],
                ]}
                icon={createCustomIcon(marker.properties.color)}
              >
                <Popup className="p-0 m-0">
                  <div className="flex flex-col w-96 py-2 pr-3 gap-2">
                    <div className="flex justify-between items-center border-b-2 pb-2">
                      <span className="font-bold text-xl">
                        {marker.properties.shopName}
                      </span>
                      <span className="font-bold text-base">
                        {marker.properties.company}
                      </span>
                    </div>
                    {marker.properties.address ? (
                      <div className="flex justify-between">
                        <span>Address:</span>
                        <span>{marker.properties.address}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span>Address:</span>
                        <span>None</span>
                      </div>
                    )}
                    {marker.properties.postcode ? (
                      <div className="flex justify-between">
                        <span>Postcode:</span>
                        <span>{marker.properties.postcode}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span>Postcode:</span>
                        <span>None</span>
                      </div>
                    )}
                    {marker.properties.cuisines ? (
                      <div className="flex justify-between">
                        <span>Cuisines:</span>
                        <span>{marker.properties.cuisines}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span>Cuisines:</span>
                        <span>None</span>
                      </div>
                    )}
                    {marker.properties.website ? (
                      <div className="flex justify-between">
                        <span>Website:</span>
                        <a
                          href={marker.properties.website}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Click to visit shop website
                        </a>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span>Website:</span>
                        <span>None</span>
                      </div>
                    )}
                    {marker.properties.menu ? (
                      <div className="flex justify-between">
                        <span>Menu:</span>
                        <a
                          href={marker.properties.menu}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Click to visit shop menu
                        </a>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span>Menu:</span>
                        <span>None</span>
                      </div>
                    )}
                    {marker.properties.googlemap ? (
                      <div className="flex justify-between">
                        <span>Google map:</span>
                        <a
                          href={marker.properties.googlemap}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Click to visit google map
                        </a>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span>Google map:</span>
                        <span>None</span>
                      </div>
                    )}
                    {marker.properties.app ? (
                      <div className="flex justify-between">
                        <span>Mobile app:</span>
                        <a
                          href={marker.properties.app}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Click to download mobile app
                        </a>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span>Mobile app:</span>
                        <span>None</span>
                      </div>
                    )}
                    {marker.properties.rating ? (
                      <div className="flex justify-between">
                        <span>Rating:</span>
                        <span>{marker.properties.rating}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span>Rating:</span>
                        <span>None</span>
                      </div>
                    )}
                    {marker.properties.totalReviews ? (
                      <div className="flex justify-between">
                        <span>Reviews:</span>
                        <span>{marker.properties.totalReviews}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span>Reviews:</span>
                        <span>None</span>
                      </div>
                    )}
                    {marker.properties.phone ? (
                      <div className="flex justify-between">
                        <span>Phone:</span>
                        <span>{marker.properties.phone}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span>Phone:</span>
                        <span>None</span>
                      </div>
                    )}
                    <div className="flex flex-col justify-between gap-1">
                      <span>Description:</span>
                      {marker.properties.description}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
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
