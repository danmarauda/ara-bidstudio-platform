import { useLocation, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useReactiveVar } from "@apollo/client";
import { authToken, userObj, showExportModal } from "../../graphql/cache";
import { header_menu_items } from "../../assets/configurations/menus";
import { useEnv } from "../hooks/UseEnv";

/**
 * Shared navigation menu logic for both desktop and mobile nav components.
 * Handles auth resolution, menu filtering, active state, and logout.
 */
export const useNavMenu = () => {
  const { REACT_APP_USE_AUTH0, REACT_APP_AUDIENCE } = useEnv();
  const {
    loginWithRedirect,
    loginWithPopup,
    logout,
    user: auth0_user,
    isLoading,
  } = useAuth0();
  const cache_user = useReactiveVar(userObj);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const user = REACT_APP_USE_AUTH0 ? auth0_user : cache_user;
  const show_export_modal = useReactiveVar(showExportModal);

  // Filter menu items based on authentication
  const public_header_items = header_menu_items.filter(
    (item) => !item.protected
  );
  const private_header_items = header_menu_items.filter(
    (item) => item.protected
  );

  /**
   * Determines whether a menu item should be shown as active based on the current
   * location pathname. We consider an item active when the pathname is exactly
   * the route OR it is a sub-route (i.e. pathname starts with `${route}/`).
   */
  const isActive = (route: string) => {
    if (route === "/corpuses") {
      // "Corpuses" acts as our home page and should also be active for the old
      // root path ("/") to avoid a brief flash before the redirect kicks in.
      return pathname === "/" || pathname.startsWith("/corpuses");
    }
    return pathname === route || pathname.startsWith(`${route}/`);
  };

  /**
   * Logs out the user. Uses Auth0 logout if Auth0 is enabled, otherwise
   * clears local auth state and redirects to home.
   * CentralRouteManager will automatically clear entity state when navigating to "/".
   */
  const requestLogout = () => {
    if (REACT_APP_USE_AUTH0) {
      logout({
        logoutParams: {
          returnTo: window.location.origin,
        },
      });
    } else {
      authToken("");
      userObj(null);
      navigate("/");
    }
  };

  /**
   * Initiates login flow. Tries popup first, falls back to redirect if popup fails.
   */
  const doLogin = async () => {
    try {
      await loginWithPopup({
        authorizationParams: {
          audience: REACT_APP_AUDIENCE || undefined,
          scope: "openid profile email",
          redirect_uri: window.location.origin,
        },
      });
    } catch (error) {
      await loginWithRedirect({
        appState: {
          returnTo: window.location.pathname + window.location.search,
        },
        authorizationParams: {
          audience: REACT_APP_AUDIENCE || undefined,
          scope: "openid profile email",
        },
      });
    }
  };

  return {
    // Auth state
    user,
    isLoading,
    REACT_APP_USE_AUTH0,
    REACT_APP_AUDIENCE,

    // Menu items
    public_header_items,
    private_header_items,

    // UI state
    show_export_modal,
    pathname,

    // Functions
    isActive,
    requestLogout,
    doLogin,
    loginWithPopup,
    loginWithRedirect,

    // Navigation
    navigate,
  };
};
