import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useDriver } from '../context/DriverContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/register/RegisterScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ActiveTripScreen } from '../screens/trip/ActiveTripScreen';
import { PaymentSummaryScreen } from '../screens/trip/PaymentSummaryScreen';
import { EarningsScreen } from '../screens/earnings/EarningsScreen';
import { HistoryScreen } from '../screens/history/HistoryScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function MainDrawer() {
  return (
    <Drawer.Navigator>
      <Drawer.Screen name="Inicio" component={HomeScreen} />
      <Drawer.Screen name="Ganancias" component={EarningsScreen} />
      <Drawer.Screen name="Historial" component={HistoryScreen} />
      <Drawer.Screen name="Perfil" component={ProfileScreen} />
    </Drawer.Navigator>
  );
}

function Authenticated() {
  return (
    <AppStack.Navigator>
      <AppStack.Screen
        name="Main"
        component={MainDrawer}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="ActiveTrip"
        component={ActiveTripScreen}
        options={{ title: 'Viaje en curso' }}
      />
      <AppStack.Screen
        name="PaymentSummary"
        component={PaymentSummaryScreen}
        options={{ title: 'Cobro' }}
      />
    </AppStack.Navigator>
  );
}

function Auth() {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Registro conductor' }}
      />
    </AuthStack.Navigator>
  );
}

export function RootNavigator() {
  const { driver, loading } = useDriver();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return driver ? <Authenticated /> : <Auth />;
}
