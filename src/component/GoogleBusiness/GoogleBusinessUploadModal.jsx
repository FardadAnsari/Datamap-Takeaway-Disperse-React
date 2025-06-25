import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { IoMdClose } from "react-icons/io";
import { IoCloudUploadOutline } from "react-icons/io5";
import { FaFilePdf, FaImage, FaRegTrashAlt } from "react-icons/fa";
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
  const [currentIndexes, setCurrentIndexes] = useState({
    All: 0,
    COVER: 0,
    LOGO: 0,
    MENU: 0,
    ADDITIONAL: 0,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteMedia, setPendingDeleteMedia] = useState(null);

  const normalizeCategory = (raw) => {
    const cat = raw?.toUpperCase?.() || "";
    if (cat === "PROFILE") return "LOGO";
    if (["COVER", "LOGO", "MENU", "ADDITIONAL"].includes(cat)) return cat;
    return "ADDITIONAL";
  };

  const formatCategory = (cat) =>
    cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();

  const getFilteredMedia = () =>
    mediaFilter === "All"
      ? fetchedMedias
      : fetchedMedias.filter(
          (file) =>
            normalizeCategory(file.locationAssociation?.category) ===
            mediaFilter
        );

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
      // console.log(response.data);
    } catch (error) {
      console.error("Error fetching media files:", error);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (activeTab === "viewfiles") {
      fetchFiles();
    }
  }, [activeTab, accountId, locationId, accessToken]);

  // When delete icon is clicked
  const handleAskDelete = () => {
    const currentMedia = getFilteredMedia()[currentIndexes[mediaFilter]];
    if (!currentMedia) return;
    setPendingDeleteMedia(currentMedia);
    setShowDeleteConfirm(true);
  };

  // When "Yes, Delete" is confirmed
  const confirmDelete = async () => {
    if (!pendingDeleteMedia) return;
    const mediaId = pendingDeleteMedia.name.split("/").pop();

    try {
      await instance.delete(
        `/api/v1/google/media/${accountId}/${locationId}/${mediaId}/delete/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      await fetchFiles();
      setCurrentIndexes((prev) => ({
        ...prev,
        [mediaFilter]: 0,
      }));
    } catch (error) {
      console.error("Failed to delete media:", error);
      alert("Error deleting media.");
    } finally {
      setShowDeleteConfirm(false);
      setPendingDeleteMedia(null);
    }
  };

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
      console.error(error);
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

  const goToPrev = () => {
    const filtered = getFilteredMedia();
    setCurrentIndexes((prev) => ({
      ...prev,
      [mediaFilter]:
        prev[mediaFilter] === 0 ? filtered.length - 1 : prev[mediaFilter] - 1,
    }));
  };

  const goToNext = () => {
    const filtered = getFilteredMedia();
    setCurrentIndexes((prev) => ({
      ...prev,
      [mediaFilter]:
        prev[mediaFilter] === filtered.length - 1 ? 0 : prev[mediaFilter] + 1,
    }));
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
                if (tab === "viewfiles") setMediaFilter("All");
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
            <div className="flex gap-4 mb-4 text-sm text-gray-800">
              {[
                { value: "COVER", label: "Cover" },
                { value: "LOGO", label: "Logo" },
                { value: "MENU", label: "Menu" },
                { value: "ADDITIONAL", label: "Additional" },
              ].map(({ value, label }) => (
                <label
                  key={value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="media-category"
                    value={value}
                    checked={activeCategory === value}
                    onChange={() => setActiveCategory(value)}
                    className="form-radio text-orange-500 focus:ring-orange-500"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <div className="border-2 border-dashed border-gray-300 p-6 text-center rounded-md">
              <div className="flex justify-center items-center mb-3">
                <IoCloudUploadOutline size={40} className="text-gray-500" />
              </div>
              <p className="text-sm mb-2">
                Choose a file or drag & drop it here.
                <br />
                JPEG, JPG, PNG, up to 20 MB.
              </p>
              <label className="inline-block border mt-4 text-sm px-4 py-2 rounded cursor-pointer hover:bg-gray-100 transition">
                Browse File
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
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

        {/* Delete Confirmation */}

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm text-center">
              <p className="text-gray-800 text-sm mb-4">
                Are you sure you want to delete this photo?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={confirmDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPendingDeleteMedia(null);
                  }}
                  className="border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-100"
                >
                  No, Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Tab */}
        {activeTab === "viewfiles" && (
          <>
            <div className="flex gap-2 mb-4 overflow-x-auto text-sm">
              {["All", "COVER", "LOGO", "MENU", "ADDITIONAL"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setMediaFilter(cat);
                    setCurrentIndexes((prev) => ({ ...prev, [cat]: 0 }));
                  }}
                  className={`px-3 py-1 rounded-full border whitespace-nowrap ${
                    mediaFilter === cat
                      ? "bg-orange-500 text-white"
                      : "text-gray-600"
                  }`}
                >
                  {formatCategory(cat)}
                </button>
              ))}
            </div>

            {loadingFiles ? (
              <p className="text-center text-sm text-gray-500">
                Loading files...
              </p>
            ) : getFilteredMedia().length === 0 ? (
              <p className="text-center text-sm text-gray-500">
                No media found.
              </p>
            ) : (
              <div className="relative w-full h-64 bg-gray-100 rounded overflow-hidden">
                <div className="w-full h-full flex justify-center items-center">
                  <img
                    src={
                      getFilteredMedia()[currentIndexes[mediaFilter]]?.googleUrl
                    }
                    alt={
                      getFilteredMedia()[currentIndexes[mediaFilter]]
                        ?.fileName || "Image"
                    }
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                {/* Delete button */}
                <button
                  onClick={handleAskDelete}
                  className="absolute top-2 right-2 bg-red-100 hover:bg-red-200 text-white p-1 text-xs rounded shadow"
                >
                  <FaRegTrashAlt color="red" size={16} />
                </button>

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
                  {getFilteredMedia().map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() =>
                        setCurrentIndexes((prev) => ({
                          ...prev,
                          [mediaFilter]: idx,
                        }))
                      }
                      className={`w-2 h-2 rounded-full ${
                        idx === currentIndexes[mediaFilter]
                          ? "bg-black"
                          : "bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.getElementById("modal-root"));
};

export default GoogleBusinessUploadModal;
