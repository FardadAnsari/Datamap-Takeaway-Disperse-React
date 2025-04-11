import { useEffect, useState } from "react";
import instance from "../api/api";
import PieChartSection from "../component/GoogleBusiness/PieChartSection";
import KeywordsAnalytics from "../component/GoogleBusiness/KeywordsAnalytics";
import TotalInteractions from "../component/GoogleBusiness/TotalInteractions";
import { HiOutlineEnvelope } from "react-icons/hi2";
import { IoInformationCircleSharp } from "react-icons/io5";
import { PiPhone } from "react-icons/pi";
import BusinessHoursDisplay from "../component/GoogleBusiness/BusinessHoursDisplay";
import { useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import GoogleBusinessModal from "../component/GoogleBusiness/GoogleBusinessModal";
import { useUser } from "../api/userPermission";
import { LuPencil, LuPencilLine } from "react-icons/lu";

const GBDashboardByMap = () => {
  const { locationId } = useParams();

  const [editOpen, setEditOpen] = useState(null);
  const [shopTitle, setShopTitle] = useState("");

  const handleEditOpen = (id) => {
    if (editOpen === id) {
      setEditOpen(null);
    } else {
      setEditOpen(id);
    }
  };

  const [verifications, setVerifications] = useState([]);
  const [isVerified, setIsVerified] = useState(true);

  useEffect(() => {
    const fetchVerificationData = async () => {
      try {
        const response = await instance.get(
          `api/v1/google/verifications/${locationId}`
        );
        console.log(response);

        // Handle empty response.data or missing verifications property
        if (response.data && response.data.verifications) {
          setVerifications(response.data.verifications);
        } else {
          setVerifications([]); // Set verifications to an empty array if data is invalid
        }

        // Update isVerified based on response.data
        if (response.data && Object.keys(response.data).length > 0) {
          setIsVerified(true);
        } else {
          setIsVerified(false);
        }
      } catch (error) {
        console.error(error);
        setVerifications([]); // Set verifications to an empty array on error
        setIsVerified(false); // Set isVerified to false on error
      }
    };
    fetchVerificationData();
  }, [locationId]);

  // Move this logic into a useEffect
  useEffect(() => {
    if (verifications.length > 0 && verifications[0]?.state === "COMPLETED") {
      setIsVerified(true);
    } else {
      setIsVerified(false);
    }
  }, [verifications]); // Only run this effect when `verifications` changes

  const [activeIndexSearch, setActiveIndexSearch] = useState(0);
  const onPieEnterSearch = (_, index) => setActiveIndexSearch(index);

  const [activeIndexMap, setActiveIndexMap] = useState(0);
  const onPieEnterMap = (_, index) => setActiveIndexMap(index);

  const [shopActivityStatus, setShopActivityStatus] = useState("");
  const { user } = useUser();

  const accessToken = sessionStorage.getItem("accessToken");
  useEffect(() => {
    instance
      .get(`/api/v1/google/get-title/${locationId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        // console.log(response.data.location.title);

        setShopTitle(response.data.location.title);
        // console.log(shopTitle);
      })
      .catch();
  }, [locationId]);

  useEffect(() => {
    instance
      .get(`api/v1/google/get-update-openstatus/${locationId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        setShopActivityStatus(response.data.location.openInfo.status);
      })
      .catch();
  }, [locationId]);

  const [shopPhone, setShopPhone] = useState();
  const [shopAddress, setShopAddress] = useState();
  const [weburl, setWeburl] = useState();

  useEffect(() => {
    instance
      .get(`api/v1/google/get-shop-attribute/${locationId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        setShopPhone(response.data.location.phoneNumbers);
        setShopAddress(response.data.location.storefrontAddress);
        setWeburl(response.data.location.websiteUri);
      });
  }, [locationId]);

  const [isLoadingSearchCount, setIsLoadingSearchCount] = useState(false);
  const [notAllowedSearchCount, setNotAllowedSearchCount] = useState(false);
  const [searchCount, setSearchCount] = useState({});

  useEffect(() => {
    const fetchSearchData = async () => {
      setIsLoadingSearchCount(false);

      try {
        const response = await instance.get(
          `api/v1/google/metric/mob-desk-search-count/${locationId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        setSearchCount(response.data);
      } catch (error) {
        console.error(error);
        error?.status === 403 && setNotAllowedSearchCount(true);
      } finally {
        setIsLoadingSearchCount(true);
      }
    };
    fetchSearchData();
  }, []);

  const [isLoadingMapCount, setIsLoadingMapCount] = useState(false);
  const [notAllowedMapCount, setNotAllowedMapCount] = useState(false);
  const [mapCount, setMapCount] = useState({});

  useEffect(() => {
    const fetchMapData = async () => {
      setIsLoadingMapCount(false);

      try {
        const response = await instance.get(
          `/api/v1/google/metric/mob-desk-map-count/${locationId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        setMapCount(response.data);
      } catch (error) {
        console.error(error);
        error?.status === 403 && setNotAllowedMapCount(true);
      } finally {
        setIsLoadingMapCount(true);
      }
    };
    fetchMapData();
  }, []);

  const googleSearchData = [
    { name: "Desktop", value: searchCount.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH },
    { name: "Mobile", value: searchCount.BUSINESS_IMPRESSIONS_MOBILE_SEARCH },
  ];

  const googleMapData = [
    { name: "Desktop", value: mapCount.BUSINESS_IMPRESSIONS_DESKTOP_MAPS },
    { name: "Mobile", value: mapCount.BUSINESS_IMPRESSIONS_MOBILE_MAPS },
  ];

  const [isLoadingWebCallCount, setIsLoadingWebCallCount] = useState(false);
  const [notAllowedWebCallCount, setNotAllowedWebCallCount] = useState(false);
  const [webCallCount, setWebCallCount] = useState({});

  useEffect(() => {
    const fetchWebCallData = async () => {
      setIsLoadingWebCallCount(false);

      try {
        const response = await instance.get(
          `/api/v1/google/metric/web-call-count/${locationId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        setWebCallCount(response?.data);
      } catch (error) {
        console.error(error);
        error?.status === 403 && setNotAllowedWebCallCount(true);
      } finally {
        setIsLoadingWebCallCount(true);
      }
    };
    fetchWebCallData();
  }, [locationId]);

  return (
    <div
      className={`max-w-screen flex flex-col h-full bg-white font-sans bg-yellow-50`}
    >
      <div className="flex justify-between px-12 py-6 mb-6 border-solid bg-white shadow">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-cover bg-center bg-google-business"></div>
          <p className="text-xl md:text-2xl lg:text-3xl font-medium m-0">
            Google Business Dashboard
          </p>
        </div>
      </div>
      <div className="flex flex-col md:gap-6 lg:gap-8 mx-4 lg:mx-6 md:grid md:grid-cols-6 md:grid-rows-27 lg:grid lg:grid-cols-6  pb-6">
        <div className="md:col-span-3 md:row-span-6 md:row-start-2 md:col-start-1 lg:col-span-2 lg:row-span-3 lg:col-start-5 rounded-lg bg-white shadow-md">
          <div className="flex flex-col px-4 pt-4">
            <div className="h-10 flex gap-2 justify-between items-center pb-4">
              <p className="text-xl font-medium">Google Business Details</p>
              <div className="flex gap-2">
                {isVerified ? (
                  <div className="px-2 py-1 bg-green-100 rounded-lg">
                    <p className="text-green-800">Verified</p>
                  </div>
                ) : null}
                {user?.access?.gbDashboardEdit && (
                  <button
                    onClick={() => handleEditOpen(4)}
                    className={`flex justify-between items-center py-2 px-2 text-lg text-orange-500 text-left transition ease-in delay-190 bg-orange-100 rounded-lg`}
                  >
                    {editOpen === 4 ? <LuPencilLine /> : <LuPencil />}
                  </button>
                )}
              </div>
            </div>
            {user?.access?.gbDashboardEdit && (
              <div className="flex items-center gap-2 border-2 border-orange-300 p-2 rounded-lg">
                <IoInformationCircleSharp color="orange" size={26} />
                <p className="text-base">
                  Edits will appear after at least 10 minutes or more.
                </p>
              </div>
            )}
            {editOpen === 4 && (
              <GoogleBusinessModal
                isOpen={true}
                onClose={() => setEditOpen(null)}
                locationId={locationId}
                shopTitle={shopTitle}
                webUrl={weburl}
                phoneNumber={shopPhone.primaryPhone}
                shopAddress={shopAddress}
              />
            )}

            <div className="bodrer-t-2">
              <p className="text-lg py-2">Shop Information</p>
              <div className="flex justify-between items-center py-2">
                <div className="flex">
                  <p className="text-base text-gray-500">Shop Name</p>
                </div>

                <p>{shopTitle}</p>
              </div>
              <div className="flex justify-between items-center py-2">
                <div className="flex">
                  <p className="text-base text-gray-500">Phone Number</p>
                </div>

                <p>{shopPhone?.primaryPhone}</p>
              </div>
              <div className="flex justify-between items-center py-2">
                <div className="flex">
                  <p className="text-base text-gray-500">Website</p>
                </div>

                <p>{weburl}</p>
              </div>
              <div className="flex justify-between gap-12 items-start py-2">
                <div className="flex">
                  <p className="text-base text-gray-500">Address</p>
                </div>
                <p>{`${shopAddress?.addressLines || ""} ${shopAddress?.locality || ""} ${shopAddress?.postalCode || ""}`}</p>
              </div>
            </div>
            <div className="border-t-2">
              <div className="flex justify-between items-center py-2">
                <span className="text-lg">Opening Hours</span>
                <div className="flex gap-2 items-center">
                  {shopActivityStatus === "OPEN" ? (
                    <p className="text-green-500">Open</p>
                  ) : shopActivityStatus === "CLOSE" ? (
                    <p className="text-red-500">Close</p>
                  ) : shopActivityStatus === "CLOSED_PERMANENTLY" ? (
                    <p className="text-red-500">Closed Permanently</p>
                  ) : (
                    <p></p>
                  )}
                </div>
              </div>
              <BusinessHoursDisplay locationId={locationId} />
            </div>
          </div>
        </div>
        <div className="p-4 flex flex-col gap-3 md:col-span-3 md:col-start-1 md:row-span-6 md:row-start-8 lg:row-span-1 lg:col-span-4 lg:row-start-1 rounded-lg bg-white shadow-md">
          <p className="text-xl">{shopTitle}</p>
          <div className="flex gap-6">
            <div className="flex gap-2">
              <div className="flex gap-1 items-center">
                <PiPhone size={22} color="gray" />
                <p className="text-base text-gray-500">Phone No.</p>
              </div>
              <p>{shopPhone?.primaryPhone}</p>
            </div>
            <span className="text-gray-500">|</span>
            <div className="flex gap-2">
              <div className="flex gap-1 items-center">
                <HiOutlineEnvelope size={22} color="gray" />
                <p className="text-base text-gray-500">Postcode</p>
              </div>
              <p>{shopAddress?.postalCode}</p>
            </div>
          </div>
        </div>
        <div className="p-4 flex flex-col md:col-span-3 md:col-start-1 md:row-span-6 md:row-start-8 lg:row-span-2 lg:col-span-2 lg:row-start-2 rounded-lg bg-white shadow-md">
          {!notAllowedSearchCount ? (
            <>
              <p className="text-xl font-medium">By searching on Google</p>
              <PieChartSection
                activeIndex={activeIndexSearch}
                data={googleSearchData}
                onPieEnter={onPieEnterSearch}
              />
            </>
          ) : (
            <div className="h-full flex flex-col justify-center items-center">
              <div className="w-44 h-44 bg-cover bg-center bg-no-access"></div>
              <p>You don’t access for this section</p>
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col md:col-span-3 md:row-span-6 md:row-start-8 md:col-start-4 lg:row-span-2 lg:col-span-2 lg:col-start-3 lg:row-start-2 md:row-start-8 rounded-lg bg-white shadow-md">
          {!notAllowedMapCount ? (
            <>
              <p className="text-xl font-medium">By using Google map service</p>
              <PieChartSection
                activeIndex={activeIndexMap}
                data={googleMapData}
                onPieEnter={onPieEnterMap}
              />
            </>
          ) : (
            <div className="h-full flex flex-col justify-center items-center">
              <div className="w-44 h-44 bg-cover bg-center bg-no-access"></div>
              <p>You don’t access for this section</p>
            </div>
          )}
        </div>
        <div className="md:row-start-14 md:row-span-6 md:col-span-6 lg:col-span-4 lg:row-span-2 lg:row-start-4 rounded-lg bg-white shadow-md">
          <KeywordsAnalytics locationId={locationId} />
        </div>
        <div className="md:row-start-2 md:col-span-3 md:row-span-6 md:col-start-4 lg:row-start-4 lg:col-span-2 lg:row-span-1 lg:col-start-5 rounded-lg p-2 bg-white shadow-md">
          {!notAllowedWebCallCount ? (
            <TotalInteractions webCallCount={webCallCount} />
          ) : (
            <div className="flex flex-col justify-center items-center py-4">
              <div className="w-44 h-44 bg-cover bg-center bg-no-access"></div>
              <p>You don’t access for this section</p>
            </div>
          )}
        </div>
      </div>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default GBDashboardByMap;
