import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface UIState {
  isLoading: boolean;
  theme: 'light' | 'dark';
  activeTab: string;
  notifications: NotificationState[];
  modals: {
    [key: string]: boolean;
  };
  toasts: ToastMessage[];
}

interface NotificationState {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  isRead: boolean;
  createdAt: Date;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

const initialState: UIState = {
  isLoading: false,
  theme: 'light',
  activeTab: 'Home',
  notifications: [],
  modals: {},
  toasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<NotificationState, 'id' | 'createdAt' | 'isRead'>>) => {
      const notification: NotificationState = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date(),
        isRead: false,
      };
      state.notifications.unshift(notification);
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.isRead = true;
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = false;
    },
    showToast: (state, action: PayloadAction<Omit<ToastMessage, 'id'>>) => {
      const toast: ToastMessage = {
        ...action.payload,
        id: Date.now().toString(),
      };
      state.toasts.push(toast);
    },
    hideToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
  },
});

export const {
  setLoading,
  setTheme,
  setActiveTab,
  addNotification,
  markNotificationAsRead,
  clearNotifications,
  openModal,
  closeModal,
  showToast,
  hideToast,
  clearToasts,
} = uiSlice.actions;

export default uiSlice.reducer;