import { useState, useEffect, useMemo, useContext } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Icon from "@mui/material/Icon";
import ArgonBox from "components/ArgonBox";
import Sidenav from "examples/Sidenav";
import Configurator from "examples/Configurator";
import theme from "assets/theme";
import themeRTL from "assets/theme/theme-rtl";
import themeDark from "assets/theme-dark";
import themeDarkRTL from "assets/theme-dark/theme-rtl";
import rtlPlugin from "stylis-plugin-rtl";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import routes from "./routes"; // Import your routes
import { useArgonController, setMiniSidenav, setOpenConfigurator } from "context";
import brand from "assets/images/logo-ct.png";
import brandDark from "assets/images/logo-ct-dark.png";
import "assets/css/nucleo-icons.css";
import "assets/css/nucleo-svg.css";
import { AuthContext } from "AuthContext";

export default function App() {
  const [controller, dispatch] = useArgonController();
  const { miniSidenav, direction, layout, openConfigurator, sidenavColor, darkSidenav, darkMode } = controller;
  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const [rtlCache, setRtlCache] = useState(null);
  const { pathname } = useLocation();
  const { role } = useContext(AuthContext);
  const isAuthenticated = !!localStorage.getItem("token"); // Check if token exists

  // Call routes function to get filtered routes
  const filteredRoutes = routes(); // Call the routes function here

  // Cache for the rtl
  useMemo(() => {
    const cacheRtl = createCache({
      key: "rtl",
      stylisPlugins: [rtlPlugin],
    });

    setRtlCache(cacheRtl);
  }, []);

  const handleOnMouseEnter = () => {
    if (miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false);
      setOnMouseEnter(true);
    }
  };

  const handleOnMouseLeave = () => {
    if (onMouseEnter) {
      setMiniSidenav(dispatch, true);
      setOnMouseEnter(false);
    }
  };

  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);

  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const getRoutes = (filteredRoutes) =>
    filteredRoutes.map((route) => {
      if (route.collapse) {
        return getRoutes(route.collapse);
      }

      if (route.route) {
        // If authenticated, allow access to all routes, otherwise redirect to sign-in
        return isAuthenticated ? (
          <Route exact path={route.route} element={route.element} key={route.key} />
        ) : (
          <Navigate to="/authentication/sign-in" />
        );
      }

      return null;
    });

  const configsButton = (
    <ArgonBox
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="3.5rem"
      height="3.5rem"
      bgColor="white"
      shadow="sm"
      borderRadius="50%"
      position="fixed"
      right="2rem"
      bottom="2rem"
      zIndex={99}
      color="dark"
      sx={{ cursor: "pointer" }}
      onClick={handleConfiguratorOpen}
    >
      <Icon fontSize="default" color="inherit">
        settings
      </Icon>
    </ArgonBox>
  );

  return direction === "rtl" ? (
    <CacheProvider value={rtlCache}>
      <ThemeProvider theme={darkMode ? themeDarkRTL : themeRTL}>
        <CssBaseline />
        {layout === "dashboard" && (
          <>
            <Sidenav
              color={sidenavColor}
              brand={darkSidenav || darkMode ? brand : brandDark}
              brandName="Hyla"
              routes={filteredRoutes} // Use filtered routes here
              onMouseEnter={handleOnMouseEnter}
              onMouseLeave={handleOnMouseLeave}
            />
            <Configurator />
            {configsButton}
          </>
        )}
        {layout === "vr" && <Configurator />}
        <Routes>
          {getRoutes(filteredRoutes)} {/* Use filtered routes here */}
          <Route path="*" element={<Navigate to={isAuthenticated ? pathname : "/authentication/sign-in"} />} />
        </Routes>
      </ThemeProvider>
    </CacheProvider>
  ) : (
    <ThemeProvider theme={darkMode ? themeDark : theme}>
      <CssBaseline />
      {layout === "dashboard" && (
        <>
          <Sidenav
            color={sidenavColor}
            brand={darkSidenav || darkMode ? brand : brandDark}
            brandName="Hyla"
            routes={filteredRoutes} // Use filtered routes here
            onMouseEnter={handleOnMouseEnter}
            onMouseLeave={handleOnMouseLeave}
          />
        </>
      )}
      {layout === "vr" && <Configurator />}
      <Routes>
        <Route path="/" element={<Navigate to={"/authentication/sign-in"} />} />
        {getRoutes(filteredRoutes)} {/* Use filtered routes here */}
        <Route path="*" element={<Navigate to={isAuthenticated ? pathname : "/authentication/sign-in"} />} />
      </Routes>
    </ThemeProvider>
  );
}


