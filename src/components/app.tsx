import React from "react";
import { Route } from "react-router-dom";
import { App, ZMPRouter, AnimationRoutes, SnackbarProvider } from "zmp-ui";
import { RecoilRoot } from "recoil";
import HomePage from "../pages/index";
import Explore from "../pages/explore";
import Library from "../pages/library";
import Profile from "pages/profile";
import AppNavigation from "./bottom-navigation/bottom-navigation";
import { FirebaseProvider } from '../firebase/FirebaseContext';
import CoffeeDetail from "../pages/CoffeeDetail";
import RegionCoffees from "../pages/RegionCoffees";
import Search from "../pages/Search";

const MyApp = () => {
  return (
    <RecoilRoot>
      <FirebaseProvider>
        <App>
          <SnackbarProvider>
            <ZMPRouter>
              <AnimationRoutes>
                <Route path="/" element={<HomePage />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/library" element={<Library />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/coffee/:id" element={<CoffeeDetail />} />
                <Route path="/region/:regionName" element={<RegionCoffees />} />
                <Route path="/search" element={<Search />} />
              </AnimationRoutes>
              <AppNavigation />
            </ZMPRouter>
          </SnackbarProvider>
        </App>
      </FirebaseProvider>
    </RecoilRoot>
  );
};

export default MyApp;
