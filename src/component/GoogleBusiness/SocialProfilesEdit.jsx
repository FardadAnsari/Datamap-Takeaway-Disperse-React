import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import instance from "../../api/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import EmptyState from "../../general-components/EmptyState"; // ✅ add this

// Icons
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaPinterest,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { SiTiktok } from "react-icons/si";
import { FaRegTrashAlt } from "react-icons/fa";

// ---------- Skeleton line ----------
const SkeletonLine = ({ className = "" }) => (
  <div
    className={`w-full h-4 rounded bg-gray-200/80 animate-pulse ${className}`}
  />
);

const PLATFORM_META = [
  {
    value: "facebook",
    label: "Facebook",
    Icon: FaFacebook,
    placeholder: "https://facebook.com/your-brand",
  },
  {
    value: "instagram",
    label: "Instagram",
    Icon: FaInstagram,
    placeholder: "https://instagram.com/your-brand",
  },
  {
    value: "linkedin",
    label: "LinkedIn",
    Icon: FaLinkedin,
    placeholder: "https://linkedin.com/your-brand",
  },
  {
    value: "youtube",
    label: "YouTube",
    Icon: FaYoutube,
    placeholder: "https://youtube.com/@your-brand",
  },
  {
    value: "x",
    label: "X (Twitter)",
    Icon: FaXTwitter,
    placeholder: "https://x.com/your-brand",
  },
  {
    value: "tiktok",
    label: "TikTok",
    Icon: SiTiktok,
    placeholder: "https://tiktok.com/@your-brand",
  },
  {
    value: "pinterest",
    label: "Pinterest",
    Icon: FaPinterest,
    placeholder: "https://pinterest.com/your-brand",
  },
];

// Treat "twitter" as "x" in API slug
const toApiSlug = (p) => (p === "twitter" ? "x" : p);

// (kept your regex as-is)
const urlRegex =
  /^(https?:\/\/)([\w.-]+)\.([a-z\.]{2,})([\/\w .-]*)*\/?(@[\w.-]+|[\w\-/?.=&%]*)?$/i;

const SocialProfilesEdit = ({ locationId }) => {
  const accessToken = sessionStorage.getItem("accessToken");

  const navigate = useNavigate();
  const [busyIdx, setBusyIdx] = useState(null);
  const [loading, setLoading] = useState(false);
  const [socialProfiles, setSocialProfiles] = useState({});

  // Get Social profiles
  useEffect(() => {
    if (locationId) {
      setLoading(true);
      instance
        .get(`api/v1/google/social/location/${locationId}/social/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => {
          setSocialProfiles(response.data.social);
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => setLoading(false));
    }
  }, [locationId, accessToken]);

  // Convert object -> array for FieldArray
  const initialProfiles = useMemo(() => {
    const entries = Object.entries(socialProfiles || {});
    return entries.map(([platform, url]) => ({ platform, url }));
  }, [socialProfiles]);

  const { control, handleSubmit, getValues } = useForm({
    defaultValues: { profiles: initialProfiles },
    mode: "onBlur",
  });

  const { fields, append, remove, update, replace } = useFieldArray({
    control,
    name: "profiles",
  });

  // Keep original snapshot for per-row dirty comparison
  const originalRef = useRef(initialProfiles);

  useEffect(() => {
    replace(initialProfiles || []);
    originalRef.current = initialProfiles || [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProfiles]);

  const values = useWatch({ control, name: "profiles" }) || [];
  const usedPlatforms = new Set(
    values.map((r) => (r?.platform || "").trim()).filter(Boolean)
  );

  const metaOf = (p) => PLATFORM_META.find((m) => m.value === p);

  // ----- API helpers (PATCH + DELETE per platform) -----
  const upsertProfile = async ({ platform, url }) => {
    const slug = toApiSlug(platform);
    return instance.patch(
      `api/v1/google/social/location/${locationId}/social/${slug}/`,
      { url },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  };

  const deleteProfile = async ({ platform }) => {
    const slug = toApiSlug(platform);
    return instance.delete(
      `api/v1/google/social/location/${locationId}/social/${slug}/`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  };

  const handleAuthError = () => {
    toast.error(
      "Your tokens have been exhausted. Please contact the R&D department to resolve this issue."
    );
    setTimeout(() => navigate("/login"), 5000);
  };

  // ----- Row state helpers -----
  const isRowDirty = (idx) => {
    const cur = values[idx] || {};
    const orig = originalRef.current?.[idx] || {};
    return (
      (cur.platform || "") !== (orig.platform || "") ||
      (cur.url || "") !== (orig.url || "")
    );
  };

  const isRowValid = (idx) => {
    const cur = values[idx] || {};
    return !!cur.platform && !!cur.url && urlRegex.test(cur.url.trim());
  };

  // ----- Actions -----
  const onSaveRow = async (idx) => {
    const row = getValues(`profiles.${idx}`) || {};
    const platform = (row.platform || "").trim();
    const url = (row.url || "").trim();

    if (!platform) return toast.error("Please choose a platform.");
    if (!url) return toast.error("Please enter a URL.");
    if (!urlRegex.test(url))
      return toast.error("Enter a valid URL (http/https).");

    try {
      setBusyIdx(idx);
      const res = await upsertProfile({ platform, url });
      if (res.status >= 200 && res.status < 300) {
        toast.success("Social profile saved.");
        update(idx, { platform, url });
        originalRef.current[idx] = { platform, url };
      } else {
        toast.error("Could not save. Please try again.");
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) handleAuthError();
      else toast.error("Could not save. Please try again.");
    } finally {
      setBusyIdx(null);
    }
  };

  const onDeleteRow = async (idx) => {
    const row = getValues(`profiles.${idx}`) || {};
    const platform = (row.platform || "").trim();

    if (!platform) {
      remove(idx);
      return;
    }

    try {
      setBusyIdx(idx);
      const res = await deleteProfile({ platform });
      if (res.status >= 200 && res.status < 300) {
        toast.success("Social profile deleted.");
        remove(idx);
        originalRef.current.splice(idx, 1);
      } else {
        toast.error("Could not delete. Please try again.");
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) handleAuthError();
      else toast.error("Could not delete. Please try again.");
    } finally {
      setBusyIdx(null);
    }
  };

  const addRowWithPlatform = (platform) => {
    if (usedPlatforms.has(platform)) return;
    append({ platform, url: "" });
    originalRef.current.push({ platform, url: "" });
  };

  const noop = () => {};

  return (
    <div className="w-full space-y-2">
      <div className="text-md">Social Profiles</div>

      {/* Existing rows */}
      <form onSubmit={handleSubmit(noop)}>
        {loading ? (
          // ---------- Skeleton state ----------
          <div className="h-60 divide-y">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 p-3">
                <div className="w-10 h-10 rounded-lg bg-gray-200/80 animate-pulse shrink-0" />
                <div className="flex-1">
                  <SkeletonLine className="h-10" />
                </div>
                <SkeletonLine className="w-20 h-10" />
                <div className="w-20 h-10 rounded-lg bg-gray-200/80 animate-pulse" />
                <div className="w-10 h-10 rounded-lg bg-gray-200/80 animate-pulse" />
              </div>
            ))}
          </div>
        ) : fields.length === 0 ? (
          // ---------- Empty state ----------
          <EmptyState
            state="bg-empty-state-social"
            message="There are no social profiles."
            className="h-60"
          />
        ) : (
          // ---------- Actual rows ----------
          fields.map((field, idx) => {
            const platform = values[idx]?.platform || field.platform || "";
            const meta = metaOf(platform);
            const Icon = meta?.Icon;
            const placeholder =
              meta?.placeholder || "https://example.com/your-brand";

            const dirty = isRowDirty(idx);
            const valid = isRowValid(idx);
            const saveDisabled = !dirty || !valid || busyIdx === idx;

            return (
              <div key={field.id} className="flex items-center gap-2 p-2">
                {/* Icon bubble */}
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  {Icon ? (
                    <Icon className="text-lg" />
                  ) : (
                    <span className="text-base">🔗</span>
                  )}
                </div>

                {/* URL input */}
                <Controller
                  control={control}
                  name={`profiles.${idx}.url`}
                  rules={{
                    validate: (v) =>
                      !v ||
                      urlRegex.test(v) ||
                      "Enter a valid URL (http/https)",
                  }}
                  render={({ field: f, fieldState }) => (
                    <div className="flex-1">
                      <input
                        {...f}
                        type="url"
                        placeholder={placeholder}
                        className={`w-full h-10 border ${
                          fieldState.error
                            ? "border-red-500"
                            : "border-gray-300"
                        } p-2 rounded-lg text-sm`}
                        disabled={busyIdx === idx}
                      />
                      {fieldState.error && (
                        <p className="text-xs text-red-500 mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />

                {/* Save */}
                <button
                  type="button"
                  onClick={() => onSaveRow(idx)}
                  disabled={saveDisabled}
                  aria-busy={busyIdx === idx}
                  className={`px-4 h-10 rounded-lg text-sm text-white transition ${
                    saveDisabled
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-orange-400 hover:bg-orange-600"
                  }`}
                >
                  {busyIdx === idx ? "Saving..." : "Save"}
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => onDeleteRow(idx)}
                  disabled={busyIdx === idx}
                  className="h-10 w-10 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200"
                  title="Delete"
                >
                  <FaRegTrashAlt />
                </button>
              </div>
            );
          })
        )}
      </form>

      {/* Add-new */}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        {PLATFORM_META.filter((p) => !usedPlatforms.has(p.value))
          .filter((p) => p.value !== "twitter")
          .map((p) => {
            const Icon = p.Icon;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => addRowWithPlatform(p.value)}
                disabled={loading}
                className={`h-10 w-14 rounded-xl border border-gray-300 flex items-center justify-center ${
                  loading
                    ? "bg-gray-100 cursor-not-allowed"
                    : "hover:bg-gray-50"
                }`}
                title={p.label}
              >
                {Icon ? <Icon className="text-xl" /> : <span>+</span>}
              </button>
            );
          })}
      </div>
    </div>
  );
};

export default SocialProfilesEdit;
