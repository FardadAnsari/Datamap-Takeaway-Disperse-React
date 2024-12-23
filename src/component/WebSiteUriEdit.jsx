import { useEffect } from "react";
import { useForm } from "react-hook-form";
import instance from "./api";
import { FaRegSave } from "react-icons/fa";
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
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        console.log("Data successfully submitted:", response.data);
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
    <div className="w-full">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex items-center overflow-y-auto gap-2"
      >
        <input
          type="text"
          {...register("websiteUri", { required: true })}
          className="w-full border max-w-64 border p-2 rounded"
          placeholder="Enter new website URL"
        />
        {errors.websiteUri && (
          <span className="text-red-500">This field is required</span>
        )}
        <button
          type="submit"
          className="flex justify-center items-center w-8 h-8 bg-teal-500 text-white rounded hover:bg-teal-600 transition"
        >
          <FaRegSave size={20} />
        </button>
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </form>
    </div>
  );
};

export default WebSiteUriEdit;
