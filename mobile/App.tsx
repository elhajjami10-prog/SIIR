import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { BackHandler, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DriverHome from './src/screens/DriverHome';
import Intro from './src/screens/Intro';
import Onboarding from './src/screens/Onboarding';
import { Cities, Earnings, Language, Menu, Trips } from './src/screens/Pages';
import Ride from './src/screens/Ride';
import RiderHome from './src/screens/RiderHome';
import Search from './src/screens/Search';
import Subscription from './src/screens/Subscription';
import { LocationProvider } from './src/services/useUserLocation';
import { AppProvider, useApp } from './src/store/AppStore';

function Router() {
  const app = useApp();
  const [menu, setMenu] = useState(false);

  React.useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (menu) return setMenu(false), true;
      if (app.stack.length > 1) return app.back(), true;
      return false;
    });
    return () => sub.remove();
  }, [menu, app.stack.length]);

  if (!app.ready) return null;
  if (!app.onboarded) return <Onboarding />;
  const top = app.stack[app.stack.length - 1];
  const root = app.stack[0];
  return (
    <View style={{ flex: 1 }}>
      {/* L'écran racine (carte) reste monté sous les pages pour garder la position et la carte */}
      {root.name === 'driver' ? <DriverHome openMenu={() => setMenu(true)} /> : <RiderHome openMenu={() => setMenu(true)} />}
      {top !== root && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {top.name === 'search' && <Search />}
          {top.name === 'choose' && <Ride from={top.from} to={top.to} />}
          {top.name === 'subscription' && <Subscription />}
          {top.name === 'trips' && <Trips />}
          {top.name === 'earnings' && <Earnings />}
          {top.name === 'language' && <Language />}
          {top.name === 'cities' && <Cities />}
        </View>
      )}
      <Menu open={menu} onClose={() => setMenu(false)} />
    </View>
  );
}

export default function App() {
  const [intro, setIntro] = useState(true);
  return (
    <SafeAreaProvider>
      <AppProvider>
        <LocationProvider>
          <StatusBar style="dark" />
          <Router />
          {intro && <Intro onDone={() => setIntro(false)} />}
        </LocationProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
