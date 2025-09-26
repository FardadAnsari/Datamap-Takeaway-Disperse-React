import { useEffect, useState } from "react";
import instance from "../api/api";
import PieChartSection from "../general-components/PieChartSection";
import KeywordsAnalytics from "../component/GoogleBusiness/KeywordsAnalytics";
import TotalInteractions from "../component/GoogleBusiness/TotalInteractions";
import { IoInformationCircleSharp } from "react-icons/io5";
import BusinessHoursDisplay from "../component/GoogleBusiness/BusinessHoursDisplay";
import { useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import GoogleBusinessModal from "../component/GoogleBusiness/GoogleBusinessModal";
import { useUser } from "../api/userPermission";
import { LuPencil, LuPencilLine } from "react-icons/lu";
import { MdOutlinePermMedia, MdPermMedia, MdVerified } from "react-icons/md";
import GoogleBusinessUploadModal from "../component/GoogleBusiness/GoogleBusinessUploadModal";
import EmptyState from "../general-components/EmptyState";
import { ThreeDots } from "react-loader-spinner";

// --- Loader (same look/feel as in GBDashboard) ---
const Loader = ({ className = "", size = 50 }) => (
  <div className={`grid place-items-center ${className}`}>
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

const GBDashboardByMap = () => {
  const selectedAcc = { value: "accounts/103526686887949354169" };
  const { locationId } = useParams();

  const [editOpen, setEditOpen] = useState(null);
  const [shopTitle, setShopTitle] = useState("");
  const handleEditOpen = (id) =>
    setEditOpen((prev) => (prev === id ? null : id));

  const [verifications, setVerifications] = useState([]);
  const [isVerified, setIsVerified] = useState(true);

  const [shopActivityStatus, setShopActivityStatus] = useState("");
  const { user } = useUser();

  const accessToken = sessionStorage.getItem("accessToken");

  // --- NEW: Detail loaders (Shop info + Hours + badge) ---
  const [isLoadingTitle, setIsLoadingTitle] = useState(false);
  const [isLoadingOpenStatus, setIsLoadingOpenStatus] = useState(false);
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);
  const [isLoadingVerification, setIsLoadingVerification] = useState(false);
  const isLoadingShopDetails =
    isLoadingTitle || isLoadingOpenStatus || isLoadingAttributes;

  // --- Verifications (with Authorization header) ---
  useEffect(() => {
    if (!locationId) return;
    (async () => {
      setIsLoadingVerification(true);
      try {
        const response = await instance.get(
          `api/v1/google/verifications/${locationId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (response.data && response.data.verifications) {
          setVerifications(response.data.verifications);
        } else {
          setVerifications([]);
        }
        setIsVerified(
          !!(response.data && Object.keys(response.data).length > 0)
        );
      } catch (error) {
        console.error(error);
        setVerifications([]);
        setIsVerified(false);
      } finally {
        setIsLoadingVerification(false);
      }
    })();
  }, [locationId, accessToken]);

  useEffect(() => {
    setIsVerified(
      verifications.length > 0 && verifications[0]?.state === "COMPLETED"
    );
  }, [verifications]);

  // --- Title ---
  useEffect(() => {
    if (!locationId) return;
    setIsLoadingTitle(true);
    instance
      .get(`/api/v1/google/get-title/${locationId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((response) => setShopTitle(response?.data?.location?.title || ""))
      .catch((e) => {
        console.error(e);
        setShopTitle("");
      })
      .finally(() => setIsLoadingTitle(false));
  }, [locationId, accessToken]);

  // --- Open status ---
  useEffect(() => {
    if (!locationId) return;
    setIsLoadingOpenStatus(true);
    instance
      .get(`api/v1/google/get-update-openstatus/${locationId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((response) =>
        setShopActivityStatus(response?.data?.location?.openInfo?.status || "")
      )
      .catch((e) => {
        console.error(e);
        setShopActivityStatus("");
      })
      .finally(() => setIsLoadingOpenStatus(false));
  }, [locationId, accessToken]);

  const [shopPhone, setShopPhone] = useState();
  const [shopAddress, setShopAddress] = useState();
  const [weburl, setWeburl] = useState();

  // --- Attributes ---
  useEffect(() => {
    if (!locationId) return;
    setIsLoadingAttributes(true);
    instance
      .get(`api/v1/google/get-shop-attribute/${locationId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((response) => {
        setShopPhone(response?.data?.location?.phoneNumbers);
        setShopAddress(response?.data?.location?.storefrontAddress);
        setWeburl(response?.data?.location?.websiteUri);
      })
      .catch((e) => {
        console.error(e);
        setShopPhone(undefined);
        setShopAddress(undefined);
        setWeburl(undefined);
      })
      .finally(() => setIsLoadingAttributes(false));
  }, [locationId, accessToken]);

  // --- Search count ---
  const [isLoadingSearchCount, setIsLoadingSearchCount] = useState(false);
  const [notAllowedSearchCount, setNotAllowedSearchCount] = useState(false);
  const [searchCount, setSearchCount] = useState({});
  useEffect(() => {
    if (!locationId) return;
    const controller = new AbortController();
    (async () => {
      try {
        setIsLoadingSearchCount(true);
        const response = await instance.get(
          `api/v1/google/metric/mob-desk-search-count/${locationId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
          }
        );
        setSearchCount(response.data || {});
        setNotAllowedSearchCount(false);
      } catch (error) {
        if (error.name !== "CanceledError" && error.name !== "AbortError") {
          console.error(error);
          const status = error?.response?.status || error?.status;
          setNotAllowedSearchCount(status === 403);
          setSearchCount({});
        }
      } finally {
        setIsLoadingSearchCount(false);
      }
    })();
    return () => controller.abort();
  }, [locationId, accessToken]);

  // --- Map count ---
  const [isLoadingMapCount, setIsLoadingMapCount] = useState(false);
  const [notAllowedMapCount, setNotAllowedMapCount] = useState(false);
  const [mapCount, setMapCount] = useState({});
  useEffect(() => {
    if (!locationId) return;
    const controller = new AbortController();
    (async () => {
      try {
        setIsLoadingMapCount(true);
        const response = await instance.get(
          `/api/v1/google/metric/mob-desk-map-count/${locationId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
          }
        );
        setMapCount(response.data || {});
        setNotAllowedMapCount(false);
      } catch (error) {
        if (error.name !== "CanceledError" && error.name !== "AbortError") {
          console.error(error);
          const status = error?.response?.status || error?.status;
          setNotAllowedMapCount(status === 403);
          setMapCount({});
        }
      } finally {
        setIsLoadingMapCount(false);
      }
    })();
    return () => controller.abort();
  }, [locationId, accessToken]);

  // --- Web/Call count ---
  const [isLoadingWebCallCount, setIsLoadingWebCallCount] = useState(false);
  const [notAllowedWebCallCount, setNotAllowedWebCallCount] = useState(false);
  const [webCallCount, setWebCallCount] = useState({});
  useEffect(() => {
    if (!locationId) return;
    const controller = new AbortController();
    (async () => {
      try {
        setIsLoadingWebCallCount(true);
        const response = await instance.get(
          `/api/v1/google/metric/web-call-count/${locationId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
          }
        );
        setWebCallCount(response?.data || {});
        setNotAllowedWebCallCount(false);
      } catch (error) {
        if (error.name !== "CanceledError" && error.name !== "AbortError") {
          console.error(error);
          const status = error?.response?.status || error?.status;
          setNotAllowedWebCallCount(status === 403);
          setWebCallCount({});
        }
      } finally {
        setIsLoadingWebCallCount(false);
      }
    })();
    return () => controller.abort();
  }, [locationId, accessToken]);

  const googleSearchData = [
    { name: "Desktop", value: searchCount.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH },
    { name: "Mobile", value: searchCount.BUSINESS_IMPRESSIONS_MOBILE_SEARCH },
  ];
  const googleMapData = [
    { name: "Desktop", value: mapCount.BUSINESS_IMPRESSIONS_DESKTOP_MAPS },
    { name: "Mobile", value: mapCount.BUSINESS_IMPRESSIONS_MOBILE_MAPS },
  ];

  // Helper for address lines that might be array
  const addressLines = Array.isArray(shopAddress?.addressLines)
    ? shopAddress.addressLines.join(", ")
    : shopAddress?.addressLines || "";

  return (
    <div className="max-w-screen flex flex-col h-full bg-white font-sans bg-stone-50">
      <div className="flex justify-between px-12 py-6 mb-6 border-solid bg-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-cover bg-center bg-google-business"></div>
          <p className="text-xl md:text-xl lg:text-2xl font-medium m-0">
            Google Business Dashboard
          </p>
        </div>
      </div>

      <div className="flex gap-6 mx-4 pb-6">
        <div className="w-2/5 flex flex-col gap-6">
          {/* Google Business Details */}
          <div className="flex flex-col rounded-lg bg-white shadow-lg border p-4">
            <div className="flex gap-2 justify-between items-center">
              <p className="text-xl font-medium">Google Business Details</p>
              <div className="flex gap-2">
                {isLoadingVerification ? (
                  <Loader size={28} />
                ) : isVerified ? (
                  <div className="px-2 py-1 rounded-lg">
                    <MdVerified color="orange" size={25} />
                  </div>
                ) : null}
                {user?.access?.gbDashboardEdit && isVerified && (
                  <button
                    onClick={() => handleEditOpen(1)}
                    className={`flex justify-between items-center py-2 px-2 text-lg text-orange-500 text-left transition ease-in delay-190 bg-orange-100 rounded-lg`}
                  >
                    {editOpen === 1 ? <LuPencilLine /> : <LuPencil />}
                  </button>
                )}
                {user?.access?.gbIsPhotoChange && isVerified && (
                  <button
                    onClick={() => handleEditOpen(2)}
                    className={`flex justify-between items-center py-2 px-2 text-lg text-orange-500 text-left transition ease-in delay-190 bg-orange-100 rounded-lg`}
                  >
                    {editOpen === 2 ? (
                      <MdPermMedia size={20} />
                    ) : (
                      <MdOutlinePermMedia size={20} />
                    )}
                  </button>
                )}
              </div>
            </div>

            {editOpen === 1 && (
              <GoogleBusinessModal
                isOpen={true}
                onClose={() => setEditOpen(null)}
                locationId={locationId}
                shopTitle={shopTitle}
                webUrl={weburl}
                phoneNumber={shopPhone?.primaryPhone}
                shopAddress={shopAddress}
              />
            )}

            {editOpen === 2 && (
              <GoogleBusinessUploadModal
                isOpen={true}
                onClose={() => setEditOpen(null)}
                locationId={locationId}
                selectedAcc={selectedAcc}
              />
            )}

            {user?.access?.gbDashboardEdit && (
              <div className="flex items-center gap-2 border-2 border-orange-300 p-2 rounded-lg mt-3">
                <IoInformationCircleSharp color="orange" size={26} />
                <p className="text-md">
                  Edits will appear after at least 10 minutes or more.
                </p>
              </div>
            )}

            {/* Shop Information + Opening Hours gated by loader */}
            {isLoadingShopDetails ? (
              <Loader className="py-56" />
            ) : (
              <>
                <p className="text-lg font-medium pt-2">Shop Information</p>
                <div className="flex justify-between items-center p-2">
                  <div className="flex">
                    <p className="text-md text-gray-500">Shop Name</p>
                  </div>
                  <p className="font-medium">{shopTitle}</p>
                </div>
                <div className="flex justify-between items-center p-2">
                  <div className="flex">
                    <p className="text-md text-gray-500">Phone Number</p>
                  </div>
                  <p className="font-medium">{shopPhone?.primaryPhone}</p>
                </div>
                <div className="flex justify-between items-center p-2">
                  <div className="flex">
                    <p className="text-md text-gray-500">Website</p>
                  </div>
                  <a
                    href={weburl}
                    target="_blank"
                    className="text-blue-400 font-base underline decoration-solid"
                  >
                    {weburl}
                  </a>
                </div>
                <div className="flex justify-between gap-12 items-start p-2">
                  <div className="flex">
                    <p className="text-md text-gray-500">Address</p>
                  </div>
                  <p className="font-medium">{`${addressLines || ""} ${shopAddress?.locality || ""} ${shopAddress?.postalCode || ""}`}</p>
                </div>

                <hr />
                <div>
                  <div className="pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium">Opening Hours</span>
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
              </>
            )}
          </div>

          {/* TotalInteractions */}
          <div className="rounded-lg bg-white shadow-lg border">
            {!notAllowedWebCallCount ? (
              isLoadingWebCallCount ? (
                <Loader className="py-16" />
              ) : (
                <TotalInteractions webCallCount={webCallCount} />
              )
            ) : (
              <EmptyState
                state="bg-no-access"
                message="You don’t have access to this section."
                className="py-6"
              />
            )}
          </div>
        </div>

        <div className="w-3/5 flex flex-col gap-6">
          <div className="w-full flex gap-6">
            {/* By searching on Google */}
            <div className="w-full flex flex-col rounded-lg bg-white shadow-lg border h-[480px]">
              {!notAllowedSearchCount ? (
                isLoadingSearchCount ? (
                  <Loader className="h-full" />
                ) : (
                  <>
                    <p className="text-xl font-medium p-4">
                      By searching on Google
                    </p>
                    <PieChartSection
                      data={googleSearchData}
                      variant="center"
                      innerRadius={100}
                      outerRadius={130}
                      groupUnderPercent={0}
                      showLegend={true}
                      centerLabelLines={({ name, value, percent }) => [
                        name,
                        `${value} user`,
                        `${(percent * 100).toFixed(2)}%`,
                      ]}
                    />
                  </>
                )
              ) : (
                <EmptyState
                  state="bg-no-access"
                  message="You don’t have access to this section."
                  className="h-full"
                />
              )}
            </div>

            {/* By using Google map service */}
            <div className="w-full h-full flex flex-col rounded-lg bg-white shadow-lg border h-[480px]">
              {!notAllowedMapCount ? (
                isLoadingMapCount ? (
                  <Loader className="h-full" />
                ) : (
                  <>
                    <p className="text-xl font-medium p-4">
                      By using Google map service
                    </p>
                    <PieChartSection
                      data={googleMapData}
                      variant="center"
                      innerRadius={100}
                      outerRadius={130}
                      groupUnderPercent={0}
                      showLegend={true}
                      centerLabelLines={({ name, value, percent }) => [
                        name,
                        `${value} user`,
                        `${(percent * 100).toFixed(2)}%`,
                      ]}
                    />
                  </>
                )
              ) : (
                <EmptyState
                  state="bg-no-access"
                  message="You don’t have access to this section."
                  className="h-full"
                />
              )}
            </div>
          </div>

          {/* Keywords Analytics */}
          <div className="rounded-lg bg-white shadow-lg border">
            <KeywordsAnalytics locationId={locationId} />
          </div>
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
