import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { IoMdClose } from "react-icons/io";
import { FaFilePdf, FaImage } from "react-icons/fa";
import instance from "../../api/api";

const GoogleBusinessUploadModal = ({
  isOpen,
  onClose,
  locationId,
  selectedAcc,
}) => {
  const accessToken = sessionStorage.getItem("accessToken");
  const accountId = selectedAcc.value.split("/")[1];

  const [activeTab, setActiveTab] = useState("uploadfiles");
  const [activeCategory, setActiveCategory] = useState("COVER");
  const [uploads, setUploads] = useState([]);

  const [fetchedMedias, setFetchedMedias] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [mediaFilter, setMediaFilter] = useState("All");

  const [currentIndex, setCurrentIndex] = useState(0); // for custom carousel

  useEffect(() => {
    if (activeTab === "viewfiles") {
      const fetchFiles = async () => {
        setLoadingFiles(true);
        try {
          const response = await instance.get(
            `/api/v1/google/media/${accountId}/${locationId}/`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          setFetchedMedias(response.data || []);
        } catch (error) {
          console.error("Error fetching media files:", error);
        } finally {
          setLoadingFiles(false);
        }
      };

      fetchFiles();
    }
  }, [activeTab, accountId, locationId, accessToken]);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);

    const newUploads = files.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: "uploading",
      progress: 0,
    }));

    setUploads((prev) => [...prev, ...newUploads]);

    newUploads.forEach((upload) => uploadFile(upload));
  };

  const uploadFile = async (upload) => {
    const formData = new FormData();
    formData.append("media", upload.file);
    formData.append("category", activeCategory.toUpperCase());

    try {
      const response = await instance.post(
        `api/v1/google/media/${accountId}/${locationId}/upload/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploads((prev) =>
              prev.map((u) =>
                u.name === upload.name ? { ...u, progress: percent } : u
              )
            );
          },
        }
      );

      const success = response.status >= 200 && response.status < 300;
      setUploads((prev) =>
        prev.map((u) =>
          u.name === upload.name
            ? { ...u, status: success ? "completed" : "failed", progress: 100 }
            : u
        )
      );
    } catch (error) {
      setUploads((prev) =>
        prev.map((u) =>
          u.name === upload.name ? { ...u, status: "failed" } : u
        )
      );
    }
  };

  const retryUpload = (fileObj) => {
    const updated = { ...fileObj, status: "uploading", progress: 0 };
    setUploads((prev) =>
      prev.map((f) => (f.name === fileObj.name ? updated : f))
    );
    uploadFile(updated);
  };

  const removeFile = (index) => {
    setUploads((prev) => prev.filter((_, i) => i !== index));
  };

  const filteredMedia = fetchedMedias.filter((file) =>
    mediaFilter === "All" ? true : file.category === mediaFilter
  );

  const goToPrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? filteredMedia.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) =>
      prev === filteredMedia.length - 1 ? 0 : prev + 1
    );
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-xl mx-4 rounded-lg shadow-lg relative p-6">
        <p className="text-xl font-bold pb-4">Google Business Media</p>
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-xl"
          onClick={onClose}
        >
          <IoMdClose />
        </button>

        {/* Tabs */}
        <div className="flex mb-4 bg-gray-100 rounded overflow-hidden">
          {["uploadfiles", "viewfiles"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === "viewfiles") {
                  setMediaFilter("All");
                  setCurrentIndex(0);
                }
              }}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === tab ? "bg-black text-white" : "text-gray-700"
              }`}
            >
              {tab === "uploadfiles" ? "Upload Files" : "View Files"}
            </button>
          ))}
        </div>

        {/* Upload Tab */}
        {activeTab === "uploadfiles" && (
          <>
            <div className="flex gap-2 mb-4 text-sm">
              {["COVER", "LOGO", "MENU", "ADDITIONAL"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-full border ${
                    activeCategory === cat
                      ? "bg-black text-white"
                      : "text-gray-600"
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="border-2 border-dashed border-gray-300 p-6 text-center rounded-md">
              <p className="text-sm mb-2">
                Choose a file or drag & drop it here.
                <br />
                JPEG, PNG, PDF, MP4 up to 50 MB.
              </p>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.mp4"
                onChange={handleFileUpload}
                className="mx-auto mt-2"
              />
            </div>

            {uploads.length > 0 && (
              <div className="mt-4 space-y-2">
                {uploads.map((upload, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded shadow text-sm space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {upload.type.includes("pdf") ? (
                          <FaFilePdf className="text-red-500" />
                        ) : (
                          <FaImage className="text-blue-500" />
                        )}
                        <span className="truncate max-w-[140px]">
                          {upload.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {upload.status === "uploading" && (
                          <span className="text-yellow-600">Uploading...</span>
                        )}
                        {upload.status === "completed" && (
                          <span className="text-green-600">✔ Completed</span>
                        )}
                        {upload.status === "failed" && (
                          <div className="flex items-center gap-2 text-red-600">
                            ✖ Failed
                            <button
                              onClick={() => retryUpload(upload)}
                              className="underline text-xs"
                            >
                              Try Again
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-black"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {upload.status === "uploading" && (
                      <div className="mt-1">
                        <div className="w-full bg-gray-200 h-2 rounded">
                          <div
                            className="bg-yellow-500 h-2 rounded"
                            style={{ width: `${upload.progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-right text-yellow-600">
                          {upload.progress}%
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* View Tab */}
        {activeTab === "viewfiles" && (
          <>
            <div className="flex gap-2 mb-4 overflow-x-auto text-sm">
              {[
                "All",
                "COVER",
                "MENU",
                "FOOD & DRINK",
                "VIBE",
                "COMFORT FOOD",
              ].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setMediaFilter(cat);
                    setCurrentIndex(0);
                  }}
                  className={`px-3 py-1 rounded-full border whitespace-nowrap ${
                    mediaFilter === cat
                      ? "bg-orange-500 text-white"
                      : "text-gray-600"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {loadingFiles ? (
              <p className="text-center text-sm text-gray-500">
                Loading files...
              </p>
            ) : filteredMedia.length === 0 ? (
              <p className="text-center text-sm text-gray-500">
                No media found.
              </p>
            ) : (
              <div className="relative w-full h-64 bg-gray-100 rounded overflow-hidden">
                <div className="w-full h-full flex justify-center items-center">
                  <img
                    src={filteredMedia[currentIndex].sourceUrl}
                    alt={filteredMedia[currentIndex].fileName || "Image"}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <button
                  onClick={goToPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black text-white p-2 rounded-full z-10"
                >
                  ‹
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black text-white p-2 rounded-full z-10"
                >
                  ›
                </button>

                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                  {filteredMedia.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-2 h-2 rounded-full ${
                        idx === currentIndex ? "bg-black" : "bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            className="px-4 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.getElementById("modal-root"));
};

export default GoogleBusinessUploadModal;
