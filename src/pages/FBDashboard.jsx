import { useEffect, useState } from "react";
import instanceF from "../api/facebook";
import { useParams } from "react-router-dom";
import { HiMiniLink, HiOutlineEnvelope } from "react-icons/hi2";
import { GrLocation } from "react-icons/gr";
import { PiPhone } from "react-icons/pi";
import { GoDotFill } from "react-icons/go";
import { AiOutlineLike } from "react-icons/ai";
import { FaRegComment } from "react-icons/fa";
import { PiShareFatLight } from "react-icons/pi";
import LineChartComponent from "../component/Facebook/LineChartComponent";

const FBDashboard = () => {
  const [error, setError] = useState("");
  const [pageInfoData, setPageInfoData] = useState(null);
  const [postId, setPostId] = useState(null);
  const [postInfoData, setPostInfoData] = useState(null);
  const [pageImpressionPaid, setPageImpressionPaid] = useState(null);
  const [pageImpressionUnique, setPageImpressionUnique] = useState(null);
  const [pageImpressionTotal, setPageImpressionTotal] = useState(null);

  const { Id } = useParams();
  console.log(Id);
  const parts = Id.split("_");
  const pageId = parts[0];

  const accessToken = sessionStorage.getItem("accessToken");
  useEffect(() => {
    instanceF
      .get(`/facebook/fb-info/${pageId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        setPageInfoData(response.data);
        setPostId(response.data.live_post);
        console.log(response.data);
      })
      .catch((error) => {
        console.log(error);
        setError("Failed to load page info. Please try again later.");
      });
  }, [pageId]);

  const dayMap = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday",
  };

  const formatHours = (day, hours) => {
    const ranges = [];
    let index = 1;

    while (true) {
      const openKey = `${day}_${index}_open`;
      const closeKey = `${day}_${index}_close`;

      const open = hours[openKey];
      const close = hours[closeKey];

      if (!open || !close) break;

      ranges.push(`${open} - ${close}`);
      index++;
    }

    return ranges.length > 0 ? ranges.join(" - ") : "Closed";
  };

  useEffect(() => {
    if (!postId) return;

    instanceF
      .get(`/facebook/fb-post-info/${postId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        setPostInfoData(response.data);
        console.log(response.data);
        console.log(response.status);
        console.log(response.data.attachments.data[0].media_type);
      })
      .catch((error) => {
        if (error.response && error.response.status === 404 && Id) {
          // Try fallback request using `Id`
          instanceF
            .get(`/facebook/fb-post-info/${Id}`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            })
            .then((response) => {
              setPostInfoData(response.data);
              console.log(response.data);
              console.log(response.data.attachments.data[0].media_type);
            })
            .catch((error) => {
              console.log(error);
              setError("Failed to load page info using fallback ID.");
            });
        } else {
          console.log(error);
          setError("Failed to load page info. Please try again later.");
        }
      });
  }, [postId, Id]);

  useEffect(() => {
    instanceF
      .get(`/facebook/page-impressions-paid/${pageId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        console.log(response.data);
        setPageImpressionPaid(
          response.data.values.map((entry) => ({
            name: entry.end_time,
            pv: entry.value,
          }))
        );
      })
      .catch((error) => {
        console.log(error);
        setError(
          "Failed to load page impression paid data. Please try again later."
        );
      });
  }, [pageId]);

  useEffect(() => {
    instanceF
      .get(`/facebook/page-impressions-unique/${pageId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        console.log(response.data);
        setPageImpressionUnique(
          response.data.values.map((entry) => ({
            name: entry.end_time,
            pv: entry.value,
          }))
        );
      })
      .catch((error) => {
        console.log(error);
        setError(
          "Failed to load page impression unique data. Please try again later."
        );
      });
  }, [pageId]);

  useEffect(() => {
    instanceF
      .get(`/facebook/page-impressions-total/${pageId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        console.log(response.data);
        setPageImpressionTotal(
          response.data.values.map((entry) => ({
            name: entry.end_time,
            pv: entry.value,
          }))
        );
      })
      .catch((error) => {
        console.log(error);
        setError(
          "Failed to load page impression total data. Please try again later."
        );
      });
  }, [pageId]);

  return (
    <div className="h-screen p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="flex flex-col gap-4 h-full">
        {/* Shop Profile */}
        <div className="border rounded-2xl p-4 shadow bg-white h-[365px]">
          {/* Cover Image */}
          <div className="w-full h-64 mb-3 relative">
            <img
              src={
                pageInfoData?.cover?.source ||
                "https://via.placeholder.com/600x200"
              }
              alt="Cover"
              className="w-full h-full bg-cover rounded-xl"
            />
            {/* Profile Picture */}
            <div className="absolute -bottom-16 left-6">
              <img
                src={
                  pageInfoData?.picture?.data?.url ||
                  "https://via.placeholder.com/100"
                }
                alt="Logo"
                className="w-28 h-28 rounded-full border-4 border-white shadow-md"
              />
            </div>
          </div>

          {/* Page Info */}
          <div className="flex flex-col justify-between ml-40 gap-1">
            <h2 className="text-xl font-bold">{pageInfoData?.page_name}</h2>
            <div className="flex gap-1 items-center">
              <p className="text-sm text-gray-500">
                {pageInfoData?.fan_count
                  ? `${pageInfoData?.fan_count} 
              Likes`
                  : "0 Likes"}
              </p>
              <GoDotFill color="gray" size={10} />
              <p className="text-sm text-gray-500">
                {pageInfoData?.followers_count
                  ? `${pageInfoData.followers_count} Followers`
                  : "0 Followers"}
              </p>
            </div>
          </div>
        </div>
        {/* Shop Info */}
        <div className="h-fit border rounded-2xl p-4 shadow">
          <div className="text-md text-gray-700 space-y-2">
            <div className="flex justify-between">
              <h3 className="font-semibold mb-1">Shop Info:</h3>
              <div>
                <span className="font-semibold mb-1">Page Creator: </span>
                <span>{pageInfoData?.business?.name}</span>
              </div>
            </div>
            <div className="flex gap-1 items-first">
              <span>
                <GrLocation size={17} />
              </span>
              <p>
                {`${pageInfoData?.location?.street}, ${pageInfoData?.location?.city}, ${pageInfoData?.location?.country}`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <span>
                <PiPhone size={18} />
              </span>
              <p>{`${pageInfoData?.phone}`}</p>
            </div>
            <div className="flex items-center gap-1">
              <span>
                <HiOutlineEnvelope size={17} />
              </span>
              <p>{`${pageInfoData?.location?.zip}`}</p>
            </div>
            <div className="flex items-center gap-1">
              <span>
                <HiMiniLink size={18} />
              </span>
              <a
                target="_blank"
                href={`${pageInfoData?.website}`}
                className="text-blue-500"
              >
                {`${pageInfoData?.website}`}
              </a>
            </div>
          </div>
          <div className="mt-4 border-t pt-2 text-md text-gray-700 space-y-2">
            <span className="font-semibold mb-1">About Shop:</span>
            <p className="text-gray-600 text-md">{pageInfoData?.about}</p>
          </div>
          {pageInfoData?.hours && (
            <div className="mt-4 border-t pt-2 text-md text-gray-700 space-y-2">
              <h4 className="font-semibold mb-1">Opening Hours:</h4>
              {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((day) => {
                const hours = formatHours(day, pageInfoData.hours);
                const isClosed = hours === "Closed";

                return (
                  <div
                    key={day}
                    className={`flex justify-between ${isClosed ? "text-red-500" : ""}`}
                  >
                    <span className="font-medium">{dayMap[day]}:</span> {hours}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* Last Post */}
      <div className="h-fit border rounded-2xl p-4 shadow">
        <div className="flex justify-between">
          <h3 className="text-md text-gray-700 font-semibold mb-2">
            Last Post
          </h3>
          <div className="text-sm">
            <span className="font-semibold text-gray-500">Author: </span>
            <span className="text-gray-700">{postInfoData?.from?.name}</span>
          </div>
        </div>
        <span className="text-sm text-gray-500 mb-2">
          {postInfoData?.created_time}
        </span>
        <p className="text-sm text-gray-700 my-2">{postInfoData?.message}</p>
        {postInfoData?.attachments?.data[0]?.media_type === "photo" && (
          <img
            src={postInfoData?.attachments?.data[0]?.media?.image?.src}
            alt="Post"
            className="w-full h-full rounded-xl mb-2"
          />
        )}
        {postInfoData?.attachments?.data[0]?.media_type === "video" && (
          <video
            controls
            poster={postInfoData?.attachments?.data[0]?.media?.image?.src}
            className="w-full rounded-xl mb-2"
          >
            <source src={postInfoData?.attachments?.data[0]?.media?.source} />
          </video>
        )}
        <div className="flex justify-between text-md text-gray-600 mt-2">
          <div className="flex gap-1">
            <AiOutlineLike size={20} />
            <span>{postInfoData?.reactions?.summary?.total_count}</span>
          </div>
          <div className="flex gap-1">
            <FaRegComment size={18} />
            <span>{postInfoData?.reactions?.summary?.total_count}</span>
          </div>
          <div className="flex gap-1">
            <PiShareFatLight size={20} />
            <span>{postInfoData?.shares?.count}</span>
          </div>
        </div>
      </div>

      <div className="h-fit flex flex-col gap-4">
        {/* Roles and Accesses*/}
        <div className="flex justify-between items-center border rounded-2xl p-4 shadow">
          <p className="text-sm">Accounts & Accesses</p>
          <a href="#" className="text-blue-500 text-sm">
            Click Here
          </a>
        </div>
        {/* Page Impression */}
        <div className="border rounded-2xl p-4 shadow ">
          <div className="h-full flex flex-col items-first justify-start border-b ">
            {/* Page Impression Paid Chart */}
            <h3 className="font-semibold text-gray-700 mb-2 p-2">
              Page Impression Paid
            </h3>
            <LineChartComponent
              data={pageImpressionPaid}
              xKey="name"
              lineKey="pv"
              lineColor="#8884d8"
            />
          </div>
          <div className="h-full flex flex-col items-first justify-start border-b">
            {/* Page Impression Unique Chart */}
            <h3 className="font-semibold text-gray-700 mb-2 px-2 py-4">
              Page Impression Unique
            </h3>
            <LineChartComponent
              data={pageImpressionUnique}
              xKey="name"
              lineKey="pv"
              lineColor="#82ca9d"
            />
          </div>
          <div className="h-full flex flex-col items-first justify-start ">
            {/* Page Impression Total Chart */}
            <h3 className="font-semibold text-gray-700 mb-2 px-2 py-4">
              Page Impression Total
            </h3>
            <LineChartComponent
              data={pageImpressionTotal}
              xKey="name"
              lineKey="pv"
              lineColor="#ffc658"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FBDashboard;
