import { useState } from "react";
import { IoMdClose } from "react-icons/io";
import ShopNameEdit from "./ShopNameEdit";
import WebSiteUriEdit from "./WebSiteUriEdit";
import PhoneNumberEdit from "./PhoneNumberEdit";
import BusinessHoursEdit from "./BusinessHoursEdit";

export default function GoogleBusinessModal({
  isOpen,
  onClose,
  locationId,
  shopTitle,
  webUrl,
  phoneNumber,
  shopAddress,
}) {
  const [activeTab, setActiveTab] = useState("shopInfo");

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 
                 flex items-center justify-center z-50"
    >
      <div className="bg-white w-2/5 h-max mx-4 rounded-lg shadow-lg relative p-6">
        <p className="text-xl font-bold pb-4">Google Business Details</p>
        <button
          className="absolute top-2 right-2 text-gray-600 
                     hover:text-gray-900 text-xl"
          onClick={onClose}
        >
          <IoMdClose />
        </button>

        <div className="mx-4 flex mb-4 bg-gray-50 rounded">
          <button
            className={`flex-1 px-4 py-2 text-center focus:outline-none rounded
              ${
                activeTab === "shopInfo"
                  ? "bg-black text-white"
                  : "text-gray-700"
              }`}
            onClick={() => setActiveTab("shopInfo")}
          >
            Shop Information
          </button>
          <button
            className={`flex-1 px-4 py-2 text-center focus:outline-none rounded
              ${
                activeTab === "openingHours"
                  ? "bg-black text-white"
                  : "text-gray-700"
              }`}
            onClick={() => setActiveTab("openingHours")}
          >
            Opening Hours
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {activeTab === "shopInfo" && (
            <div className="flex flex-col gap-4">
              <ShopNameEdit locationId={locationId} shopName={shopTitle} />
              <WebSiteUriEdit locationId={locationId} webUrl={webUrl} />
              <PhoneNumberEdit
                locationId={locationId}
                phoneNumber={phoneNumber}
              />
              <div>
                <p>Address</p>
                <p className="p-2 bg-gray-100 text-gray-700 rounded">{`${shopAddress?.addressLines || ""} ${shopAddress?.locality || ""} ${shopAddress?.postalCode || ""}`}</p>
              </div>
            </div>
          )}

          {activeTab === "openingHours" && (
            <div>
              <BusinessHoursEdit locationId={locationId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
