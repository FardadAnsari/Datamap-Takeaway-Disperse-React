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

  const [review, setReview] = useState();
  const [rate, setRate] = useState();

  const [verifications, setVerifications] = useState([]);
  const [isVerified, setIsVerified] = useState(false);

  const [showAdmins, setShowAdmins] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);

  const [noDataSearchCount, setNoDataSearchCount] = useState(false);
  const [notAllowedSearchCount, setNotAllowedSearchCount] = useState(false);
  const [searchCount, setSearchCount] = useState({});

  const [noDataMapCount, setNoDataMapCount] = useState(false);
  const [notAllowedMapCount, setNotAllowedMapCount] = useState(false);
  const [mapCount, setMapCount] = useState({});

  const [noDataWebCallCount, setNoDataWebCallCount] = useState(false);
  const [notAllowedWebCallCount, setNotAllowedWebCallCount] = useState(false);
  const [webCallCount, setWebCallCount] = useState({});

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

  // Business info for selected account (cancelable)
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
        if (error.name !== "CanceledError" && error.name !== "AbortError") {
          console.error(error);
          const status = error?.response?.status || error?.status;
          if (status === 401) {
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

    setIsLoadingSearchCount(true);
    setIsLoadingMapCount(true);
    setIsLoadingWebCallCount(true); // keeps Interactions consistent too

    setNoDataSearchCount(false);
    setNoDataMapCount(false);
    setNoDataWebCallCount(false);
    setNotAllowedSearchCount(false);
    setNotAllowedMapCount(false);
    setNotAllowedWebCallCount(false);

    setSearchCount({});
    setMapCount({});
    setWebCallCount({});

    // Details loaders only if we actually have a new id
    if (id) {
      setIsLoadingTitle(true);
      setIsLoadingOpenStatus(true);
      setIsLoadingAttributes(true);
      setIsLoadingReview(true);

      // Clear old details while new ones load
      setShopTitle("");
      setShopActivityStatus("");
      setShopPhone(undefined);
      setShopAddress(undefined);
      setWeburl(undefined);
    }
  }, [selectedBusInfo]);

  // Title
  useEffect(() => {
    if (selectedBusInfo && locationId) {
      setIsLoadingTitle(true);
      instance
        .get(`/api/v1/google/get-title/${locationId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => {
          setShopTitle(response?.data?.location?.title || "");
        })
        .catch((error) => {
          console.error(error);
          setShopTitle("");
        })
        .finally(() => setIsLoadingTitle(false));
    }
  }, [locationId, selectedBusInfo, accessToken]);

  // Open status
  useEffect(() => {
    if (selectedBusInfo && locationId) {
      setIsLoadingOpenStatus(true);
      instance
        .get(`api/v1/google/get-update-openstatus/${locationId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => {
          setShopActivityStatus(
            response?.data?.location?.openInfo?.status || ""
          );
        })
        .catch((error) => {
          console.error(error);
          setShopActivityStatus("");
        })
        .finally(() => setIsLoadingOpenStatus(false));
    }
  }, [locationId, selectedBusInfo, accessToken]);

  // Verifications
  useEffect(() => {
    const fetchVerificationData = async () => {
      if (selectedBusInfo && locationId) {
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
          setIsVerified(!!(response.data && Object.keys(response.data).length));
        } catch (error) {
          console.error(error);
          setVerifications([]);
          setIsVerified(false);
        } finally {
          setIsLoadingVerification(false);
        }
      }
    };
    fetchVerificationData();
  }, [locationId, selectedBusInfo, accessToken]);

  useEffect(() => {
    if (verifications.length > 0 && verifications[0]?.state === "COMPLETED") {
      setIsVerified(true);
    } else {
      setIsVerified(false);
    }
  }, [verifications]);

  //Admins
  useEffect(() => {
    if (selectedBusInfo && locationId) {
      setIsLoadingAdmins(true);
      instance
        .get(`api/v1/google/admins/location/${locationId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => {
          // console.log("admin", response);
          setAdmins(response.data.admins);
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => setIsLoadingAdmins(false));
    }
  }, [locationId, selectedBusInfo, accessToken]);

  useEffect(() => {
    setShowAdmins(false);
    setAdmins([]);
  }, [locationId]);

  // Attributes
  useEffect(() => {
    if (selectedBusInfo && locationId) {
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
        .catch((error) => {
          console.error(error);
        })
        .finally(() => setIsLoadingAttributes(false));
    }
  }, [locationId, selectedBusInfo, accessToken]);

  // Review & Rate
  useEffect(() => {
    if (selectedBusInfo && locationId) {
      const accountId = selectedAcc.value?.split("/")[1];
      setIsLoadingReview(true);
      instance
        .get(
          `api/v1/google/accounts/reviews-summary/${accountId}/locations/${locationId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        )
        .then((response) => {
          setRate(response.data.averageRating);
          setReview(response.data.totalReviewCount);
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => setIsLoadingReview(false));
    }
  }, [locationId, selectedBusInfo, accessToken]);

  // Search count
  useEffect(() => {
    if (!selectedBusInfo || !locationId) return;
    const controller = new AbortController();
    (async () => {
      try {
        setIsLoadingSearchCount(true);
        const res = await instance.get(
          `api/v1/google/metric/mob-desk-search-count/${locationId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
          }
        );
        setSearchCount(res.data || {});
        setNoDataSearchCount(false);
        setNotAllowedSearchCount(false);
      } catch (error) {
        if (error.name !== "CanceledError" && error.name !== "AbortError") {
          console.error(error);
          const status = error?.response?.status || error?.status;
          setSearchCount({});
          setNoDataSearchCount(status === 500);
          setNotAllowedSearchCount(status === 403);
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
        const res = await instance.get(
          `/api/v1/google/metric/mob-desk-map-count/${locationId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
          }
        );
        setMapCount(res.data || {});
        setNoDataMapCount(false);
        setNotAllowedMapCount(false);
      } catch (error) {
        if (error.name !== "CanceledError" && error.name !== "AbortError") {
          console.error(error);
          const status = error?.response?.status || error?.status;
          setMapCount({});
          setNoDataMapCount(status === 500);
          setNotAllowedMapCount(status === 403);
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
        const res = await instance.get(
          `/api/v1/google/metric/web-call-count/${locationId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
          }
        );
        setWebCallCount(res?.data || {});
        setNoDataWebCallCount(false);
        setNotAllowedWebCallCount(false);
      } catch (error) {
        if (error.name !== "CanceledError" && error.name !== "AbortError") {
          console.error(error);
          const status = error?.response?.status || error?.status;
          setWebCallCount({});
          setNoDataWebCallCount(status === 500);
          setNotAllowedWebCallCount(status === 403);
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
    // Show loaders while waiting for new BI selection
    setIsLoadingSearchCount(true);
    setIsLoadingMapCount(true);
    setIsLoadingWebCallCount(true);
  };

  return (
    <div
      className={`max-w-screen w-[calc(100%-80px)] absolute top-0 left-20 flex flex-col h-full ${editOpen ? "overflow-y-hidden" : "overflow-y-auto"} bg-white z-40 transition-transform duration-700 ease-in-out ${
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
                  <p className="text-lg font-medium pt-2">User Feedback</p>
                  <div className="flex justify-between p-2">
                    <p className="text-md text-gray-500">
                      Overall rating with {review} reviews:
                    </p>
                    <div className="flex gap-1">
                      <p className="font-medium">{rate?.toFixed(1)}</p>
                      <IoIosStar color="gold" size={20} />
                    </div>
                  </div>
                  <hr />
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
            {!notAllowedWebCallCount ? (
              selectedBusInfo ? (
                isLoadingWebCallCount ? (
                  <Loader className="py-16" />
                ) : noDataWebCallCount ? (
                  <EmptyState
                    state="bg-empty-state-interaction"
                    message="No data has been received from Google."
                    className="py-6"
                  />
                ) : (
                  <TotalInteractions webCallCount={webCallCount} />
                )
              ) : (
                <EmptyState
                  state="bg-empty-state-interaction"
                  message="You have not selected an account or business information."
                  className="py-6"
                />
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
                selectedBusInfo ? (
                  isLoadingSearchCount ? (
                    <Loader className="h-full" />
                  ) : noDataSearchCount ? (
                    <EmptyState
                      state="bg-empty-state-piechart"
                      message="No data has been received from Google."
                      className="h-full"
                    />
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
                    state="bg-empty-state-piechart"
                    message=" You have not selected an account or business information."
                    className="h-full"
                  />
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
                selectedBusInfo ? (
                  isLoadingMapCount ? (
                    <Loader className="h-full" />
                  ) : noDataMapCount ? (
                    <EmptyState
                      state="bg-empty-state-piechart"
                      message="No data has been received from Google."
                      className="h-full"
                    />
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
                    state="bg-empty-state-piechart"
                    message="You have not selected an account or business information."
                    className="h-full"
                  />
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
            {/* Admins FAB */}
            <button
              type="button"
              onClick={() => setShowAdmins((v) => !v)}
              disabled={!selectedBusInfo}
              title={
                selectedBusInfo
                  ? "Show location admins"
                  : "Select a location first"
              }
              className={`fixed bottom-8 right-8 w-12 h-12 rounded-full grid place-items-center shadow-xl z-[1000]
        ${selectedBusInfo ? "bg-orange-500 hover:bg-orange-600 cursor-pointer" : "bg-gray-300 cursor-not-allowed"}
        text-white transition`}
            >
              <IoMdContacts size={24} />
            </button>

            {/* Floating admins panel */}
            {showAdmins && (
              <div className="fixed bottom-24 right-8 w-64 bg-white rounded-xl shadow-2xl border z-[1000] overflow-hidden">
                <div className="px-4 py-2 text-sm font-semibold border-b">
                  Admins
                </div>
                <div className="max-h-72 overflow-auto">
                  {isLoadingAdmins ? (
                    <Loader className="py-6" size={30} />
                  ) : admins.length ? (
                    admins.map((a, i) => (
                      <div key={i} className="px-4 py-3 border-b last:border-0">
                        <div className="text-sm font-medium">{a?.admin}</div>
                        <div className="text-xs text-gray-500">
                          {a?.role || "Admin"}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-4 text-sm text-gray-500">
                      No admins found.
                    </div>
                  )}
                </div>
              </div>
            )}
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
