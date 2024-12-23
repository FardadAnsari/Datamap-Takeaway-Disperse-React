import { useEffect } from "react";
import { useForm } from "react-hook-form";
import instance from "./api";
import { FaRegSave } from "react-icons/fa";
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
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      console.log("Data successfully submitted:", response.data);
      if (response.status === 200) {
        toast.success("Your changes have been applied.");
        reset();
      } else {
        toast.error("Error applying changes. Please try again later.");
      }
    } catch (error) {
      error.status === 401 &&
        toast.error(
          "Your tokens have been exhausted. Please contact the R&D department to resolve this issue."
        ) &&
        setTimeout(() => {
          navigate("/login");
        }, 5000);
    }
  };

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          {...register("title", { required: "Shop name is required" })}
          className={`w-full border max-w-96 ${
            errors.title ? "border-red-500" : "border-gray-300"
          } p-2 rounded`}
          placeholder="Enter new shop name"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          className="flex justify-center items-center w-8 h-8 bg-teal-500 text-white rounded hover:bg-teal-600 transition"
          disabled={isSubmitting}
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
      {errors.title && (
        <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
      )}
    </div>
  );
};

export default ShopNameEdit;
