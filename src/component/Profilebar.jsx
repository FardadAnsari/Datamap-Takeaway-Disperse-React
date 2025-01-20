import { IoIosArrowBack } from "react-icons/io";
import { MdAccountCircle } from "react-icons/md";
import { GoOrganization } from "react-icons/go";
import Logout from "../component/Logout";

const Profilebar = ({ isOpen, setIsProfileOpen, user }) => (
  <div
    className={`w-80 absolute top-0 left-20 flex flex-col h-full bg-white z-10 transition-transform duration-300 ease-in-out ${
      isOpen ? "translate-x-0" : "-translate-x-full"
    }`}
  >
    <div className="p-4 w-full h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between">
          <span className="text-2xl font-bold">Profile</span>
          <button
            className="w-8 mb-4 p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none"
            onClick={() => setIsProfileOpen(false)}
          >
            <IoIosArrowBack />
          </button>
        </div>
        <div className="px-2 py-2 bg-gray-50 flex flex-col rounded-lg border shadow-md">
          <div className="flex items-center">
            <MdAccountCircle size={80} color="gray" />
            <span>{user?.full_name}</span>
          </div>
          <div className="flex items-center gap-1 bg-teal-50 w-max p-2 rounded shadow-md">
            <GoOrganization color="teal" />
            <span className="text-teal-900">{user?.department}</span>
          </div>
        </div>
      </div>
      <div className="w-full justify-self-end">
        <Logout />
      </div>
    </div>
  </div>
);

export default Profilebar;
