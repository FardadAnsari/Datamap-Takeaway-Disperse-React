const AutoCompletionMultiSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    background: "#f0f4f8",
    borderColor: state.isFocused ? "#2684FF" : "#cbd5e0",
    boxShadow: state.isFocused ? "0 0 0 1px #2684FF" : "none",
    "&:hover": {
      borderColor: "#2684FF",
    },
    borderRadius: "8px",
    padding: "2px",
  }),
  menu: (provided) => ({
    ...provided,
    background: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    marginTop: "4px",
  }),
  option: (provided, state) => ({
    ...provided,
    background: state.isSelected
      ? "#2684FF"
      : state.isFocused
        ? "#e6f7ff"
        : "#ffffff",
    color: state.isSelected ? "#ffffff" : "#333333",
    padding: "10px 12px",
    cursor: "pointer",
    "&:active": {
      background: "#2684FF",
      color: "#ffffff",
    },
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#e6f7ff",
    borderRadius: "4px",
    padding: "2px",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "#2684FF",
    fontWeight: "500",
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: "#2684FF",
    ":hover": {
      backgroundColor: "#2684FF",
      color: "#ffffff",
      cursor: "pointer",
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#a0aec0",
    fontSize: "14px",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#333333",
    fontWeight: "500",
  }),
};

export default AutoCompletionMultiSelectStyles;
