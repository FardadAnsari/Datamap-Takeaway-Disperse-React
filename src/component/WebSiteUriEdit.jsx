import { useEffect } from "react";
import { useForm } from "react-hook-form";
import instance from "./api";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";

const WebSiteUriEdit = ({ locationId, webUrl }) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      websiteUri: webUrl || "",
    },
  });

  useEffect(() => {
    reset({
      websiteUri: webUrl || "",
    });
  }, [webUrl, reset]);

  const onSubmit = (data) => {
    const formattedData = {
      websiteUri: data.websiteUri,
    };
    const accessToken = sessionStorage.getItem("accessToken");
    instance
      .post(`/api/v1/google/update-websurl/${locationId}/`, formattedData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        // console.log("Data successfully submitted:", response.data);
        if (response.status === 200) {
          toast.success("Your changes have been applied.");
          reset();
        } else {
          toast.error("Error applying changes. Please try again later.");
        }
      })
      .catch((error) => {
        error.status === 401 &&
          toast.error(
            "Your tokens have been exhausted. Please contact the R&D department to resolve this issue."
          ) &&
          setTimeout(() => {
            navigate("/login");
          }, 5000);
      });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full flex items-end gap-2"
    >
      <div className="w-full flex flex-col">
        <label>Website</label>
        <input
          type="text"
          {...register("websiteUri", { required: true })}
          className="border p-2 rounded-lg"
          placeholder="Enter new website URL"
        />
      </div>
      {errors.websiteUri && (
        <span className="text-red-500">This field is required</span>
      )}
      <button
        type="submit"
        className="px-6 py-2 justify-center items-center bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
      >
        Save
      </button>
    </form>
  );
};

export default WebSiteUriEdit;
