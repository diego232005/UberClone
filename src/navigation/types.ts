export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type TripStackParamList = {
  HomeMain: undefined;
  IncomingRequest: undefined;
  ActiveTrip: undefined;
  PaymentSummary: undefined;
};

export type RootDrawerParamList = {
  Home: undefined;
  Earnings: undefined;
  History: undefined;
  Profile: undefined;
  TripDetail: { tripId: string };
};
