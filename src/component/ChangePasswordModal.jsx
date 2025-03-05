import { IoMdClose } from "react-icons/io";
const ChangePasswordModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-white w-1/3 h-max mx-4 rounded-lg shadow-lg relative">
        <div className="flex items-center justify-between p-4">
          <button
            className="text-gray-600 hover:text-gray-900 text-xl"
            onClick={onClose}
          >
            <IoMdClose />
          </button>
        </div>
        <div className="p-6">
          <div className="flex justify-end gap-4 mt-4"></div>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
