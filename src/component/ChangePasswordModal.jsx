import { useState } from "react";
import { useForm } from "react-hook-form";
import { IoIosEye, IoIosEyeOff, IoMdClose } from "react-icons/io";
import { MdError } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import instance from "./api";
import { ToastContainer } from "react-toastify";

const ChangePasswordModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch, // Destructure `watch` from `useForm`
  } = useForm();

  const navigate = useNavigate();
  const [currentPassVisible, setCurrentPassVisible] = useState(false);
  const [newPassVisible, setNewPassVisible] = useState(false);
  const [confirmPassVisible, setConfirmPassVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const newPassword = watch("newPass"); // Use `watch` to track the `newPass` field

  const handleChangePass = async (data) => {
    setIsLoading(true);
    try {
      const accessToken = sessionStorage.getItem("accessToken");
      if (!accessToken) {
        setError("No access token found. Please log in again.");
        return;
      }

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

      if (response.status === 200) {
        setIsLoading(false);
        alert("Password changed successfully!");
        sessionStorage.removeItem("accessToken");
        navigate("/");
      }
    } catch (error) {
      setIsLoading(false);
      if (error) {
        if (error.status === 400) {
          setError(error.message);
        } else {
          alert("Something went wrong. Please try again later.");
        }
      } else if (error.request) {
        alert("Network error. Please check your connection.");
      } else {
        console.error("Error during login:", error.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-white w-1/4 h-max mx-4 rounded-lg shadow-lg relative">
        <div className="flex items-center justify-between p-4">
          <div></div>
          <button
            className="justify-self-end text-gray-600 hover:text-gray-900 text-xl"
            onClick={onClose}
          >
            <IoMdClose />
          </button>
        </div>
        <form
          className="h-full px-10 flex flex-col justify-between"
          onSubmit={handleSubmit(handleChangePass)}
        >
          <p className="text-sm font-bold  text-orange-500 mb-1">
            Change password
          </p>
          <p className="text-xl font-bold text-gray-800 mb-1">
            Let's Change Your Password!
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Please enter your current password
          </p>

          <div className="mb-2">
            <div className="relative w-full">
              <input
                type={currentPassVisible ? "text" : "password"}
                placeholder="Current password"
                {...register("oldPass", {
                  required: "Current password is required",
                })}
                className={`w-full px-4 py-2 border border-2 mb-2 ${
                  error || errors.oldPass
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-teal-500"
                } rounded focus:outline-none focus:ring-1`}
              />
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
          <div className="mb-2">
            <div className="relative w-full">
              <input
                type={newPassVisible ? "text" : "password"}
                placeholder="New password"
                {...register("newPass", {
                  required: "Password is required",
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
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-teal-500"
                } rounded focus:outline-none focus:ring-1`}
              />
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
          <p className="py-2 font-base text-sm text-gray-400">
            Confirm your new password by entering it again.
          </p>
          <div className="mb-2">
            <div className="relative w-full">
              <input
                type={confirmPassVisible ? "text" : "password"}
                placeholder="Confirm password"
                {...register("confirmPass", {
                  required: "Confirm password is required",
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
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-teal-500"
                } rounded focus:outline-none focus:ring-1`}
              />
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
              {(!errors.oldPass || !errors.newPass || !errors.confirmPass) &&
              error ? (
                <div className="flex bg-red-100 items-center p-2 gap-2 rounded mt-2">
                  <MdError color="red" size={22} />
                  <p className="text-red-500 text-sm text-center">{error}</p>
                </div>
              ) : null}
            </div>
            <button
              type="submit"
              className="w-full py-2 mt-3 self-end text-white bg-orange-500 rounded hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition"
            >
              Change Password
            </button>
          </div>
        </form>
        <div className="p-6">
          <div className="flex justify-end gap-4 mt-4"></div>
        </div>
      </div>
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
