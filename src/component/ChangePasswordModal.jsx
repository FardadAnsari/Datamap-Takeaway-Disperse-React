import { useState } from "react";
import { useForm } from "react-hook-form";
import { IoIosEye, IoIosEyeOff, IoMdClose } from "react-icons/io";
import { MdError } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import instance from "./api";
import { toast, ToastContainer } from "react-toastify";
import { clearOldCaches } from "./indexedDB";

// ChangePasswordModal component for handling password change functionality
const ChangePasswordModal = ({ isOpen, onClose }) => {
  // If the modal is not open, render nothing
  if (!isOpen) return null;

  // useForm hook for managing form state, validation, and submission
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch, // `watch` is used to track the value of specific form fields
  } = useForm();

  // useNavigate hook for programmatic navigation
  const navigate = useNavigate();

  // State for toggling password visibility for each field
  const [currentPassVisible, setCurrentPassVisible] = useState(false);
  const [newPassVisible, setNewPassVisible] = useState(false);
  const [confirmPassVisible, setConfirmPassVisible] = useState(false);

  // State for loading indicator during form submission
  const [isLoading, setIsLoading] = useState(false);

  // State for storing and displaying errors
  const [error, setError] = useState("");

  // Watch the value of the "newPass" field to compare with the confirm password field
  const newPassword = watch("newPass");

  // Function to handle password change form submission
  const handleChangePass = async (data) => {
    setIsLoading(true); // Set loading state to true
    try {
      // Retrieve the access token from sessionStorage
      const accessToken = sessionStorage.getItem("accessToken");
      if (!accessToken) {
        setError("No access token found. Please log in again.");
        return;
      }

      // Make a PUT request to the server to change the password
      const response = await instance.put(
        "/account/change-password/",
        {
          old_password: data.oldPass,
          new_password: data.newPass,
          confirm_password: data.confirmPass,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // If the request is successful, show a success message and redirect the user
      if (response.status === 200) {
        setIsLoading(false);
        toast.success("Password changed successfully!");

        // Clear caches, remove the access token, and navigate to the home page after 3 seconds
        setTimeout(() => {
          clearOldCaches(0); // Clear all caches immediately
          sessionStorage.removeItem("accessToken");
          navigate("/");
        }, 3000);
      }
    } catch (error) {
      setIsLoading(false); // Set loading state to false on error

      // Handle different types of errors
      if (error) {
        if (error.status === 400) {
          setError(error.message); // Display specific error message
        } else {
          toast.error("Something went wrong. Please try again later.");
        }
      } else if (error.request) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error("Error during login:", error.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      {/* Modal container */}
      <div className="bg-white w-1/4 h-max mx-4 rounded-lg shadow-lg relative">
        {/* Modal header with close button */}
        <div className="flex items-center justify-between p-4">
          <div></div>
          <button
            className="justify-self-end text-gray-600 hover:text-gray-900 text-xl"
            onClick={onClose}
          >
            <IoMdClose />
          </button>
        </div>

        {/* Password change form */}
        <form
          className="h-full px-10 flex flex-col justify-between"
          onSubmit={handleSubmit(handleChangePass)}
        >
          {/* Form title and description */}
          <p className="text-sm font-bold text-orange-500 mb-1">
            Change password
          </p>
          <p className="text-xl font-bold text-gray-800 mb-1">
            Let's Change Your Password!
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Please enter your current password
          </p>

          {/* Current password input field */}
          <div className="mb-2">
            <div className="relative w-full">
              <input
                type={currentPassVisible ? "text" : "password"} // Toggle password visibility
                placeholder="Current password"
                {...register("oldPass", {
                  required: "Current password is required", // Validation rule
                })}
                className={`w-full px-4 py-2 border border-2 mb-2 ${
                  error || errors.oldPass
                    ? "border-red-500 focus:ring-red-500" // Error styling
                    : "border-gray-300 focus:ring-teal-500" // Default styling
                } rounded focus:outline-none focus:ring-1`}
              />
              {/* Toggle password visibility button */}
              <button
                type="button"
                onClick={() => setCurrentPassVisible(!currentPassVisible)}
                className="absolute right-3 top-3 text-gray-600 focus:outline-none"
              >
                {currentPassVisible ? (
                  <IoIosEye size={20} />
                ) : (
                  <IoIosEyeOff size={20} />
                )}
              </button>
            </div>
          </div>

          {/* New password input field */}
          <div className="mb-2">
            <div className="relative w-full">
              <input
                type={newPassVisible ? "text" : "password"} // Toggle password visibility
                placeholder="New password"
                {...register("newPass", {
                  required: "Password is required", // Validation rule
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters long",
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                    message:
                      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
                  },
                })}
                className={`w-full px-4 py-2 border border-2 ${
                  error || errors.newPass
                    ? "border-red-500 focus:ring-red-500" // Error styling
                    : "border-gray-300 focus:ring-teal-500" // Default styling
                } rounded focus:outline-none focus:ring-1`}
              />
              {/* Toggle password visibility button */}
              <button
                type="button"
                onClick={() => setNewPassVisible(!newPassVisible)}
                className="absolute right-3 top-3 text-gray-600 focus:outline-none"
              >
                {newPassVisible ? (
                  <IoIosEye size={20} />
                ) : (
                  <IoIosEyeOff size={20} />
                )}
              </button>
            </div>
          </div>

          {/* Confirm password input field */}
          <p className="py-2 font-base text-sm text-gray-400">
            Confirm your new password by entering it again.
          </p>
          <div className="mb-2">
            <div className="relative w-full">
              <input
                type={confirmPassVisible ? "text" : "password"} // Toggle password visibility
                placeholder="Confirm password"
                {...register("confirmPass", {
                  required: "Confirm password is required", // Validation rule
                  validate: (value) => {
                    const newPasswordTrimmed = (newPassword || "").trim(); // Ensure `newPassword` is a string
                    const confirmPasswordTrimmed = (value || "").trim(); // Ensure `value` is a string
                    return (
                      newPasswordTrimmed === confirmPasswordTrimmed ||
                      "Passwords do not match"
                    );
                  },
                })}
                className={`w-full px-4 py-2 border border-2 ${
                  error || errors.confirmPass
                    ? "border-red-500 focus:ring-red-500" // Error styling
                    : "border-gray-300 focus:ring-teal-500" // Default styling
                } rounded focus:outline-none focus:ring-1`}
              />
              {/* Toggle password visibility button */}
              <button
                type="button"
                onClick={() => setConfirmPassVisible(!confirmPassVisible)}
                className="absolute right-3 top-3 text-gray-600 focus:outline-none"
              >
                {confirmPassVisible ? (
                  <IoIosEye size={20} />
                ) : (
                  <IoIosEyeOff size={20} />
                )}
              </button>
            </div>
          </div>
          <div>
            {/* Display form validation error message */}
            <div className="h-max">
              {errors.oldPass ? (
                <div className="flex bg-red-100 items-center p-2 gap-2 rounded mt-2">
                  <MdError color="red" size={22} />
                  <p className="text-red-500 text-sm text-center">
                    {errors.oldPass.message}
                  </p>
                </div>
              ) : errors.newPass ? (
                <div className="flex bg-red-100 items-center p-2 gap-2 rounded mt-2">
                  <MdError color="red" size={22} />
                  <p className="text-red-500 text-sm text-center">
                    {errors.newPass.message}
                  </p>
                </div>
              ) : errors.confirmPass ? (
                <div className="flex bg-red-100 items-center p-2 gap-2 rounded mt-2">
                  <MdError color="red" size={22} />
                  <p className="text-red-500 text-sm text-center">
                    {errors.confirmPass.message}
                  </p>
                </div>
              ) : null}

              {/* Display general error message if no field-specific errors exist */}
              {(!errors.oldPass || !errors.newPass || !errors.confirmPass) &&
              error ? (
                <div className="flex bg-red-100 items-center p-2 gap-2 rounded mt-2">
                  <MdError color="red" size={22} />
                  <p className="text-red-500 text-sm text-center">{error}</p>
                </div>
              ) : null}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full py-2 mt-3 self-end text-white bg-orange-500 rounded hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition"
              disabled={isLoading}
            >
              Change Password
            </button>
          </div>
        </form>

        {/* Footer section (currently empty) */}
        <div className="p-6">
          <div className="flex justify-end gap-4 mt-4"></div>
        </div>
      </div>

      {/* Toast container for displaying notifications */}
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
    </div>
  );
};

export default ChangePasswordModal;
