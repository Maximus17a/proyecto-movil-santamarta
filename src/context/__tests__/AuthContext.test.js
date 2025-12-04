import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { Text, Button } from 'react-native';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock Expo modules
jest.mock('expo-auth-session', () => ({}));
jest.mock('expo-web-browser', () => ({}));
jest.mock('expo-crypto', () => ({}));

// Mock the API modules
jest.mock('../../api/authApi', () => ({
  getCurrentSession: jest.fn(),
  getUserProfile: jest.fn(),
  onAuthStateChange: jest.fn(),
  signOutUser: jest.fn(),
  createUserProfile: jest.fn(),
}));

// Mock Supabase Client
jest.mock('../../api/supabaseClient', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
}));

import { getCurrentSession, getUserProfile, onAuthStateChange, signOutUser } from '../../api/authApi';

// Test Component to consume context
const TestComponent = () => {
  const { user, profile, loading, signOut } = useAuth();
  
  if (loading) return <Text>Loading...</Text>;
  
  return (
    <>
      <Text testID="user-email">{user ? user.email : 'No User'}</Text>
      <Text testID="user-role">{profile ? profile.rol : 'No Profile'}</Text>
      <Button title="Sign Out" onPress={signOut} />
    </>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
    getCurrentSession.mockResolvedValue({ data: null, error: null });
    getUserProfile.mockResolvedValue({ data: null, error: null });
  });

  it('renders loading state initially', () => {
    const { getByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('loads user and profile on initial session check', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockProfile = { id: '123', rol: 'cliente' };

    getCurrentSession.mockResolvedValue({ data: { user: mockUser } });
    getUserProfile.mockResolvedValue({ data: mockProfile });

    const { getByTestId, queryByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(queryByText('Loading...')).toBeNull());

    expect(getByTestId('user-email').props.children).toBe('test@example.com');
    expect(getByTestId('user-role').props.children).toBe('cliente');
  });

  it('handles sign out correctly', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    getCurrentSession.mockResolvedValue({ data: { user: mockUser } });
    getUserProfile.mockResolvedValue({ data: { id: '123', rol: 'cliente' } });

    const { getByText, queryByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(queryByText('Loading...')).toBeNull());

    await act(async () => {
      const signOutButton = getByText('Sign Out');
      signOutButton.props.onPress();
    });

    expect(signOutUser).toHaveBeenCalled();
  });
});
