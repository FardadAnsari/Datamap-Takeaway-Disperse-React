import { useEffect } from "react";
import { useForm } from "react-hook-form";
import instance from "../../api/api";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";

const PhoneNumberEdit = ({ locationId, phoneNumber }) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      primaryPhone: phoneNumber,
    },
  });

  useEffect(() => {
    reset({ primaryPhone: phoneNumber });
  }, [phoneNumber, reset]);

  const onSubmit = async (data) => {
    const formattedData = {
      phoneNumbers: {
        primaryPhone: data.primaryPhone,
      },
    };

    const accessToken = sessionStorage.getItem("accessToken");

    try {
      const response = await instance.post(
        `/api/v1/google/update-phonenumber/${locationId}/`,
        formattedData,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.status === 200) {
        toast.success("Your changes have been applied.");
        reset();
      } else {
        toast.error("Error applying changes. Please try again later.");
      }
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        toast.error(
          "Your tokens have been exhausted. Please contact the R&D department to resolve this issue."
        );
        setTimeout(() => navigate("/login"), 5000);
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
          <label>Phone Number</label>
          <input
            type="tel"
            {...register("primaryPhone", {
              required: "Phone number is required",
              pattern: {
                value: /^[0-9\s]+$/,
                message: "Only numbers are allowed.",
              },
            })}
            className={`border ${
              errors.primaryPhone ? "border-red-500" : "border-gray-300"
            } rounded-lg p-2`}
            placeholder="Enter phone number"
            disabled={isSubmitting}
          />
          {errors.primaryPhone && (
            <p className="text-red-500 text-sm mt-1">
              {errors.primaryPhone.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          aria-busy={isSubmitting}
          disabled={isSubmitting}
          className={`px-6 py-2 justify-center items-center text-white rounded-lg transition ${
            isSubmitting
              ? "bg-orange-400 cursor-not-allowed"
              : "bg-orange-500 hover:bg-orange-600"
          }`}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
      </form>

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
    </>
  );
};

export default PhoneNumberEdit;
