import { MdAccountCircle } from "react-icons/md";
import { GoOrganization } from "react-icons/go";
import { RiLockPasswordLine, RiLogoutCircleRLine } from "react-icons/ri";
import { useUser } from "../../api/userPermission";

const Profilebar = ({ isOpen, onLogoutClick, onChangePassClick }) => {
  const { user } = useUser();
  // console.log(user);

  return (
    <div
      className={`w-80 absolute top-0 left-20 flex flex-col h-full bg-white z-10 transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="p-4 w-full h-full flex flex-col justify-between">
        <div>
          <div className="flex justify-between mb-4">
            <span className="text-xl font-bold">Profile</span>
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
          <button
            className="flex gap-2 my-4 p-2 w-full border rounded"
            onClick={onChangePassClick}
          >
            <RiLockPasswordLine size={25} />
            <span>Change password</span>
          </button>
        </div>
        <div className="w-full justify-self-end">
          <button
            className="w-full flex items-center gap-2 px-2 py-2 rounded border border-gray-200 hover:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 transition"
            onClick={onLogoutClick}
          >
            <RiLogoutCircleRLine color="red" size={25} />
            <span className="hidden lg:block md:block sm:hidden">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profilebar;
