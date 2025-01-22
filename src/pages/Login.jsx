import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { IoIosEye, IoIosEyeOff } from "react-icons/io";
import instance from "../component/api";
import { MdError } from "react-icons/md";

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (data) => {
    try {
      const response = await instance.post(
        "/api/token/",
        {
          username: data.username,
          password: data.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      sessionStorage.setItem("accessToken", response.data.access);

      navigate("/datamap");
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          setError("Invalid username or password");
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
    <div className="flex items-center justify-center h-screen bg-cover bg-login-background">
      <div className="w-1/4 h-max flex flex-col bg-white rounded-lg shadow-lg overflow-hidden p-8">
        <form
          className="h-full flex flex-col justify-between"
          onSubmit={handleSubmit(handleLogin)}
        >
          <div className="w-44 h-10 bg-cover self-center bg-mealzo-logo mb-6"></div>
          <p className="text-sm font-bold  text-orange-500 mb-1">Login</p>
          <p className="text-xl font-bold text-gray-800 mb-1">
            Good to see you again!
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Please enter your username and password
          </p>

          <div className="mb-2">
            <input
              type="text"
              placeholder="Username"
              {...register("username", { required: "Username is required" })}
              className={`w-full px-4 py-2 border border-2 mb-2 ${
                error || errors.username
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-teal-500"
              } rounded focus:outline-none focus:ring-1`}
            />
          </div>
          <div className="mb-2">
            <div className="relative w-full">
              <input
                type={passwordVisible ? "text" : "password"}
                placeholder="Password"
                {...register("password", {
                  required: "Password is required",
                })}
                className={`w-full px-4 py-2 border border-2 ${
                  error || errors.password
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-teal-500"
                } rounded focus:outline-none focus:ring-1`}
              />
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                className="absolute right-3 top-3 text-gray-600 focus:outline-none"
              >
                {passwordVisible ? (
                  <IoIosEye size={20} />
                ) : (
                  <IoIosEyeOff size={20} />
                )}
              </button>
            </div>
          </div>

          <div>
            <div className="h-max">
              {errors.username ? (
                <div className="flex bg-red-100 items-center p-2 gap-2 rounded mt-2">
                  <MdError color="red" size={22} />
                  <p className="text-red-500 text-sm text-center">
                    {errors.username.message}
                  </p>
                </div>
              ) : errors.password ? (
                <div className="flex bg-red-100 items-center p-2 gap-2 rounded mt-2">
                  <MdError color="red" size={22} />
                  <p className="text-red-500 text-sm text-center">
                    {errors.password.message}
                  </p>
                </div>
              ) : null}
              {(!errors.username || errors.password) && error ? (
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
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
