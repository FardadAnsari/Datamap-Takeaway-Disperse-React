import Logout from "./Logout";
import { IoMdClose } from "react-icons/io";
const LogoutModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-white w-1/3 h-max mx-4 rounded-lg shadow-lg relative">
        <div className="flex items-center justify-between border-b p-4">
          <span className="text-xl font-normal">Logout</span>
          <button
            className="text-gray-600 hover:text-gray-900 text-xl"
            onClick={onClose}
          >
            <IoMdClose />
          </button>
        </div>
        <div className="p-6">
          <p className="text-lg font-semibold pb-4 ">
            Are you sure you want to logout?
          </p>
          <div className="flex justify-end gap-4 mt-4">
            <button
              className="text-center w-1/2 py-2 rounded-full border border-gray-200 hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition"
              onClick={onClose}
            >
              Cancel
            </button>
            <Logout />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
