import { useEffect } from "react";
import { useForm } from "react-hook-form";
import instance from "./api";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";

const ShopNameEdit = ({ locationId, shopName }) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      title: shopName || "",
    },
  });

  useEffect(() => {
    reset({
      title: shopName || "",
    });
  }, [shopName, reset]);

  const onSubmit = async (data) => {
    const formattedData = {
      title: data.title,
    };

    try {
      const accessToken = sessionStorage.getItem("accessToken");
      const response = await instance.post(
        `api/v1/google/update-title/${locationId}/`,
        formattedData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      // console.log("Data successfully submitted:", response.data);
      if (response.status === 200) {
        toast.success("Your changes have been applied.");
        reset();
      } else {
        toast.error("Error applying changes. Please try again later.");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error(
          "Your tokens have been exhausted. Please contact the R&D department to resolve this issue."
        );
        setTimeout(() => {
          navigate("/login");
        }, 5000);
      } else {
        toast.error("Error applying changes. Please try again later.");
      }
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full flex items-end gap-2"
      >
        <div className="w-full flex flex-col">
          <label>Shop Name</label>
          <input
            type="text"
            {...register("title", { required: "Shop name is required" })}
            className={`border ${
              errors.title ? "border-red-500" : "border-gray-300"
            } p-2 rounded-lg`}
            placeholder="Enter new shop name"
            disabled={isSubmitting}
          />
        </div>
        <button
          type="submit"
          className="px-6 py-2 justify-center items-center bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          disabled={isSubmitting}
        >
          Save
        </button>
      </form>
      {errors.title && (
        <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
      )}
    </>
  );
};

export default ShopNameEdit;
