import React from "react";
import ReactSelect, {
  Props as ReactSelectProps,
  StylesConfig,
  components,
  OptionProps,
} from "react-select";

export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
  subheader?: string;
  content?: React.ReactNode;
}

interface SelectProps
  extends Omit<ReactSelectProps<SelectOption, boolean>, "styles"> {
  customStyles?: StylesConfig<SelectOption, boolean>;
}

// Custom option component to support icons and subheaders
const CustomOption: React.FC<OptionProps<SelectOption, boolean>> = (props) => {
  const { data } = props;

  return (
    <components.Option {...props}>
      {data.content ? (
        data.content
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {data.icon && <span>{data.icon}</span>}
            <span style={{ fontWeight: 500 }}>{data.label}</span>
          </div>
          {data.subheader && (
            <div
              style={{
                fontSize: "0.8125rem",
                color: "rgba(0, 0, 0, 0.6)",
                marginLeft: data.icon ? "1.5rem" : "0",
              }}
            >
              {data.subheader}
            </div>
          )}
        </div>
      )}
    </components.Option>
  );
};

export const Select: React.FC<SelectProps> = ({ customStyles, ...props }) => {
  const defaultStyles: StylesConfig<SelectOption, boolean> = {
    control: (base, state) => ({
      ...base,
      margin: 0,
      minWidth: "260px",
      fontSize: "0.875rem",
      background: "white",
      border: state.isFocused ? "1px solid #4a90e2" : "1px solid #e2e8f0",
      borderRadius: "8px",
      boxShadow: state.isFocused
        ? "0 0 0 1px #4a90e2"
        : "0 1px 2px rgba(0, 0, 0, 0.05)",
      transition: "all 0.2s ease",
      "&:hover": {
        borderColor: "#cbd5e1",
      },
      minHeight: "38px",
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      overflow: "hidden",
      zIndex: 1000,
    }),
    menuList: (base) => ({
      ...base,
      padding: 0,
      maxHeight: "300px",
    }),
    option: (base, state) => ({
      ...base,
      padding: "0.75rem 1rem",
      fontSize: "0.875rem",
      backgroundColor: state.isSelected
        ? "#4a90e2"
        : state.isFocused
        ? "rgba(74, 144, 226, 0.1)"
        : "white",
      color: state.isSelected ? "white" : "rgba(0, 0, 0, 0.87)",
      cursor: "pointer",
      transition: "all 0.15s ease",
      "&:active": {
        backgroundColor: state.isSelected
          ? "#357abd"
          : "rgba(74, 144, 226, 0.2)",
      },
    }),
    placeholder: (base) => ({
      ...base,
      color: "#94a3b8",
      fontSize: "0.875rem",
    }),
    singleValue: (base) => ({
      ...base,
      color: "rgba(0, 0, 0, 0.87)",
      fontSize: "0.875rem",
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "#e0f2fe",
      borderRadius: "6px",
      border: "1px solid #bae6fd",
      padding: "0.125rem 0.25rem",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "#0369a1",
      fontSize: "0.8125rem",
      fontWeight: 500,
      padding: "0.125rem 0.25rem",
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: "#0369a1",
      cursor: "pointer",
      "&:hover": {
        backgroundColor: "#bae6fd",
        color: "#075985",
      },
      borderRadius: "0 4px 4px 0",
    }),
    input: (base) => ({
      ...base,
      color: "rgba(0, 0, 0, 0.87)",
      fontSize: "0.875rem",
    }),
    indicatorSeparator: (base) => ({
      ...base,
      display: "none",
    }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: state.isFocused ? "#4a90e2" : "#94a3b8",
      transition: "all 0.2s ease",
      "&:hover": {
        color: "#4a90e2",
      },
    }),
    clearIndicator: (base) => ({
      ...base,
      color: "#94a3b8",
      cursor: "pointer",
      transition: "all 0.2s ease",
      "&:hover": {
        color: "#ef4444",
      },
    }),
    loadingIndicator: (base) => ({
      ...base,
      color: "#4a90e2",
    }),
    noOptionsMessage: (base) => ({
      ...base,
      fontSize: "0.875rem",
      color: "#94a3b8",
      padding: "1rem",
    }),
  };

  // Merge custom styles with defaults
  const mergedStyles: StylesConfig<SelectOption, boolean> = customStyles
    ? Object.keys(defaultStyles).reduce((acc, key) => {
        const styleKey = key as keyof StylesConfig<SelectOption, boolean>;
        acc[styleKey] = (base: any, state: any) => {
          const defaultStyle =
            typeof defaultStyles[styleKey] === "function"
              ? (defaultStyles[styleKey] as any)(base, state)
              : base;
          const customStyle =
            customStyles[styleKey] &&
            typeof customStyles[styleKey] === "function"
              ? (customStyles[styleKey] as any)(base, state)
              : {};
          return { ...defaultStyle, ...customStyle };
        };
        return acc;
      }, {} as StylesConfig<SelectOption, boolean>)
    : defaultStyles;

  return (
    <ReactSelect<SelectOption, boolean>
      {...props}
      styles={mergedStyles}
      components={{
        Option: CustomOption,
        ...props.components,
      }}
      classNamePrefix="react-select"
    />
  );
};

export default Select;
