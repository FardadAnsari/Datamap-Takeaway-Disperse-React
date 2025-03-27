export const parseType1 = (item, company) => {
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
    },
  };
};

export const parseType2 = (item, company) => {
  const lon = parseFloat(item.Longitude);
  const lat = parseFloat(item.Latitude);
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
      shopName: item.Account_Name,
      company: company.name,
      postcode: item.Billing_Code,
      rating: item.Rating,
      phone: item.Phone,
      color: company.color,
    },
  };
};

export const parseGoogleBusiness = (item, company) => {
  if (
    !item.latlng ||
    typeof item.latlng.longitude === "undefined" ||
    typeof item.latlng.latitude === "undefined"
  ) {
    // console.warn(
    //   `Location data missing for shop_id: ${item.shop_id || "Unknown"}`
    // );
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

export const transformData = (items, company) => {
  const transformed = items
    .map((item) => {
      switch (company.type) {
        case "type1":
          return parseType1(item, company);
        case "type2":
          return parseType2(item, company);
        case "type3":
          return parseGoogleBusiness(item, company);
        default:
          // console.warn(`company type unknown: ${company.type}`);
          return null;
      }
    })
    .filter((item) => item !== null);

  console.log(`Transformed data for ${company.name}:`, transformed);
  return transformed;
};
