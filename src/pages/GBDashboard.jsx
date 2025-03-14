import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import AutoCompletionCustomStyles from "../component/AutoCompletionCustomStyles";
import instance from "../component/api";

// import DialogDefault from "../component/DialogDefault/DialogDefault";
import PieChartSection from "../component/PieChartSection";
import KeywordsAnalytics from "../component/KeywordsAnalytics";
import TotalInteractions from "../component/TotalInteractions";
import BusinessHoursDisplay from "../component/BusinessHoursDisplay";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { useUser } from "../component/userPermission";
import { IoInformationCircleSharp } from "react-icons/io5";
import GoogleBusinessModal from "../component/GoogleBusinessModal";

const GBDashboard = ({ isOpen, setIsGoogleBusinessPanelOpen }) => {
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
        console.log(response.data);
        setAccountList(response.data.accounts);
      })
      .catch();
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
            error.status === 401 &&
              toast.error(
                "Your tokens have been exhausted. Please contact the R&D department to resolve this issue."
              ) &&
              setTimeout(() => {
                navigate("/login");
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
    if (selectedBusInfo) {
      instance
        .get(`/api/v1/google/get-title/${locationId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((response) => {
          console.log(response.data.location.title);

          setShopTitle(response.data.location.title);
          console.log(shopTitle);
        })
        .catch();
    }
  }, [locationId, selectedBusInfo]);

  useEffect(() => {
    if (selectedBusInfo) {
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
    }
  }, [locationId, selectedBusInfo]);

  const [verifications, setVerifications] = useState([]);
  const [isVerified, setIsVerified] = useState(true);

  useEffect(() => {
    const fetchVerificationData = async () => {
      if (selectedBusInfo) {
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
      }
    };
    fetchVerificationData();
  }, [locationId, selectedBusInfo]);

  console.log(verifications);
  console.log(isVerified);

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
    if (selectedBusInfo) {
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
    }
  }, [locationId, selectedBusInfo]);

  const [isLoadingSearchCount, setIsLoadingSearchCount] = useState(false);
  const [notAllowedSearchCount, setNotAllowedSearchCount] = useState(false);
  const [searchCount, setSearchCount] = useState({});

  useEffect(() => {
    if (selectedBusInfo) {
      const fetchSearchData = async () => {
        setIsLoadingSearchCount(false);
        const locationId = selectedBusInfo.value.split("/")[1];
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
    }
  }, [selectedBusInfo]);

  const [isLoadingMapCount, setIsLoadingMapCount] = useState(false);
  const [notAllowedMapCount, setNotAllowedMapCount] = useState(false);
  const [mapCount, setMapCount] = useState({});

  useEffect(() => {
    if (selectedBusInfo) {
      const fetchMapData = async () => {
        setIsLoadingMapCount(false);
        const locationId = selectedBusInfo.value.split("/")[1];
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
    }
  }, [selectedBusInfo]);

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
    if (selectedBusInfo) {
      const fetchWebCallData = async () => {
        setIsLoadingWebCallCount(false);
        const locationId = selectedBusInfo.value.split("/")[1];
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
    }
  }, [selectedBusInfo]);

  return (
    <div
      className={`max-w-screen w-[calc(100%-80px)] absolute top-0 left-20 flex flex-col h-full ${editOpen ? "overflow-y-hidden" : "overflow-y-auto"} bg-white z-40 transition-transform duration-700 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } font-sans bg-yellow-50`}
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
              {user?.access?.gbDashboardEdit && (
                <button
                  onClick={() => handleEditOpen(4)}
                  className={`flex justify-between items-center py-2 px-2 text-lg text-orange-500 text-left transition ease-in delay-190`}
                >
                  Edit
                </button>
              )}
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
        <div className=" flex gap-6 md:col-span-3 md:col-start-1 md:row-span-6 md:row-start-8 lg:row-span-1 lg:col-span-4 lg:row-start-1 ">
          <div className="w-full">
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
          <div className="w-full">
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

export default GBDashboard;
