import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();
  //Redirect user to home page by clicking on back home button
  const handleBackHomeClick = () => {
    navigate("/");
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="flex flex-col gap-4">
        <div className="bg-not-found bg-cover w-96 h-96"></div>
        <span className="text-xl font-bold text-center">Page not found.</span>
        <p className="w-96 text-lg text-center">
          We couldn’t find the page you’re looking for. Let’s get you back on
          track.
        </p>
        <button
          className="w-96 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 focus:outline-none disabled:bg-orange-300"
          onClick={handleBackHomeClick}
        >
          Back Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
