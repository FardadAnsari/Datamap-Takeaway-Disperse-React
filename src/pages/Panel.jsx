import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import AutoCompletionCustomStyles from "../component/AutoCompletionCustomStyles";
import instance from "../component/api";

import DialogDefault from "../component/DialogDefault/DialogDefault";
import PieChartSection from "../component/PieChartSection";
import KeywordsAnalytics from "../component/KeywordsAnalytics";
import TotalInteractions from "../component/TotalInteractions";
import { IoIosArrowDown } from "react-icons/io";
import { LuPencil, LuPencilLine } from "react-icons/lu";
import { RiLogoutCircleRLine } from "react-icons/ri";
import BusinessHoursDisplay from "../component/BusinessHoursDisplay";
import BusinessHoursEdit from "../component/BusinessHoursEdit";
import { useNavigate } from "react-router-dom";
import PhoneNumberEdit from "../component/PhoneNumberEdit";
import ShopNameEdit from "../component/ShopNameEdit";
import WebSiteUriEdit from "../component/WebSiteUriEdit";
import { toast, ToastContainer } from "react-toastify";

const Panel = () => {
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

  const [open, setOpen] = useState(null);
  const [editOpen, setEditOpen] = useState(null);

  const handleEditOpen = (id) => {
    if (editOpen === id) {
      setEditOpen(null);
    } else {
      setEditOpen(id);
      setOpen(null);
    }
  };

  const handleOpen = (id) => {
    if (open === id) {
      setOpen(null);
    } else {
      setOpen(id);
      setEditOpen(null);
    }
  };

  const [activeIndexSearch, setActiveIndexSearch] = useState(0);
  const onPieEnterSearch = (_, index) => setActiveIndexSearch(index);

  const [activeIndexMap, setActiveIndexMap] = useState(0);
  const onPieEnterMap = (_, index) => setActiveIndexMap(index);

  const selectedAcc = watchFilter("account");
  const selectedBusInfo = watchFilter("businessInformation");

  const accountList = [
    { accountName: "Mealzo Ads", name: "accounts/109436864933420290168" },
    { accountName: "Mealzo", name: "accounts/103526686887949354169" },
  ];

  useEffect(() => {
    const fetchSelectedBusinessInfo = async () => {
      if (selectedAcc) {
        setIsLoadingBusinessInfo(true);
        const accountId = selectedAcc.value.split("/")[1];
        if (accountId) {
          try {
            const response = await instance.get(
              `api/v1/google/business-info/${accountId}`
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

  const [shopActivityStatus, setShopActivityStatus] = useState("");

  useEffect(() => {
    if (selectedBusInfo) {
      instance
        .get(`api/v1/google/get-update-openstatus/${locationId}`)
        .then((response) => {
          setShopActivityStatus(response.data.location.openInfo.status);
        })
        .catch();
    }
  }, [locationId, selectedBusInfo]);

  useEffect(() => {
    const fetchVerificationData = async () => {
      if (selectedBusInfo) {
        try {
          const response = await instance.get(
            `api/v1/google/verifications/${locationId}`
          );

          if (Object.keys(response.data).length === 0) {
            setIsVerified(false);
          } else {
            setIsVerified(true);
          }
        } catch (error) {
          console.error(error);
        }
      }
    };

    fetchVerificationData();
  }, [locationId, selectedBusInfo]);

  const [isVerified, setIsVerified] = useState(true);

  const [shopPhone, setShopPhone] = useState();
  const [shopAddress, setShopAddress] = useState();
  const [weburl, setWeburl] = useState();

  useEffect(() => {
    setIsVerified(true);
    if (selectedBusInfo) {
      instance
        .get(`api/v1/google/get-shop-attribute/${locationId}`)
        .then((response) => {
          setShopPhone(response.data.location.phoneNumbers);
          setShopAddress(response.data.location.storefrontAddress);
          setWeburl(response.data.location.websiteUri);
        });
    }
  }, [locationId, selectedBusInfo]);

  const [isLoadingSearchCount, setIsLoadingSearchCount] = useState(false);
  const [searchCount, setSearchCount] = useState({});

  useEffect(() => {
    if (selectedBusInfo) {
      const fetchSearchData = async () => {
        setIsLoadingSearchCount(false);
        const locationId = selectedBusInfo.value.split("/")[1];
        try {
          const response = await instance.get(
            `api/v1/google/metric/mob-desk-search-count/${locationId}`
          );

          setSearchCount(response.data);
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoadingSearchCount(true);
        }
      };
      fetchSearchData();
    }
  }, [selectedBusInfo]);

  const [isLoadingMapCount, setIsLoadingMapCount] = useState(false);
  const [mapCount, setMapCount] = useState({});

  useEffect(() => {
    if (selectedBusInfo) {
      const fetchMapData = async () => {
        setIsLoadingMapCount(false);
        const locationId = selectedBusInfo.value.split("/")[1];
        try {
          const response = await instance.get(
            `/api/v1/google/metric/mob-desk-map-count/${locationId}`
          );

          setMapCount(response.data);
        } catch (error) {
          console.error(error);
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
  const [webCallCount, setWebCallCount] = useState({});

  useEffect(() => {
    if (selectedBusInfo) {
      const fetchWebCallData = async () => {
        setIsLoadingWebCallCount(false);
        const locationId = selectedBusInfo.value.split("/")[1];
        try {
          const response = await instance.get(
            `/api/v1/google/metric/web-call-count/${locationId}`
          );
          setWebCallCount(response?.data);
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoadingWebCallCount(true);
        }
      };
      fetchWebCallData();
    }
  }, [selectedBusInfo]);

  return (
    <div className="font-sans bg-yellow-100">
      <div className="flex justify-between px-12 py-6 mb-6 border-solid bg-orange-300">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-cover bg-center bg-google-business"></div>
          <p className="text-xl md:text-2xl lg:text-3xl font-medium text-teal-700 m-0">
            Google Business Dashboard
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-2 py-2 text-white bg-teal-500 rounded hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition"
          onClick={() => {
            sessionStorage.removeItem("accessToken");
            navigate("/login");
          }}
        >
          <div>
            <RiLogoutCircleRLine size={25} />
          </div>
          <span className="hidden lg:block md:block sm:hidden">Logout</span>
        </button>
      </div>
      <div className="flex flex-col gap-2 mx-4 lg:mx-6 md:grid md:grid-cols-6 md:grid-rows-27 lg:grid lg:grid-cols-6 lg:grid-rows-9">
        <div className="row-span-1 col-start-1 md:col-span-3 lg:col-span-2">
          <p className="text-lg font-medium mb-2">Account Name</p>
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
        <div className="row-span-1 md:col-span-3 md:col-start-4 lg:col-start-3 lg:col-span-2">
          <p className="text-lg font-medium mb-2">Business Information</p>
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
        <DialogDefault
          open={!isVerified}
          setClose={setIsVerified}
          message={"This Bussiness is not verified yet!"}
        />
        <div className="md:col-span-3 md:row-span-6 md:row-start-2 md:col-start-1 lg:col-span-2 lg:row-span-6 lg:col-start-5 rounded-2xl bg-white">
          <div className="flex flex-col px-4 pt-4 ">
            <div className="h-10 flex gap-2 justify-between items-center border-gray-600 border-b-2 pb-4">
              {!selectedBusInfo && (
                <p className="text-teal-900 text-sm font-light text-center">
                  Select the account name and the relevant business information
                </p>
              )}
              {selectedBusInfo ? (
                <>
                  {editOpen === 4 ? (
                    <ShopNameEdit
                      locationId={locationId}
                      shopName={selectedBusInfo.label}
                    />
                  ) : (
                    <p
                      className={`${selectedBusInfo.label.length < 45 ? "text-lg" : "text-base"} font-medium`}
                    >
                      {selectedBusInfo.label}
                    </p>
                  )}
                  <button
                    onClick={() => handleEditOpen(4)}
                    className={`flex justify-between items-center py-2 px-2 text-lg font-medium text-left  border-2 border-gray-300 rounded-xl hover:border-gray-400 ${editOpen === 1 ? "focus:border-gray-500" : ""} transition ease-in delay-190`}
                  >
                    <span>
                      {editOpen === 4 ? <LuPencilLine /> : <LuPencil />}
                    </span>
                  </button>
                </>
              ) : null}
            </div>
            <div className="border-b">
              <div className="flex justify-between items-center py-2">
                <span className="text-base">Open Hour</span>
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
                  <button
                    onClick={() => handleEditOpen(1)}
                    className={`flex justify-between items-center py-2 px-2 text-lg font-medium text-left  border-2 border-gray-300 rounded-xl hover:border-gray-400 ${editOpen === 1 ? "focus:border-gray-500" : ""} transition ease-in delay-190`}
                  >
                    <span>
                      {editOpen === 1 ? <LuPencilLine /> : <LuPencil />}
                    </span>
                  </button>
                  <button
                    onClick={() => handleOpen(1)}
                    className={`flex justify-between items-center py-2 px-2 text-lg font-medium text-left  border-2 border-gray-300 rounded-xl hover:border-gray-400 ${open === 1 ? "focus:border-gray-500" : ""} transition ease-in delay-190`}
                  >
                    <span>
                      {open === 1 ? (
                        <IoIosArrowDown
                          style={{ transform: "rotate(180deg)" }}
                        />
                      ) : (
                        <IoIosArrowDown locationId={locationId} />
                      )}
                    </span>
                  </button>
                </div>
              </div>
              {open === 1 && <BusinessHoursDisplay locationId={locationId} />}
              {editOpen === 1 && <BusinessHoursEdit locationId={locationId} />}
            </div>
            <div className="border-b">
              <div className="flex justify-between items-center py-2">
                <span className="text-base">Phone Number</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditOpen(2)}
                    className={`flex justify-between items-center py-2 px-2 text-lg font-medium text-left  border-2 border-gray-300 rounded-xl hover:border-gray-400 ${editOpen === 1 ? "focus:border-gray-500" : ""} transition ease-in delay-190`}
                  >
                    <span>
                      {editOpen === 2 ? <LuPencilLine /> : <LuPencil />}
                    </span>
                  </button>
                  <button
                    onClick={() => handleOpen(2)}
                    className={`flex justify-between items-center py-2 px-2 text-lg font-medium text-left  border-2 border-gray-300 rounded-xl hover:border-gray-400 ${open === 2 ? "focus:border-gray-500" : ""} transition ease-in delay-190`}
                  >
                    <span>
                      {open === 2 ? (
                        <IoIosArrowDown
                          style={{ transform: "rotate(180deg)" }}
                        />
                      ) : (
                        <IoIosArrowDown />
                      )}
                    </span>
                  </button>
                </div>
              </div>
              {open === 2 && (
                <div className="px-4 py-2 text-teal-700">
                  <p>{shopPhone?.primaryPhone}</p>
                </div>
              )}
              {editOpen === 2 && (
                <div className="px-4 py-2 text-teal-700">
                  <PhoneNumberEdit
                    locationId={locationId}
                    phoneNumber={shopPhone.primaryPhone}
                  />
                </div>
              )}
            </div>
            <div className="border-b">
              <div className="flex justify-between items-center py-2">
                <span className="text-base">Website</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditOpen(3)}
                    className={`flex justify-between items-center py-2 px-2 text-lg font-medium text-left  border-2 border-gray-300 rounded-xl hover:border-gray-400 ${editOpen === 1 ? "focus:border-gray-500" : ""} transition ease-in delay-190`}
                  >
                    <span>
                      {editOpen === 3 ? <LuPencilLine /> : <LuPencil />}
                    </span>
                  </button>
                  <button
                    onClick={() => handleOpen(3)}
                    className={`flex justify-between items-center py-2 px-2 text-lg font-medium text-left  border-2 border-gray-300 rounded-xl hover:border-gray-400 ${open === 2 ? "focus:border-gray-500" : ""} transition ease-in delay-190`}
                  >
                    <span>
                      {open === 3 ? (
                        <IoIosArrowDown
                          style={{ transform: "rotate(180deg)" }}
                        />
                      ) : (
                        <IoIosArrowDown />
                      )}
                    </span>
                  </button>
                </div>
              </div>
              {open === 3 && (
                <div className="py-2 text-teal-700">
                  <p>{weburl}</p>
                </div>
              )}
              {editOpen === 3 && (
                <div className="py-2 text-teal-700">
                  <WebSiteUriEdit locationId={locationId} webUrl={weburl} />
                </div>
              )}
            </div>
            <div className="border-b">
              <div className="flex justify-between items-center py-2">
                <span className="text-base">Address</span>
                <button
                  onClick={() => handleOpen(4)}
                  className={`flex justify-between items-center py-2 px-2 text-lg font-medium text-left  border-2 border-gray-300 rounded-xl hover:border-gray-400 ${open === 3 ? "focus:border-gray-500" : ""} transition ease-in delay-190`}
                >
                  <span>
                    {open === 4 ? (
                      <IoIosArrowDown style={{ transform: "rotate(180deg)" }} />
                    ) : (
                      <IoIosArrowDown />
                    )}
                  </span>
                </button>
              </div>
              {open === 4 && (
                <div className="px-4 py-2 text-teal-700">
                  <p>{`${shopAddress?.addressLines || ""} ${shopAddress?.locality || ""} ${shopAddress?.postalCode || ""}`}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="h-full w-full px-2 flex flex-col md:col-span-3 md:col-start-1 md:row-span-6 md:row-start-8 lg:row-span-5 lg:col-span-2 lg:row-start-2 rounded-2xl bg-white">
          <div className="flex justify-center py-2 border-b-2">
            <p className="text-xl font-medium">By searching on Google</p>
          </div>
          <PieChartSection
            activeIndex={activeIndexSearch}
            data={googleSearchData}
            onPieEnter={onPieEnterSearch}
          />
        </div>
        <div className="h-full w-full px-2 flex flex-col md:col-span-3 md:row-span-6 md:row-start-8 md:col-start-4 lg:row-span-5 lg:col-span-2 lg:col-start-3  lg:row-start-2 md:row-start-8 rounded-2xl bg-white">
          <div className="flex justify-center py-2 border-b-2">
            <p className="text-xl font-medium">By using Google map service</p>
          </div>
          <PieChartSection
            activeIndex={activeIndexMap}
            data={googleMapData}
            onPieEnter={onPieEnterMap}
          />
        </div>
        <div className="md:row-start-14 md:row-span-6 md:col-span-6 lg:col-span-4 lg:row-span-4 lg:row-start-7 rounded-2xl p-2 bg-white">
          <KeywordsAnalytics locationId={locationId} />
        </div>
        <div className="md:row-start-2 md:col-span-3 md:row-span-6 md:col-start-4 lg:row-start-7 lg:col-span-2 lg:row-span-4 lg:col-start-5  rounded-2xl p-2 bg-white">
          <TotalInteractions webCallCount={webCallCount} />
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

export default Panel;
