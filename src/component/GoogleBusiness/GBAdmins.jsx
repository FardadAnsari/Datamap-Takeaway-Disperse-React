import { useEffect, useState } from "react";
import { ThreeDots } from "react-loader-spinner";
import { toast } from "react-toastify";
import AddAdminModal from "./AddAdminModal";
import instance from "../../api/api";
import { useUser } from "../../api/userPermission";
import { FaRegTrashAlt } from "react-icons/fa";

const Loader = ({ className = "", size = 30 }) => (
  <div className={`grid place-items-center ${className}`}>
    <ThreeDots
      visible
      height={size}
      width={size}
      color="#ffa500"
      radius="9"
      ariaLabel="loading"
    />
  </div>
);

// extract the adminId from ".../admins/<id>"
const getAdminIdFromName = (name) => {
  if (!name) return null;
  const m = String(name).match(/\/admins\/([^/]+)$/);
  return m ? m[1] : String(name).split("/").pop();
};

export default function GBAdmins({ isOpen, locationId }) {
  const { user } = useUser();
  const accessToken = sessionStorage.getItem("accessToken");

  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchAdmins = async (signal) => {
    if (!locationId) return;
    try {
      setIsLoading(true);
      const res = await instance.get(
        `api/v1/google/admins/location/${locationId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal,
        }
      );
      setAdmins(res?.data?.admins || []);
    } catch (err) {
      if (err.name !== "AbortError" && err.name !== "CanceledError") {
        console.error(err);
        toast.error("Failed to load admins.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !locationId) return;
    const controller = new AbortController();
    fetchAdmins(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, locationId]);

  const handleAddAdmin = async ({ email, role }) => {
    try {
      setIsSubmitting(true);

      const payload = {
        location_id: String(locationId),
        admin: email, // not { email }
        role, // not { role }
      };

      // POST to the collection endpoint (no :locationId in path)
      await instance.post(`api/v1/google/admins/location/`, payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      toast.success("Admin added.");
      await fetchAdmins(); // reload to get canonical `name` with adminId
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.detail || "Failed to add admin.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (adminObj) => {
    const adminId = getAdminIdFromName(adminObj?.name);
    const email = adminObj?.admin;
    if (!adminId) return;

    if (!window.confirm(`Remove admin ${email || adminId}?`)) return;

    try {
      setDeletingId(adminId);
      // If your API expects adminId in the path:
      await instance.delete(
        `api/v1/google/admins/location/${locationId}/${adminId}/`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      // remove locally by id
      setAdmins((prev) =>
        prev.filter((a) => getAdminIdFromName(a?.name) !== adminId)
      );
      toast.success("Admin removed.");
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.detail || "Failed to remove admin.";
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* panel */}
      <div className="fixed bottom-24 right-8 w-64 bg-white rounded-xl shadow-2xl border z-[1000] overflow-hidden">
        <div className="max-h-72 overflow-auto">
          {isLoading ? (
            <Loader className="py-6" />
          ) : admins.length ? (
            admins.map((a, i) => {
              const adminId = getAdminIdFromName(a?.name);
              return (
                <div
                  key={i}
                  className="px-4 py-3 border-b last:border-0 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {a?.admin}
                    </div>
                    <div className="text-xs text-gray-500">
                      {a?.role || "Admin"}
                    </div>
                  </div>

                  {user?.access?.gbAdminList && (
                    <button
                      type="button"
                      onClick={() => handleDeleteAdmin(a)}
                      disabled={deletingId === adminId}
                      className="text-red-600 hover:text-red-700 text-xs font-semibold disabled:opacity-60"
                      title="Remove admin"
                    >
                      {deletingId === adminId ? (
                        "..."
                      ) : (
                        <FaRegTrashAlt size={16} />
                      )}
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="px-4 py-4 text-sm text-gray-500">
              No admins found.
            </div>
          )}
        </div>
      </div>

      {/* add button */}
      {user.access.gbAdminList && (
        <button
          className="fixed bottom-10 right-28 w-40 p-2 z-[1000] overflow-hidden bg-orange-500 hover:bg-orange-600 rounded-lg text-white text-center disabled:opacity-60"
          onClick={() => setShowAddModal(true)}
          disabled={!locationId}
        >
          Add New Admin
        </button>
      )}

      {/* modal */}
      <AddAdminModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddAdmin}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
