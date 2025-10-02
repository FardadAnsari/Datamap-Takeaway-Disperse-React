import { Controller, useForm } from "react-hook-form";
import Select from "react-select";
import AutoCompletionCustomStyles from "../AutoCompletionCustomStyles";

const ROLES = [
  { label: "Manager", value: "MANAGER" },
  { label: "Owner", value: "OWNER" },
];

const AddAdminModal = ({
  isOpen,
  onClose,
  onSubmit, // ({email, role}) => Promise|void
  isSubmitting = false,
}) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { email: "", role: ROLES[0] },
  });

  if (!isOpen) return null;

  const submit = async (values) => {
    await onSubmit?.({
      email: values.email.trim(),
      role: values.role?.value || "ADMIN",
    });
    reset({ email: "", role: ROLES[0] });
  };

  return (
    <div className="fixed inset-0 z-[1100] grid place-items-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-70"
        onClick={onClose}
      />
      {/* modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-[520px] max-w-[92vw] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add New Admin</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="John.doe@mealzo.co.uk"
              className={`w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400 ${errors.email ? "border-red-400" : "border-gray-300"}`}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email",
                },
              })}
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select
                  {...field}
                  options={ROLES}
                  styles={AutoCompletionCustomStyles}
                  isSearchable={false}
                />
              )}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddAdminModal;
