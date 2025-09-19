import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import AutoCompletionCustomStyles from "../AutoCompletionCustomStyles";
import instance from "../../api/api";
import { LuPencil, LuPencilLine } from "react-icons/lu";
import PieChartSection from "./PieChartSection";
import KeywordsAnalytics from "./KeywordsAnalytics";
import TotalInteractions from "./TotalInteractions";
import BusinessHoursDisplay from "./BusinessHoursDisplay";
import GoogleBusinessModal from "./GoogleBusinessModal";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { useUser } from "../../api/userPermission";
import { IoInformationCircleSharp } from "react-icons/io5";
import { MdOutlinePermMedia } from "react-icons/md";
import { MdPermMedia } from "react-icons/md";
import GoogleBusinessUploadModal from "./GoogleBusinessUploadModal";
import EmptyState from "../EmptyState";

const GBDashboard = ({ isOpen }) => {
  const { user } = useUser();

  const {
    setValue: setValueFilter,
    control: controlFilter,
    watch: watchFilter,
  } = useForm();

  const navigate = useNavigate();

  // const [accountList, setAccountList] = useState([]);
  const [businessInfo, setBusinessInfo] = useState([]);
  // const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isLoadingBusinessInfo, setIsLoadingBusinessInfo] = useState(false);
  const [locationId, setLocationId] = useState(null);

  const handleAccountFocus = () => {
    setValueFilter("businessInformation", null);
  };

  const [editOpen, setEditOpen] = useState(null);
  const [shopTitle, setShopTitle] = useState("");

  const handleEditOpen = (id) => {
    if (editOpen === id) {
      setEditOpen(null);
    } else {
      setEditOpen(id);
    }
  };

  const [activeIndexSearch, setActiveIndexSearch] = useState(0);
  const onPieEnterSearch = (_, index) => setActiveIndexSearch(index);

  const [activeIndexMap, setActiveIndexMap] = useState(0);
  const onPieEnterMap = (_, index) => setActiveIndexMap(index);

  const [shopActivityStatus, setShopActivityStatus] = useState("");

  const selectedAcc = watchFilter("account");
  const selectedBusInfo = watchFilter("businessInformation");

  const [accountList, setAccountList] = useState([]);
  const accessToken = sessionStorage.getItem("accessToken");

  useEffect(() => {
    instance
      .get("/api/v1/google/account/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        // console.log(response.data);
        setAccountList(response.data.accounts);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  useEffect(() => {
    const fetchSelectedBusinessInfo = async () => {
      if (selectedAcc) {
        setIsLoadingBusinessInfo(true);
        const accountId = selectedAcc.value.split("/")[1];
        if (accountId) {
          try {
            const response = await instance.get(
              `api/v1/google/business-info/front/${accountId}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
            setBusinessInfo(response.data);
          } catch (error) {
            console.error(error);
            error.status === 401 &&
              toast.error(
                "Your tokens have been exhausted. Please contact the R&D department to resolve this issue."
              ) &&
              setTimeout(() => {
                sessionStorage.removeItem("accessToken");
                navigate("/");
              }, 5000);
          } finally {
            setIsLoadingBusinessInfo(false);
          }
        }
      }
    };
    fetchSelectedBusinessInfo();
  }, [selectedAcc]);

  useEffect(() => {
    if (selectedBusInfo) {
      const id = selectedBusInfo.value.split("/")[1];
      setLocationId(id);
    }
  }, [selectedBusInfo]);

  useEffect(() => {
    if (selectedBusInfo && locationId) {
      instance
        .get(`/api/v1/google/get-title/${locationId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((response) => {
          // console.log(response.data.location.title);

          setShopTitle(response.data.location.title);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [locationId, selectedBusInfo]);

  useEffect(() => {
    if (selectedBusInfo && locationId) {
      instance
        .get(`api/v1/google/get-update-openstatus/${locationId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((response) => {
          // console.log("open Info:", response.data);

          setShopActivityStatus(response.data.location.openInfo.status);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [locationId, selectedBusInfo]);

  const [verifications, setVerifications] = useState([]);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const fetchVerificationData = async () => {
      if (selectedBusInfo && locationId) {
        try {
          const response = await instance.get(
            `api/v1/google/verifications/${locationId}`
          );
          // console.log(response);

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
      }
    };
    fetchVerificationData();
  }, [locationId, selectedBusInfo]);

  // console.log(verifications);
  // console.log("verification:", isVerified);

  // Move this logic into a useEffect
  useEffect(() => {
    if (verifications.length > 0 && verifications[0]?.state === "COMPLETED") {
      setIsVerified(true);
    } else {
      setIsVerified(false);
    }
  }, [verifications]); // Only run this effect when `verifications` changes

  const [shopPhone, setShopPhone] = useState();
  const [shopAddress, setShopAddress] = useState();
  const [weburl, setWeburl] = useState();

  useEffect(() => {
    if (selectedBusInfo && locationId) {
      instance
        .get(`api/v1/google/get-shop-attribute/${locationId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((response) => {
          // console.log(response.data.location);

          setShopPhone(response.data.location.phoneNumbers);
          setShopAddress(response.data.location.storefrontAddress);
          setWeburl(response.data.location.websiteUri);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [locationId, selectedBusInfo]);

  // const [isLoadingSearchCount, setIsLoadingSearchCount] = useState(false);
  const [noDataSearchCount, setNoDataSearchCount] = useState(false);
  const [notAllowedSearchCount, setNotAllowedSearchCount] = useState(false);
  const [searchCount, setSearchCount] = useState({});
  const googleSearchData = [
    {
      name: "Desktop",
      value: searchCount.BUSINESS_IMPRESSIONS_DESKTOP_SEARCH,
    },
    { name: "Mobile", value: searchCount.BUSINESS_IMPRESSIONS_MOBILE_SEARCH },
  ];

  useEffect(() => {
    if (selectedBusInfo && locationId) {
      instance
        .get(`api/v1/google/metric/mob-desk-search-count/${locationId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((response) => {
          // console.log("data for mobile desktop search", response.data);
          setSearchCount(response.data);
          setNoDataSearchCount(false);
        })
        .catch((error) => {
          console.error(error);
          error?.status === 500 && setNoDataSearchCount(true);
          error?.status === 403 && setNotAllowedSearchCount(true);
        });
    }
  }, [locationId, selectedBusInfo]);

  // const [isLoadingMapCount, setIsLoadingMapCount] = useState(false);
  const [noDataMapCount, setNoDataMapCount] = useState(false);
  const [notAllowedMapCount, setNotAllowedMapCount] = useState(false);
  const [mapCount, setMapCount] = useState({});
  const googleMapData = [
    { name: "Desktop", value: mapCount.BUSINESS_IMPRESSIONS_DESKTOP_MAPS },
    { name: "Mobile", value: mapCount.BUSINESS_IMPRESSIONS_MOBILE_MAPS },
  ];
  useEffect(() => {
    if (selectedBusInfo && locationId) {
      instance
        .get(`/api/v1/google/metric/mob-desk-map-count/${locationId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((response) => {
          // console.log("data for mobile desktop map", response.data);
          setMapCount(response.data);
          setNoDataMapCount(false);
        })
        .catch((error) => {
          console.error(error);
          error?.status === 500 && setNoDataMapCount(true);
          error?.status === 403 && setNotAllowedMapCount(true);
        });
    }
  }, [locationId, selectedBusInfo]);

  // const [isLoadingWebCallCount, setIsLoadingWebCallCount] = useState(false);
  const [noDataWebCallCount, setNoDataWebCallCount] = useState(false);
  const [notAllowedWebCallCount, setNotAllowedWebCallCount] = useState(false);
  const [webCallCount, setWebCallCount] = useState({});

  useEffect(() => {
    if (selectedBusInfo && locationId) {
      instance
        .get(`/api/v1/google/metric/web-call-count/${locationId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((response) => {
          // console.log("data for web call", response.data);
          setWebCallCount(response?.data);
          setNoDataWebCallCount(false);
        })
        .catch((error) => {
          console.error(error);
          error?.status === 500 && setNoDataWebCallCount(true);
          error?.status === 403 && setNotAllowedWebCallCount(true);
        });
    }
  }, [locationId, selectedBusInfo]);

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
      <div className="flex flex-col md:gap-6 lg:gap-8 mx-4 lg:mx-6 md:grid md:grid-cols-6 md:grid-rows-27 lg:grid lg:grid-cols-6 pb-6">
        <div className="md:col-span-3 md:row-span-6 md:row-start-2 md:col-start-1 lg:col-span-2 lg:row-span-3 lg:col-start-5 rounded-lg bg-white shadow-lg border">
          <div className="flex flex-col">
            <div className="p-4">
              <div className="flex gap-2 justify-between items-center">
                <p className="text-xl font-medium">Google Business Details</p>
                <div className="flex gap-2">
                  {selectedBusInfo && isVerified ? (
                    <div className="px-2 py-1 bg-green-100 rounded-lg">
                      <p className="text-green-800">Verified</p>
                    </div>
                  ) : null}
                  {user?.access?.gbDashboardEdit &&
                    selectedBusInfo &&
                    isVerified && (
                      <button
                        onClick={() => handleEditOpen(1)}
                        className={`flex justify-between items-center py-2 px-2 text-lg text-orange-500 text-left transition ease-in delay-190 bg-orange-100 rounded-lg`}
                      >
                        {editOpen === 1 ? <LuPencilLine /> : <LuPencil />}
                      </button>
                    )}
                  {user?.access?.gbIsPhotoChange &&
                    selectedBusInfo &&
                    isVerified && (
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

              {user?.access?.gbDashboardEdit && (
                <div className="flex items-center gap-2 border-2 border-orange-300 p-2 rounded-lg my-4">
                  <IoInformationCircleSharp color="orange" size={26} />
                  <p className="text-base">
                    Edits will appear after at least 10 minutes or more.
                  </p>
                </div>
              )}

              {editOpen === 1 && (
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

              {editOpen === 2 && (
                <GoogleBusinessUploadModal
                  isOpen={true}
                  onClose={() => setEditOpen(null)}
                  locationId={locationId}
                  selectedAcc={selectedAcc}
                />
              )}

              <div className="bodrer-t-2">
                <p className="text-lg p-2">Shop Information</p>
                <div className="flex justify-between items-center p-2">
                  <div className="flex">
                    <p className="text-base text-gray-500">Shop Name</p>
                  </div>

                  <p>{shopTitle}</p>
                </div>
                <div className="flex justify-between items-center p-2">
                  <div className="flex">
                    <p className="text-base text-gray-500">Phone Number</p>
                  </div>

                  <p>{shopPhone?.primaryPhone}</p>
                </div>
                <div className="flex justify-between items-center p-2">
                  <div className="flex">
                    <p className="text-base text-gray-500">Website</p>
                  </div>
                  <p>{weburl}</p>
                </div>
                <div className="flex justify-between gap-12 items-start p-2">
                  <div className="flex">
                    <p className="text-base text-gray-500">Address</p>
                  </div>
                  <p>{`${shopAddress?.addressLines || ""} ${shopAddress?.locality || ""} ${shopAddress?.postalCode || ""}`}</p>
                </div>
              </div>
            </div>
            <hr />
            <div>
              {selectedBusInfo ? (
                <div className="p-4">
                  {selectedBusInfo && (
                    <div className="flex justify-between items-center">
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
                  )}
                  <BusinessHoursDisplay locationId={locationId} />
                </div>
              ) : (
                <EmptyState
                  state="bg-empty-state-hours"
                  message="You have not selected an account or business information."
                  className="py-12"
                />
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-6 md:col-span-3 md:col-start-1 md:row-span-6 md:row-start-8 lg:row-span-1 lg:col-span-4 lg:row-start-1 ">
          <div className="w-full p-0 m-0">
            <Controller
              name="account"
              control={controlFilter}
              defaultValue={null}
              render={({ field }) => (
                <Select
                  placeholder="Select Account"
                  onFocus={handleAccountFocus}
                  classNames={{
                    control: (state) =>
                      state.isFocused ? "border-red-600" : "border-grey-300",
                  }}
                  options={accountList.map((account) => ({
                    label: account.accountName,
                    value: account.name,
                  }))}
                  value={
                    field.value
                      ? { label: field.value.label, value: field.value.value }
                      : null
                  }
                  onChange={field.onChange}
                  isSearchable
                  styles={AutoCompletionCustomStyles}
                />
              )}
            />
          </div>
          <div className="w-full p-0 m-0">
            <Controller
              name="businessInformation"
              control={controlFilter}
              defaultValue={null}
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Select Business Info"
                  onFocus={handleAccountFocus}
                  options={businessInfo.map((info) => ({
                    value: info.name,
                    label: info.title,
                  }))}
                  onChange={field.onChange}
                  isSearchable
                  styles={AutoCompletionCustomStyles}
                  isDisabled={isLoadingBusinessInfo}
                  isLoading={isLoadingBusinessInfo}
                />
              )}
            />
          </div>
        </div>
        <div className="flex flex-col md:col-span-3 md:col-start-1 md:row-span-6 md:row-start-8 lg:row-span-2 lg:col-span-2 lg:row-start-2 rounded-lg bg-white shadow-lg border">
          {!notAllowedSearchCount ? (
            <>
              {selectedBusInfo ? (
                noDataSearchCount ? (
                  <EmptyState
                    state="bg-empty-state-piechart"
                    message="No data has been received from Google."
                    className="py-40"
                  />
                ) : (
                  <>
                    <p className="text-xl font-medium p-4">
                      By searching on Google
                    </p>
                    <PieChartSection
                      activeIndex={activeIndexSearch}
                      data={googleSearchData}
                      onPieEnter={onPieEnterSearch}
                    />
                  </>
                )
              ) : (
                <EmptyState
                  state="bg-empty-state-piechart"
                  message=" You have not selected an account or business information."
                  className="py-40"
                />
              )}
            </>
          ) : (
            <EmptyState
              state="bg-no-access"
              message="You don’t have access to this section."
              className="py-40"
            />
          )}
        </div>
        <div className="flex flex-col md:col-span-3 md:row-span-6 md:row-start-8 md:col-start-4 lg:row-span-2 lg:col-span-2 lg:col-start-3 lg:row-start-2 md:row-start-8 rounded-lg bg-white shadow-lg border">
          {!notAllowedMapCount ? (
            <>
              {selectedBusInfo ? (
                noDataMapCount ? (
                  <EmptyState
                    state="bg-empty-state-piechart"
                    message="No data has been received from Google."
                    className="py-40"
                  />
                ) : (
                  <>
                    <p className="text-xl font-medium p-4">
                      By using Google map service
                    </p>
                    <PieChartSection
                      activeIndex={activeIndexMap}
                      data={googleMapData}
                      onPieEnter={onPieEnterMap}
                    />
                  </>
                )
              ) : (
                <EmptyState
                  state="bg-empty-state-piechart"
                  message="You have not selected an account or business information."
                  className="py-40"
                />
              )}
            </>
          ) : (
            <EmptyState
              state="bg-no-access"
              message="You don’t have access to this section."
              className="py-40"
            />
          )}
        </div>
        <div className="md:row-start-14 md:row-span-6 md:col-span-6 lg:col-span-4 lg:row-span-2 lg:row-start-4 rounded-lg bg-white shadow-lg border">
          {selectedBusInfo ? (
            <KeywordsAnalytics locationId={locationId} />
          ) : (
            <EmptyState
              state="bg-empty-state-table"
              message="You have not selected an account or business information."
              className="py-32"
            />
          )}
        </div>
        <div className="md:row-start-2 md:col-span-3 md:row-span-6 md:col-start-4 lg:row-start-4 lg:col-span-2 lg:row-span-1 lg:col-start-5 rounded-lg bg-white shadow-lg border">
          {!notAllowedWebCallCount ? (
            <>
              {selectedBusInfo ? (
                noDataWebCallCount ? (
                  <EmptyState
                    state="bg-empty-state-interaction"
                    message="No data has been received from Google."
                    className="h-96"
                  />
                ) : (
                  <TotalInteractions webCallCount={webCallCount} />
                )
              ) : (
                <EmptyState
                  state="bg-empty-state-interaction"
                  message="You have not selected an account or business information."
                  className="h-96"
                />
              )}
            </>
          ) : (
            <EmptyState
              state="bg-no-access"
              message="You don’t have access to this section."
              className="h-96"
            />
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

export default GBDashboard;
