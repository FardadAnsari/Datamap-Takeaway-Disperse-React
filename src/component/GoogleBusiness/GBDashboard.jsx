import { useEffect, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import AutoCompletionCustomStyles from "../AutoCompletionCustomStyles";
import instance from "../../api/api";
import { LuPencil, LuPencilLine } from "react-icons/lu";
import PieChartSection from "../../general-components/PieChartSection";
import KeywordsAnalytics from "./KeywordsAnalytics";
import TotalInteractions from "./TotalInteractions";
import BusinessHoursDisplay from "./BusinessHoursDisplay";
import GoogleBusinessModal from "./GoogleBusinessModal";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { useUser } from "../../api/userPermission";
import { IoInformationCircleSharp } from "react-icons/io5";
import { MdOutlinePermMedia, MdPermMedia, MdVerified } from "react-icons/md";
import GoogleBusinessUploadModal from "./GoogleBusinessUploadModal";
import EmptyState from "../../general-components/EmptyState";
import { ThreeDots } from "react-loader-spinner";
import { IoIosStar, IoMdContacts } from "react-icons/io";
import { createPortal } from "react-dom";
import GBAdmins from "./GBAdmins";

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

// --- error helpers ---
const isAbort = (e) => e?.name === "CanceledError" || e?.name === "AbortError";
const getErrorKind = (e) => {
  if (isAbort(e)) return { kind: "aborted", status: null };
  const status = e?.response?.status;
  if (!status) return { kind: "network", status: null };
  if (status === 401) return { kind: "unauthorized", status };
  if (status === 403) return { kind: "forbidden", status };
  if (status === 404 || status === 204) return { kind: "no_data", status };
  if (status === 429) return { kind: "rate_limited", status };
  if (status >= 500) return { kind: "server", status };
  return { kind: "unknown", status };
};

// Generic gate that decides what to render for a section
const SectionGate = ({
  selected, // has business/location been selected?
  loading, // is section loading?
  notAllowed, // 403
  networkErr, // network/transport fail (no response)
  noData, // 204/404/5xx treated as no data
  stateClass, // EmptyState bg class for this section
  noSelectionMsg,
  noAccessMsg = "You don’t have access to this section.",
  networkMsg = "Network error. Please check your connection and try again.",
  noDataMsg = "No data has been received from Google.",
  loaderClass = "py-16",
  emptyClass = "py-6", // <<— NEW: controls EmptyState padding/height per section
  children,
}) => {
  if (!selected) {
    return (
      <EmptyState
        state={stateClass}
        message={noSelectionMsg}
        className={emptyClass}
      />
    );
  }
  if (loading) return <Loader className={loaderClass} />;
  if (notAllowed) {
    return (
      <EmptyState
        state="bg-no-access"
        message={noAccessMsg}
        className={emptyClass}
      />
    );
  }
  if (networkErr) {
    return (
      <EmptyState
        state={stateClass}
        message={networkMsg}
        className={emptyClass}
      />
    );
  }
  if (noData) {
    return (
      <EmptyState
        state={stateClass}
        message={noDataMsg}
        className={emptyClass}
      />
    );
  }
  return children;
};

const GBDashboard = ({ isOpen }) => {
  const { user } = useUser();

  const {
    setValue: setValueFilter,
    control: controlFilter,
    watch: watchFilter,
  } = useForm();

  const navigate = useNavigate();

  const [businessInfo, setBusinessInfo] = useState([]);
  const [isLoadingBusinessInfo, setIsLoadingBusinessInfo] = useState(false);
  const [locationId, setLocationId] = useState(null);

  const [editOpen, setEditOpen] = useState(null);
  const [shopTitle, setShopTitle] = useState("");
  const [shopActivityStatus, setShopActivityStatus] = useState("");

  const selectedAcc = watchFilter("account");
  const selectedBusInfo = watchFilter("businessInformation");

  const [accountList, setAccountList] = useState([]);
  const accessToken = sessionStorage.getItem("accessToken");

  // Section loader flags (Interactions + Pie charts)
  const [isLoadingSearchCount, setIsLoadingSearchCount] = useState(false);
  const [isLoadingMapCount, setIsLoadingMapCount] = useState(false);
  const [isLoadingWebCallCount, setIsLoadingWebCallCount] = useState(false);

  // Detail loaders (Shop info + Hours)
  const [isLoadingTitle, setIsLoadingTitle] = useState(false);
  const [isLoadingOpenStatus, setIsLoadingOpenStatus] = useState(false);
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [isLoadingVerification, setIsLoadingVerification] = useState(false);
  const isLoadingShopDetails =
    isLoadingTitle ||
    isLoadingOpenStatus ||
    isLoadingAttributes ||
    isLoadingReview;

  // Table loading derived from section loaders (parent-level gate)
  const isLoadingTable =
    isLoadingSearchCount || isLoadingMapCount || isLoadingWebCallCount;

  const [shopPhone, setShopPhone] = useState();
  const [shopAddress, setShopAddress] = useState();
  const [weburl, setWeburl] = useState();

  const [review, setReview] = useState(null);
  const [rate, setRate] = useState(null);

  const [verifications, setVerifications] = useState([]);
  const [isVerified, setIsVerified] = useState(false);

  const [showAdmins, setShowAdmins] = useState(false);

  // ----- Error flags (charts) -----
  const [noDataSearchCount, setNoDataSearchCount] = useState(false);
  const [notAllowedSearchCount, setNotAllowedSearchCount] = useState(false);
  const [networkErrSearchCount, setNetworkErrSearchCount] = useState(false);
  const [searchCount, setSearchCount] = useState({});

  const [noDataMapCount, setNoDataMapCount] = useState(false);
  const [notAllowedMapCount, setNotAllowedMapCount] = useState(false);
  const [networkErrMapCount, setNetworkErrMapCount] = useState(false);
  const [mapCount, setMapCount] = useState({});

  const [noDataWebCallCount, setNoDataWebCallCount] = useState(false);
  const [notAllowedWebCallCount, setNotAllowedWebCallCount] = useState(false);
  const [networkErrWebCallCount, setNetworkErrWebCallCount] = useState(false);
  const [webCallCount, setWebCallCount] = useState({});

  // ----- Error flags (details) -----
  const [networkErrTitle, setNetworkErrTitle] = useState(false);
  const [networkErrOpenStatus, setNetworkErrOpenStatus] = useState(false);
  const [networkErrAttributes, setNetworkErrAttributes] = useState(false);

  useEffect(() => {
    instance
      .get("/api/v1/google/account/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        setAccountList(response.data.accounts || []);
      })
      .catch((error) => {
        console.error(error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Business info for selected account
  useEffect(() => {
    if (!selectedAcc) return;

    const controller = new AbortController();
    (async () => {
      try {
        setIsLoadingBusinessInfo(true);
        const accountId = selectedAcc.value?.split("/")[1];
        if (!accountId) return;

        const response = await instance.get(
          `api/v1/google/business-info/front/${accountId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
          }
        );
        setBusinessInfo(response.data || []);
      } catch (error) {
        if (!isAbort(error)) {
          console.error(error);
          const { kind } = getErrorKind(error);
          if (kind === "unauthorized") {
            toast.error(
              "Your tokens have been exhausted. Please contact the R&D department to resolve this issue."
            );
            setTimeout(() => {
              sessionStorage.removeItem("accessToken");
              navigate("/");
            }, 5000);
          }
        }
      } finally {
        setIsLoadingBusinessInfo(false);
      }
    })();

    return () => controller.abort();
  }, [selectedAcc, accessToken, navigate]);

  useEffect(() => {
    const id = selectedBusInfo?.value?.split("/")[1] || null;
    setLocationId(id);

    // Start loading for charts
    setIsLoadingSearchCount(true);
    setIsLoadingMapCount(true);
    setIsLoadingWebCallCount(true);

    // Reset chart errors and data
    setNoDataSearchCount(false);
    setNoDataMapCount(false);
    setNoDataWebCallCount(false);
    setNotAllowedSearchCount(false);
    setNotAllowedMapCount(false);
    setNotAllowedWebCallCount(false);
    setNetworkErrSearchCount(false);
    setNetworkErrMapCount(false);
    setNetworkErrWebCallCount(false);
    setSearchCount({});
    setMapCount({});
    setWebCallCount({});

    // Reset detail-level network errors
    setNetworkErrTitle(false);
    setNetworkErrOpenStatus(false);
    setNetworkErrAttributes(false);

    // Details loaders only if we actually have a new id
    if (id) {
      setIsLoadingTitle(true);
      setIsLoadingOpenStatus(true);
      setIsLoadingAttributes(true);
      setIsLoadingReview(true);
      setIsLoadingVerification(true);

      // Clear old details while new ones load
      setShopTitle("");
      setShopActivityStatus("");
      setShopPhone(undefined);
      setShopAddress(undefined);
      setWeburl(undefined);
      setRate(null);
      setReview(null);
      setVerifications([]);
      setIsVerified(false);
    }
  }, [selectedBusInfo]);

  // Title
  useEffect(() => {
    if (!selectedBusInfo || !locationId) return;
    const controller = new AbortController();
    setIsLoadingTitle(true);
    setNetworkErrTitle(false);
    instance
      .get(`/api/v1/google/get-title/${locationId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: controller.signal,
      })
      .then((response) => {
        if (controller.signal.aborted) return;
        setShopTitle(response?.data?.location?.title || "");
      })
      .catch((error) => {
        if (isAbort(error)) return;
        console.error(error);
        const { kind } = getErrorKind(error);
        if (kind === "network") setNetworkErrTitle(true);
        setShopTitle("");
      })
      .finally(() => setIsLoadingTitle(false));
    return () => controller.abort();
  }, [locationId, selectedBusInfo, accessToken]);

  // Open status
  useEffect(() => {
    if (!selectedBusInfo || !locationId) return;
    const controller = new AbortController();
    setIsLoadingOpenStatus(true);
    setNetworkErrOpenStatus(false);
    instance
      .get(`/api/v1/google/get-update-openstatus/${locationId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: controller.signal,
      })
      .then((response) => {
        if (controller.signal.aborted) return;
        setShopActivityStatus(response?.data?.location?.openInfo?.status || "");
      })
      .catch((error) => {
        if (isAbort(error)) return;
        console.error(error);
        const { kind } = getErrorKind(error);
        if (kind === "network") setNetworkErrOpenStatus(true);
        setShopActivityStatus("");
      })
      .finally(() => setIsLoadingOpenStatus(false));
    return () => controller.abort();
  }, [locationId, selectedBusInfo, accessToken]);

  // Verifications
  useEffect(() => {
    if (!selectedBusInfo || !locationId) return;
    const controller = new AbortController();
    setIsLoadingVerification(true);
    instance
      .get(`/api/v1/google/verifications/${locationId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: controller.signal,
      })
      .then((response) => {
        if (controller.signal.aborted) return;
        const v = response?.data?.verifications ?? [];
        setVerifications(v);
        setIsVerified(v[0]?.state === "COMPLETED");
      })
      .catch((error) => {
        if (isAbort(error)) return;
        console.error(error);
        const { kind } = getErrorKind(error);
        if (kind === "network") setVerifications([]);
        setIsVerified(false);
      })
      .finally(() => setIsLoadingVerification(false));
    return () => controller.abort();
  }, [locationId, selectedBusInfo, accessToken]);

  useEffect(() => {
    if (verifications.length > 0 && verifications[0]?.state === "COMPLETED") {
      setIsVerified(true);
    } else {
      setIsVerified(false);
    }
  }, [verifications]);

  useEffect(() => {
    setShowAdmins(false);
  }, [locationId]);

  // Attributes
  useEffect(() => {
    if (!selectedBusInfo || !locationId) return;
    const controller = new AbortController();
    setIsLoadingAttributes(true);
    setNetworkErrAttributes(false);
    instance
      .get(`/api/v1/google/get-shop-attribute/${locationId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: controller.signal,
      })
      .then((response) => {
        if (controller.signal.aborted) return;
        setShopPhone(response?.data?.location?.phoneNumbers);
        setShopAddress(response?.data?.location?.storefrontAddress);
        setWeburl(response?.data?.location?.websiteUri);
      })
      .catch((error) => {
        if (isAbort(error)) return;
        console.error(error);
        const { kind } = getErrorKind(error);
        if (kind === "network") setNetworkErrAttributes(true);
      })
      .finally(() => setIsLoadingAttributes(false));
    return () => controller.abort();
  }, [locationId, selectedBusInfo, accessToken]);

  // Review & Rate
  useEffect(() => {
    if (!selectedBusInfo || !locationId || !selectedAcc) return;
    const controller = new AbortController();
    const accountId = selectedAcc.value?.split("/")[1];
    setIsLoadingReview(true);
    instance
      .get(
        `/api/v1/google/accounts/reviews-summary/${accountId}/locations/${locationId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        }
      )
      .then((response) => {
        if (controller.signal.aborted) return;
        setRate(
          typeof response?.data?.averageRating === "number"
            ? response.data.averageRating
            : null
        );
        setReview(
          typeof response?.data?.totalReviewCount === "number"
            ? response.data.totalReviewCount
            : null
        );
      })
      .catch((error) => {
        if (isAbort(error)) return;
        console.error(error);
        const { kind } = getErrorKind(error);
        if (kind === "network") setRate(null);
        setReview(null);
      })
      .finally(() => setIsLoadingReview(false));
    return () => controller.abort();
  }, [locationId, selectedBusInfo, selectedAcc, accessToken]);

  // Search count
  useEffect(() => {
    if (!selectedBusInfo || !locationId) return;
    const controller = new AbortController();
    (async () => {
      try {
        setIsLoadingSearchCount(true);
        setNetworkErrSearchCount(false);
        const res = await instance.get(
          `api/v1/google/metric/mob-desk-search-count/${locationId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
          }
        );
        if (controller.signal.aborted) return;
        setSearchCount(res.data || {});
        setNoDataSearchCount(false);
        setNotAllowedSearchCount(false);
      } catch (error) {
        if (!isAbort(error)) {
          console.error(error);
          const { kind } = getErrorKind(error);
          setSearchCount({});
          if (kind === "forbidden") {
            setNotAllowedSearchCount(true);
            setNoDataSearchCount(false);
            setNetworkErrSearchCount(false);
          } else if (kind === "no_data" || kind === "server") {
            setNoDataSearchCount(true);
            setNotAllowedSearchCount(false);
            setNetworkErrSearchCount(false);
          } else if (kind === "network") {
            setNetworkErrSearchCount(true);
            setNoDataSearchCount(false);
            setNotAllowedSearchCount(false);
          }
        }
      } finally {
        setIsLoadingSearchCount(false);
      }
    })();
    return () => controller.abort();
  }, [locationId, selectedBusInfo, accessToken]);

  // Map count
  useEffect(() => {
    if (!selectedBusInfo || !locationId) return;
    const controller = new AbortController();
    (async () => {
      try {
        setIsLoadingMapCount(true);
        setNetworkErrMapCount(false);
        const res = await instance.get(
          `/api/v1/google/metric/mob-desk-map-count/${locationId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
          }
        );
        if (controller.signal.aborted) return;
        setMapCount(res.data || {});
        setNoDataMapCount(false);
        setNotAllowedMapCount(false);
      } catch (error) {
        if (!isAbort(error)) {
          console.error(error);
          const { kind } = getErrorKind(error);
          setMapCount({});
          if (kind === "forbidden") {
            setNotAllowedMapCount(true);
            setNoDataMapCount(false);
            setNetworkErrMapCount(false);
          } else if (kind === "no_data" || kind === "server") {
            setNoDataMapCount(true);
            setNotAllowedMapCount(false);
            setNetworkErrMapCount(false);
          } else if (kind === "network") {
            setNetworkErrMapCount(true);
            setNoDataMapCount(false);
            setNotAllowedMapCount(false);
          }
        }
      } finally {
        setIsLoadingMapCount(false);
      }
    })();
    return () => controller.abort();
  }, [locationId, selectedBusInfo, accessToken]);

  // Web/Call count
  useEffect(() => {
    if (!selectedBusInfo || !locationId) return;
    const controller = new AbortController();
    (async () => {
      try {
        setIsLoadingWebCallCount(true);
        setNetworkErrWebCallCount(false);
        const res = await instance.get(
          `/api/v1/google/metric/web-call-count/${locationId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
          }
        );
        if (controller.signal.aborted) return;
        setWebCallCount(res?.data || {});
        setNoDataWebCallCount(false);
        setNotAllowedWebCallCount(false);
      } catch (error) {
        if (!isAbort(error)) {
          console.error(error);
          const { kind } = getErrorKind(error);
          setWebCallCount({});
          if (kind === "forbidden") {
            setNotAllowedWebCallCount(true);
            setNoDataWebCallCount(false);
            setNetworkErrWebCallCount(false);
          } else if (kind === "no_data" || kind === "server") {
            setNoDataWebCallCount(true);
            setNotAllowedWebCallCount(false);
            setNetworkErrWebCallCount(false);
          } else if (kind === "network") {
            setNetworkErrWebCallCount(true);
            setNoDataWebCallCount(false);
            setNotAllowedWebCallCount(false);
          }
        }
      } finally {
        setIsLoadingWebCallCount(false);
      }
    })();
    return () => controller.abort();
  }, [locationId, selectedBusInfo, accessToken]);

  const accountOptions = useMemo(
    () =>
      accountList.map((account) => ({
        label: account.accountName,
        value: account.name,
      })),
    [accountList]
  );
  const businessInfoOptions = useMemo(
    () => businessInfo.map((info) => ({ value: info.name, label: info.title })),
    [businessInfo]
  );

  const googleSearchData = [
    {
      name: "Desktop",
      value: searchCount.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH,
    },
    { name: "Mobile", value: searchCount.BUSINESS_IMPRESSIONS_MOBILE_SEARCH },
  ];
  const googleMapData = [
    { name: "Desktop", value: mapCount.BUSINESS_IMPRESSIONS_DESKTOP_MAPS },
    { name: "Mobile", value: mapCount.BUSINESS_IMPRESSIONS_MOBILE_MAPS },
  ];

  const addressLines = Array.isArray(shopAddress?.addressLines)
    ? shopAddress.addressLines.join(", ")
    : shopAddress?.addressLines || "";

  const handleAccountChangeReset = (opt, fieldOnChange) => {
    fieldOnChange(opt);
    // Reset dependent state strictly on change
    setValueFilter("businessInformation", null);
    setLocationId(null);
    setBusinessInfo([]);
    setShopTitle("");
    setShopActivityStatus("");
    setShopPhone(undefined);
    setShopAddress(undefined);
    setWeburl(undefined);
    setRate(null);
    setReview(null);
    setVerifications([]);
    setIsVerified(false);
    // Clear section data/errors
    setSearchCount({});
    setMapCount({});
    setWebCallCount({});
    setNoDataSearchCount(false);
    setNoDataMapCount(false);
    setNoDataWebCallCount(false);
    setNotAllowedSearchCount(false);
    setNotAllowedMapCount(false);
    setNotAllowedWebCallCount(false);
    setNetworkErrSearchCount(false);
    setNetworkErrMapCount(false);
    setNetworkErrWebCallCount(false);
    // Show loaders while waiting for new BI selection
    setIsLoadingSearchCount(true);
    setIsLoadingMapCount(true);
    setIsLoadingWebCallCount(true);

    // Reset detail network flags
    setNetworkErrTitle(false);
    setNetworkErrOpenStatus(false);
    setNetworkErrAttributes(false);
  };

  // Aggregate: if any core detail API hit a network error, show details empty state
  const detailsNetworkErr =
    networkErrTitle || networkErrOpenStatus || networkErrAttributes;

  return (
    <div
      className={`max-w-screen w-[calc(100%-80px)] absolute top-0 left-20 flex flex-col h-full ${
        editOpen ? "overflow-y-hidden" : "overflow-y-auto"
      } bg-white z-40 transition-transform duration-700 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } font-sans bg-stone-50`}
    >
      <div className="flex justify-between px-12 py-6 mb-6 border-solid bg-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-cover bg-center bg-google-business"></div>
          <p className="text-xl md:text-xl lg:text-2xl font-bold m-0">
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
                {selectedBusInfo &&
                  (isLoadingVerification ? (
                    <Loader size={28} />
                  ) : isVerified ? (
                    <div className="px-2 py-1 rounded-lg">
                      <MdVerified color="orange" size={25} />
                    </div>
                  ) : null)}
                {user?.access?.gbDashboardEdit &&
                  selectedBusInfo &&
                  isVerified && (
                    <button
                      onClick={() => setEditOpen((p) => (p === 1 ? null : 1))}
                      className={`flex justify-between items-center py-2 px-2 text-lg text-orange-500 text-left transition ease-in delay-190 bg-orange-100 rounded-lg`}
                    >
                      {editOpen === 1 ? <LuPencilLine /> : <LuPencil />}
                    </button>
                  )}
                {user?.access?.gbIsPhotoChange &&
                  selectedBusInfo &&
                  isVerified && (
                    <button
                      onClick={() => setEditOpen((p) => (p === 2 ? null : 2))}
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

            {/* Form (dropdowns) */}
            <div className="flex flex-col gap-3 py-2">
              <div className="w-full p-0 m-0">
                <Controller
                  name="account"
                  control={controlFilter}
                  defaultValue={null}
                  render={({ field }) => (
                    <Select
                      placeholder="Select Account"
                      options={accountOptions}
                      value={field.value}
                      onChange={(opt) =>
                        handleAccountChangeReset(opt, field.onChange)
                      }
                      isSearchable
                      styles={AutoCompletionCustomStyles}
                    />
                  )}
                />
              </div>
              <div className="w-full">
                <Controller
                  name="businessInformation"
                  control={controlFilter}
                  defaultValue={null}
                  render={({ field }) => (
                    <Select
                      {...field}
                      placeholder="Select Business Info"
                      options={businessInfoOptions}
                      onChange={field.onChange}
                      isSearchable
                      styles={AutoCompletionCustomStyles}
                      isDisabled={!selectedAcc || isLoadingBusinessInfo}
                      isLoading={isLoadingBusinessInfo}
                    />
                  )}
                />
              </div>
            </div>

            {user?.access?.gbDashboardEdit && (
              <div className="flex items-center gap-2 border-2 border-orange-300 p-2 rounded-lg">
                <IoInformationCircleSharp color="orange" size={26} />
                <p className="text-md">
                  Edits will appear after at least 10 minutes or more.
                </p>
              </div>
            )}

            {selectedBusInfo ? (
              isLoadingShopDetails ? (
                <Loader className="py-40" />
              ) : detailsNetworkErr ? (
                <EmptyState
                  state="bg-empty-state-hours"
                  message="We couldn’t load shop details due to a network issue. Please check your connection and try again."
                  className="py-6"
                />
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
                      <p className="text-md text-gray-500 text">Website</p>
                    </div>
                    {weburl ? (
                      <a
                        href={weburl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 font-base underline decoration-solid"
                      >
                        {weburl}
                      </a>
                    ) : (
                      <span className="font-medium">—</span>
                    )}
                  </div>
                  <div className="flex justify-between gap-12 items-start p-2">
                    <div className="flex">
                      <p className="text-md text-gray-500">Address</p>
                    </div>
                    <p className="font-medium">{`${addressLines || ""} ${
                      shopAddress?.locality || ""
                    } ${shopAddress?.postalCode || ""}`}</p>
                  </div>

                  {Number.isFinite(rate) && Number.isInteger(review) && (
                    <>
                      <hr />
                      <p className="text-lg font-medium pt-2">User Feedback</p>
                      <div className="flex justify-between p-2">
                        <p className="text-md text-gray-500">
                          Overall rating with {review} reviews:
                        </p>
                        <div className="flex gap-1">
                          <p className="font-medium">{rate.toFixed(1)}</p>
                          <IoIosStar color="gold" size={20} />
                        </div>
                      </div>
                    </>
                  )}
                  <hr />
                  <div className="pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium">Opening Hours</span>
                      <div className="flex gap-2 items-center">
                        {shopActivityStatus === "OPEN" ? (
                          <p className="text-green-500">Open</p>
                        ) : shopActivityStatus === "CLOSED" ? (
                          <p className="text-red-500">Closed</p>
                        ) : shopActivityStatus === "CLOSED_PERMANENTLY" ? (
                          <p className="text-red-500">Closed Permanently</p>
                        ) : null}
                      </div>
                    </div>
                    <BusinessHoursDisplay
                      key={locationId || "none"}
                      locationId={locationId}
                    />
                  </div>
                </>
              )
            ) : (
              <EmptyState
                state="bg-empty-state-hours"
                message="You have not selected an account or business information."
                className="py-6"
              />
            )}
          </div>

          {/* TotalInteractions */}
          <div className="rounded-lg bg-white shadow-lg border">
            <SectionGate
              selected={!!selectedBusInfo}
              loading={isLoadingWebCallCount}
              notAllowed={notAllowedWebCallCount}
              networkErr={networkErrWebCallCount}
              noData={noDataWebCallCount}
              stateClass="bg-empty-state-interaction"
              noSelectionMsg="You have not selected an account or business information."
              loaderClass="py-16"
              emptyClass="py-10" // <<— tailored padding for this card
            >
              <TotalInteractions webCallCount={webCallCount} />
            </SectionGate>
          </div>
        </div>

        <div className="w-3/5 flex flex-col gap-6">
          <div className="w-full flex gap-6">
            {/* By searching on Google */}
            <div className="w-full h-full flex flex-col rounded-lg bg-white shadow-lg border h-[480px]">
              <SectionGate
                selected={!!selectedBusInfo}
                loading={isLoadingSearchCount}
                notAllowed={notAllowedSearchCount}
                networkErr={networkErrSearchCount}
                noData={noDataSearchCount}
                stateClass="bg-empty-state-piechart"
                noSelectionMsg="You have not selected an account or business information."
                loaderClass="h-full py-44"
                emptyClass="h-full py-32" // <<— full height + custom padding
              >
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
              </SectionGate>
            </div>

            {/* By using Google map service */}
            <div className="w-full h-full flex flex-col rounded-lg bg-white shadow-lg border h-[480px]">
              <SectionGate
                selected={!!selectedBusInfo}
                loading={isLoadingMapCount}
                notAllowed={notAllowedMapCount}
                networkErr={networkErrMapCount}
                noData={noDataMapCount}
                stateClass="bg-empty-state-piechart"
                noSelectionMsg="You have not selected an account or business information."
                loaderClass="h-full py-44"
                emptyClass="h-full py-32" // <<— different padding here
              >
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
              </SectionGate>
            </div>
          </div>

          {/* Keywords Analytics */}
          <div className="rounded-lg bg-white shadow-lg border">
            {selectedBusInfo ? (
              isLoadingTable ? (
                <Loader className="py-36" />
              ) : (
                <KeywordsAnalytics
                  key={locationId || "none"}
                  locationId={locationId}
                />
              )
            ) : (
              <EmptyState
                state="bg-empty-state-table"
                message="You have not selected an account or business information."
                className="py-32"
              />
            )}
          </div>
        </div>
      </div>

      {isOpen &&
        createPortal(
          <>
            {/* Admins */}
            <button
              type="button"
              onClick={() => setShowAdmins((v) => !v)}
              disabled={!selectedBusInfo}
              className={`fixed bottom-8 right-8 w-12 h-12 rounded-full grid place-items-center shadow-xl z-[1000]
    ${
      selectedBusInfo
        ? "bg-orange-500 hover:bg-orange-600 cursor-pointer"
        : "bg-gray-300 cursor-not-allowed"
    }
    text-white transition`}
            >
              <IoMdContacts size={24} />
            </button>

            <GBAdmins isOpen={showAdmins} locationId={locationId} />
          </>,
          document.body
        )}
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

export default GBDashboard;
