const EmptyState = ({
  message = "No data",
  className = "h-full",
  iconSize = "w-44 h-44",
  state = "",
}) => (
  <div
    className={`flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-lg m-5 ${className}`}
  >
    <div className={`${state} bg-cover ${iconSize}`} />
    <div className="mt-2 text-stone-500 text-sm text-center">{message}</div>
  </div>
);

export default EmptyState;
