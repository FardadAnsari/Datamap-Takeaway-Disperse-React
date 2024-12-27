const AutoCompletionMultiSelectStyles = {
  control: (provided) => ({
    ...provided,
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "5px",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#888",
    },
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#f0f8ff", // رنگ پس‌زمینه برای تگ‌های انتخاب‌شده
    borderRadius: "5px",
    display: "flex",
    alignItems: "center",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "#333", // رنگ متن تگ‌ها
    fontWeight: "bold",
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: "#888",
    cursor: "pointer",
    "&:hover": {
      color: "#e74c3c",
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#aaa",
  }),
};

export default AutoCompletionMultiSelectStyles;
