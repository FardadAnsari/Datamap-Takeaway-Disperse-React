// Parses companies' data except Mealzo item into GeoJSON format
export const parseCompanies = (item, company) => {
  const lon = parseFloat(item.longitude);
  const lat = parseFloat(item.latitude);
  if (isNaN(lat) || isNaN(lon)) return null;

  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [lon, lat],
    },
    properties: {
      cluster: false,
      shop_id: item.id || `${company.id}-${lon}-${lat}`,
      shopName: item.shop_name,
      company: company.name,
      address: item.address,
      postcode: item.postcode,
      cuisines: item.cuisines,
      googlemap: item.map_url,
      rating: item.rating,
      totalReviews: item.total_reviews,
      phone: item.phone,
      description: item.description,
      color: company.color,
      lastUpdate: item.last_update,
      companyPage: item.shop_url_company,
      website: item.website,
    },
  };
};

// Parses a Mealzo company item into GeoJSON format
export const parseMealzo = (item, company) => {
  const lon = parseFloat(item.Longitude);
  const lat = parseFloat(item.Latitude);
  if (
    isNaN(lat) ||
    isNaN(lon) ||
    String(item.Account_Status).toLowerCase() !== "active"
  )
    return null;

  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [lon, lat],
    },
    properties: {
      cluster: false,
      shop_id: item.id || `${company.id}-${lon}-${lat}`,
      shopName: item.Account_Name,
      company: company.name,
      postcode: item.Billing_Code,
      rating: item.Rating,
      phone: item.Phone,
      color: company.color,
    },
  };
};

// Parses a Google Business item into GeoJSON format
export const parseGoogleBusiness = (item, company) => {
  if (
    !item.latlng ||
    typeof item.latlng.longitude === "undefined" ||
    typeof item.latlng.latitude === "undefined"
  ) {
    // console.warn(`Location data missing for shop_id: ${item.shop_id || "Unknown"}`);
    return null;
  }
  const lon = parseFloat(item.latlng.longitude);
  const lat = parseFloat(item.latlng.latitude);
  if (isNaN(lat) || isNaN(lon)) {
    console.warn(
      `Invalid coordinates for shop_id: ${item.shop_id || "Unknown"}`
    );
    return null;
  }

  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [lon, lat],
    },
    properties: {
      cluster: false,
      shop_id: item.shop_id || `${company.id}-${lon}-${lat}`,
      shopName: item.title,
      company: company.name,
      address: `${item?.storefrontAddress.addressLines || ""} ${item?.storefrontAddress.locality || ""}`,
      postcode: item.storefrontAddress.postalCode,
      cuisines: item.categories.primaryCategory.displayName,
      website: item.websiteUri,
      googlemap: item.metadata.mapsUri,
      phone: item.phoneNumbers.primaryPhone,
      canDelete: item.metadata.canDelete,
      canHaveFoodMenus: item.metadata.canHaveFoodMenus,
      hasGoogleUpdated: item.metadata.hasGoogleUpdated,
      hasVoiceOfMerchant: item.metadata.hasVoiceOfMerchant,
      newReviewUri: item.metadata.newReviewUri,
      description: item.description,
      color: company.color,
      locationId: item.name.split("/")[1],
    },
  };
};

// Parses a Facebook page item into GeoJSON format
export const parseFacebook = (item, company) => {
  const lon = parseFloat(item.page_location_longitude);
  const lat = parseFloat(item.page_location_latitude);

  if (isNaN(lat) || isNaN(lon)) {
    // console.warn(`Invalid or missing coordinates for page_id: ${item.page_id || "Unknown"}`);
    return null;
  }

  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [lon, lat],
    },
    properties: {
      cluster: false,
      shop_id: item.page_id || `${company.id}-${lon}-${lat}`,
      shopName: item.page_name,
      company: company.name,
      address: item?.page_location_street || "",
      postcode: item.page_location_postcode || "",
      categories: item.page_categories || "",
      description: item.description || "",
      color: company.color,
      pageId: item.page_id,
      postId: item.page_last_post_id,
      pageRole: item.page_roles_name || "",
      phone: item.page_phone || "",
      website: item.page_website || "",
    },
  };
};

// Transforms a list of items from different company types into GeoJSON features
export const transformData = (items, company) => {
  const transformed = items
    .map((item) => {
      switch (company.type) {
        case "type1":
          return parseCompanies(item, company);
        case "type2":
          return parseMealzo(item, company);
        case "type3":
          return parseGoogleBusiness(item, company);
        case "type4":
          return parseFacebook(item, company);
        default:
          console.warn(`company type unknown: ${company.type}`);
          return null;
      }
    })
    .filter((item) => item !== null);

  // console.log(`Transformed data for ${company.name}:`, transformed);
  return transformed;
};
