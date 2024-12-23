import React from "react";

const DialogDefault = ({ open, setClose, message }) => {
  const handleOpen = () => setClose(open);
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-lg font-semibold">{message}</h2>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleOpen}
            className="mt-3 inline-flex justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DialogDefault;
