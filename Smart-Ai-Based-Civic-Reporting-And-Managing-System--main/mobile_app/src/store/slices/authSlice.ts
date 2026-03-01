import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, LoginCredentials, RegisterData, ApiResponse } from '../../types/index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../utils/constants';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
};

// Async thunks for API calls
// ...existing code...
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: any, { rejectWithValue }) => {
    try {
      let mockResponse: ApiResponse<{ user: User; token: string }>;
      
      if (credentials.userType === 'engineer') {
        // Engineer login
        mockResponse = {
          success: true,
          data: {
            user: {
              id: credentials.engineerId,
              name: credentials.name,
              email: credentials.email,
              phone: credentials.phone,
              createdAt: new Date().toDateString(),
              isVerified: true,
              userType: 'engineer',
              engineerId: credentials.engineerId,
              department: credentials.department,
              specialization: credentials.specialization,
            },
            token: 'engineer-jwt-token',
          },
        };
      } else {
        // Citizen login
        mockResponse = {
          success: true,
          data: {
            user: {
              id: '1',
              name: 'John Doe',
              email: 'john@example.com',
              phone: credentials.phone,
              createdAt: new Date().toDateString(),
              isVerified: true,
              userType: 'citizen',
            },
            token: 'citizen-jwt-token',
          },
        };
      }

      if (mockResponse.success && mockResponse.data) {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, mockResponse.data.token);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(mockResponse.data.user));
        return mockResponse.data;
      } else {
        return rejectWithValue(mockResponse.error || 'Login failed');
      }
    } catch (error) {
      return rejectWithValue('Network error');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual API call
      const mockResponse: ApiResponse<{ user: User; token: string }> = {
        success: true,
        data: {
          user: {
            id: '1',
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            createdAt: new Date().toDateString(), // <-- convert to string
            isVerified: false,
          },
          token: 'mock-jwt-token',
        },
      };

      if (mockResponse.success && mockResponse.data) {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, mockResponse.data.token);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(mockResponse.data.user));
        return mockResponse.data;
      } else {
        return rejectWithValue(mockResponse.error || 'Registration failed');
      }
    } catch (error) {
      return rejectWithValue('Network error');
    }
  }
);

export const loadStoredAuth = createAsyncThunk(
  'auth/loadStored',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);

      if (token && userData) {
        return {
          token,
          user: JSON.parse(userData) as User,
        };
      } else {
        return rejectWithValue('No stored auth data');
      }
    } catch (error) {
      return rejectWithValue('Failed to load stored auth');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      // Clear AsyncStorage
      AsyncStorage.multiRemove([STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.USER_DATA]);
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(state.user));
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Load stored auth cases
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loadStoredAuth.rejected, (state) => {
        state.isAuthenticated = false;
      });
  },
});

export const { logout, clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;