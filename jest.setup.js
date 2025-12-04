import 'react-native-gesture-handler/jestSetup';

// Mock Expo modules
jest.mock('expo-modules-core', () => ({
  NativeModulesProxy: {},
  EventEmitter: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({}));
jest.mock('expo-web-browser', () => ({}));
jest.mock('expo-crypto', () => ({}));
