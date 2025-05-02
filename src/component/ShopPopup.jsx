import { PiPhone } from "react-icons/pi";
import { HiMiniLink, HiOutlineEnvelope } from "react-icons/hi2";
import { ImSpoonKnife } from "react-icons/im";
import { CiStar } from "react-icons/ci";
import { GoCommentDiscussion } from "react-icons/go";
import { MdOutlineUpdate } from "react-icons/md";
import { GrLocation, GrMapLocation } from "react-icons/gr";
import { SlSocialFacebook, SlSocialGoogle } from "react-icons/sl";
import { Link } from "react-router-dom";
import companyIcons from "../assets/checkbox-icon/checkboxIcons";

//  InfoRow renders a label + value row with fallback to "None" if empty.
const InfoRow = ({ icon, label, value }) => (
  <div className="flex justify-between">
    <div className="flex gap-1">
      <span className={value ? "" : "text-gray-400"}>{icon}</span>
      <span className={value ? "" : "text-gray-400"}>{label}</span>
    </div>
    {value && value !== "None" ? (
      <span>{value}</span>
    ) : (
      <span className="text-gray-400">None</span>
    )}
  </div>
);

// LinkRow renders a label + link row, or "None" if the link doesn't exist.
const LinkRow = ({ icon, label, link }) => (
  <div className="flex justify-between">
    <div className="flex gap-1">
      <span className={link ? "" : "text-gray-400"}>{icon}</span>
      <span className={link ? "" : "text-gray-400"}>{label}</span>
    </div>
    {link && link !== "None" ? (
      <a href={link} target="_blank" rel="noreferrer">
        Link
      </a>
    ) : (
      <span className="text-gray-400">None</span>
    )}
  </div>
);

// ShopPopup component renders the content of the Leaflet <Popup> for each shop marker.
const ShopPopup = ({ marker, user }) => {
  // Normalize company key (e.g., "Google Business" => "googlebusiness")
  const companyKey = marker.properties.company
    .replace(/\s+/g, "")
    .toLowerCase();

  // Get icon component based on company name
  const IconComponent = companyIcons[companyKey];

  // Identify platform-specific logic
  const isFacebook = companyKey === "facebook";
  const isGoogleBusiness = companyKey === "googlebusiness";

  return (
    <div className="flex flex-col w-96 py-2 gap-2 pr-4">
      {/* Shop name and icon */}
      <div className="flex gap-2 justify-between">
        <span className="font-bold text-xl">{marker.properties.shopName}</span>
        {IconComponent && <IconComponent width={28} height={28} />}
      </div>

      {/* Divider */}
      <div className="flex w-full items-center py-2">
        <span className="w-2/6">Restaurant Details</span>
        <div className="w-4/6 h-px bg-gray-500"></div>
      </div>

      {/* Info fields */}
      {isFacebook ? (
        <>
          <InfoRow
            icon={<HiOutlineEnvelope size={17} />}
            label="Postcode"
            value={marker.properties.postcode}
          />
          <InfoRow
            icon={<ImSpoonKnife size={15} />}
            label="Category"
            value={marker.properties.categories}
          />
          <InfoRow
            icon={<GrLocation size={17} />}
            label="Address"
            value={marker.properties.address}
          />
        </>
      ) : (
        <>
          <InfoRow
            icon={<PiPhone size={18} />}
            label="Phone No."
            value={marker.properties.phone}
          />
          <InfoRow
            icon={<HiOutlineEnvelope size={17} />}
            label="Postcode"
            value={marker.properties.postcode}
          />
          <InfoRow
            icon={<ImSpoonKnife size={15} />}
            label="Cuisines"
            value={marker.properties.cuisines}
          />
          <InfoRow
            icon={<CiStar size={19} />}
            label="Rating"
            value={marker.properties.rating}
          />
          <InfoRow
            icon={<GoCommentDiscussion size={17} />}
            label="Reviews"
            value={marker.properties.totalReviews}
          />
          <InfoRow
            icon={<MdOutlineUpdate size={18} />}
            label="Last Updated"
            value={marker.properties.lastUpdate}
          />
          <InfoRow
            icon={<GrLocation size={17} />}
            label="Address"
            value={marker.properties.address}
          />
        </>
      )}

      {/* Divider */}
      <div className="flex w-full items-center py-2">
        <span className="w-2/6">Quick Access Links</span>
        <div className="w-4/6 h-px bg-gray-500"></div>
      </div>

      {/* External links */}
      <LinkRow
        icon={<HiMiniLink size={18} />}
        label="Company page"
        link={marker.properties.companyPage}
      />
      <LinkRow
        icon={<HiMiniLink size={18} />}
        label="Website"
        link={marker.properties.website}
      />
      <LinkRow
        icon={<GrMapLocation size={16} />}
        label="Google Maps"
        link={marker.properties.googlemap}
      />

      {/* Show dashboard link if it's a Google Business entry and user has access */}
      {isGoogleBusiness && user?.access?.gbDashboardMap && (
        <div className="flex justify-between">
          <div className="flex gap-1">
            <SlSocialGoogle size={16} />
            <span>Google Business</span>
          </div>
          <Link
            to={`/google-business/${marker.properties.locationId}`}
            target="_blank"
            className="text-white rounded"
          >
            Google Business Dashboard
          </Link>
        </div>
      )}

      {/* Show dashboard link if it's a Google Business entry and user has access */}
      {isFacebook && user?.access?.facebook && (
        <div className="flex justify-between">
          <div className="flex gap-1">
            <SlSocialFacebook size={16} />
            <span>Facebook</span>
          </div>
          <Link
            to={`/facebook/${marker.properties.postId}`}
            target="_blank"
            className="text-white rounded"
          >
            Facebook Dashboard
          </Link>
        </div>
      )}
    </div>
  );
};

export default ShopPopup;
