import React, { Component } from "react";
import { Dropdown, DropdownProps } from "semantic-ui-react";

/**
 * Wrapper component for Semantic UI React Dropdown that bypasses React Strict Mode
 * to avoid findDOMNode deprecation warnings.
 *
 * This is a temporary workaround until Semantic UI React updates to remove findDOMNode usage.
 * See: https://github.com/Semantic-Org/Semantic-UI-React/issues/4339
 */
const DropdownNoStrictMode = React.forwardRef<
  Component<DropdownProps>,
  DropdownProps
>((props, ref) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder during SSR or initial render
    return <div style={{ minHeight: "38px" }} />;
  }

  // Render the Dropdown outside of Strict Mode checks
  // @ts-ignore - ref type mismatch is intentional to work around Semantic UI React's legacy ref usage
  return <Dropdown {...props} ref={ref} />;
});

DropdownNoStrictMode.displayName = "DropdownNoStrictMode";

// Export all Dropdown sub-components
export default Object.assign(DropdownNoStrictMode, {
  Divider: Dropdown.Divider,
  Header: Dropdown.Header,
  Item: Dropdown.Item,
  Menu: Dropdown.Menu,
  SearchInput: Dropdown.SearchInput,
});
