const AutoCompletionCustomStyles = {
  control: (provided, state) => ({
    ...provided,
    padding: "0px",
    height: "45px",
    borderRadius: "5px",
    borderWidth: "1px",
    alignItems: "center",

    borderColor: state.isFocused ? "#2F4F4F" : "#708090",
    boxShadow: state.isFocused ? "0 0 0 0.2rem rgb(211,211,211, 0.7)" : "none",
    "&:hover": {
      borderColor: "#2F4F4F", // Hover border color
    },
    "@media screen and (max-width: 540px)": {
      height: "45px",
      fontSize: "13px",
      padding: "0px",
    },
  }),
  clearIndicator: (provided) => ({
    ...provided,
    padding: "5px",
    color: "#888",
    cursor: "pointer",
    "&:hover": {
      color: "#e74c3c",
    },
  }),

  placeholder: (provided) => ({
    ...provided,
    fontSize: "14px",
    "@media screen and (max-width: 540px)": {
      marginBottom: "15px",
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#ffeed9"
      : state.isFocused
        ? "#faf6f2"
        : "#fff",
    color: state.isSelected ? "#333" : "#333",
    padding: 10,
    "&:active": {
      backgroundColor: "#faf6f2",
    },
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "rgb(249 250 251)",
    borderRadius: "10px",
  }),
  menuList: (provided) => ({
    ...provided,
    maxHeight: 250,
    overflowY: "auto",
    borderRadius: "10px",
    borderWidth: "1px",
    borderColor: "rgb(229 231 235)",
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    "@media screen and (max-width: 540px)": {
      marginBottom: "15px",
    },
  }),
  loadingIndicator: (provided) => ({
    ...provided,
    color: "rgb(255,165,0)", // Loader color
    marginRight: "8px",
  }),
  input: (provided) => ({
    ...provided,
    "&::placeholder": {
      color: "#999",
    },
  }),
};

export default AutoCompletionCustomStyles;
