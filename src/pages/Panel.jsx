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
import { useNavigate, useParams } from "react-router-dom";
import PhoneNumberEdit from "../component/PhoneNumberEdit";
import ShopNameEdit from "../component/ShopNameEdit";
import WebSiteUriEdit from "../component/WebSiteUriEdit";
import { toast, ToastContainer } from "react-toastify";

const Panel = () => {
  const { watch: watchFilter } = useForm();

  const { locationId } = useParams();

  const [open, setOpen] = useState(null);
  const [editOpen, setEditOpen] = useState(null);
  const [shopTitle, setShopTitle] = useState("");

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

  const selectedBusInfo = watchFilter("businessInformation");

  const [shopActivityStatus, setShopActivityStatus] = useState("");

  useEffect(() => {
    instance
      .get(`/api/v1/google/get-title/${locationId}`)
      .then((response) => {
        console.log(response.data.location.title);

        setShopTitle(response.data.location.title);
        console.log(shopTitle);
      })
      .catch();
  }, [locationId]);

  useEffect(() => {
    instance
      .get(`api/v1/google/get-update-openstatus/${locationId}`)
      .then((response) => {
        setShopActivityStatus(response.data.location.openInfo.status);
      })
      .catch();
  }, [locationId]);

  useEffect(() => {
    const fetchVerificationData = async () => {
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
    };

    fetchVerificationData();
  }, [locationId]);

  const [isVerified, setIsVerified] = useState(true);

  const [shopPhone, setShopPhone] = useState();
  const [shopAddress, setShopAddress] = useState();
  const [weburl, setWeburl] = useState();

  useEffect(() => {
    setIsVerified(true);

    instance
      .get(`api/v1/google/get-shop-attribute/${locationId}`)
      .then((response) => {
        setShopPhone(response.data.location.phoneNumbers);
        setShopAddress(response.data.location.storefrontAddress);
        setWeburl(response.data.location.websiteUri);
      });
  }, [locationId]);

  const [isLoadingSearchCount, setIsLoadingSearchCount] = useState(false);
  const [searchCount, setSearchCount] = useState({});

  useEffect(() => {
    const fetchSearchData = async () => {
      setIsLoadingSearchCount(false);

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
  }, []);

  const [isLoadingMapCount, setIsLoadingMapCount] = useState(false);
  const [mapCount, setMapCount] = useState({});

  useEffect(() => {
    const fetchMapData = async () => {
      setIsLoadingMapCount(false);

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
  const [webCallCount, setWebCallCount] = useState({});

  useEffect(() => {
    const fetchWebCallData = async () => {
      setIsLoadingWebCallCount(false);

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
  }, [locationId]);

  return (
    <div className="font-sans bg-yellow-50">
      <div className="flex justify-between px-12 py-6 mb-6 border-solid bg-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-cover bg-center bg-google-business"></div>
          <p className="text-xl md:text-2xl lg:text-3xl font-medium text-teal-700 m-0">
            Google Business Dashboard
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 mx-4 lg:mx-6 md:grid md:grid-cols-6 md:grid-rows-27 lg:grid lg:grid-cols-6 lg:grid-rows-8">
        <DialogDefault
          open={!isVerified}
          setClose={setIsVerified}
          message={"This Bussiness is not verified yet!"}
        />
        <div className="md:col-span-3 md:row-span-6 md:row-start-2 md:col-start-1 lg:col-span-2 lg:row-span-5 lg:col-start-5 rounded-2xl bg-white shadow-md">
          <div className="flex flex-col px-4 pt-4">
            <div className="h-10 flex gap-2 justify-between items-center border-gray-600 border-b-2 pb-4">
              <>
                {editOpen === 4 ? (
                  <ShopNameEdit locationId={locationId} shopName={shopTitle} />
                ) : (
                  <p>{shopTitle}</p>
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
        <div className="h-full w-full px-2 flex flex-col md:col-span-3 md:col-start-1 md:row-span-6 md:row-start-8 lg:row-span-5 lg:col-span-2 lg:row-start-1 rounded-2xl bg-white shadow-md">
          <div className="flex justify-center py-2 border-b-2">
            <p className="text-xl font-medium">By searching on Google</p>
          </div>
          <PieChartSection
            activeIndex={activeIndexSearch}
            data={googleSearchData}
            onPieEnter={onPieEnterSearch}
          />
        </div>
        <div className="h-full w-full px-2 flex flex-col md:col-span-3 md:row-span-6 md:row-start-8 md:col-start-4 lg:row-span-5 lg:col-span-2 lg:col-start-3 lg:row-start-1 md:row-start-8 rounded-2xl bg-white shadow-md">
          <div className="flex justify-center py-2 border-b-2">
            <p className="text-xl font-medium">By using Google map service</p>
          </div>
          <PieChartSection
            activeIndex={activeIndexMap}
            data={googleMapData}
            onPieEnter={onPieEnterMap}
          />
        </div>
        <div className="md:row-start-14 md:row-span-6 md:col-span-6 lg:col-span-4 lg:row-span-5 lg:row-start-6 rounded-2xl p-2 bg-white shadow-md">
          <KeywordsAnalytics locationId={locationId} />
        </div>
        <div className="md:row-start-2 md:col-span-3 md:row-span-6 md:col-start-4 lg:row-start-6 lg:col-span-2 lg:row-span-5 lg:col-start-5  rounded-2xl p-2 bg-white shadow-md">
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
