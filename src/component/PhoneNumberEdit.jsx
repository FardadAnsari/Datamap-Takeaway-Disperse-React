import { useEffect } from "react";
import { useForm } from "react-hook-form";
import instance from "./api";
import { FaRegSave } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";

const PhoneNumberEdit = ({ locationId, phoneNumber }) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      primaryPhone: phoneNumber,
    },
  });

  useEffect(() => {
    reset({ primaryPhone: phoneNumber });
  }, [phoneNumber, reset]);

  const onSubmit = (data) => {
    const formattedData = {
      phoneNumbers: {
        primaryPhone: data.primaryPhone,
      },
    };
    const accessToken = sessionStorage.getItem("accessToken");
    instance
      .post(`/api/v1/google/update-phonenumber/${locationId}/`, formattedData, {
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
          type="tel"
          {...register("primaryPhone", {
            required: "Phone number is required",
            pattern: {
              value: /^[0-9\s]+$/,
              message: "Only numbers are allowed.",
            },
          })}
          className={`w-full border max-w-64 ${errors.primaryPhone ? "border-red-500" : "border-gray-300"} rounded p-2`}
          defaultValue={phoneNumber}
        />
        <button
          type="submit"
          className="flex justify-center items-center w-8 h-8 bg-teal-500 text-white rounded"
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
      {errors.primaryPhone && (
        <p className="text-red-500 text-sm mt-1">
          {errors.primaryPhone.message}
        </p>
      )}
    </div>
  );
};

export default PhoneNumberEdit;
