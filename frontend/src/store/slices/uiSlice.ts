// frontend/src/store/slices/uiSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
interface Notification {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

interface UIState {
    notifications: Notification[];
    sidebarOpen: boolean;
    darkMode: boolean;
    selectedTabIndex: number;
    fullscreenMode: boolean;
    modal: {
        open: boolean;
        type: string | null;
        props: Record<string, any> | null;
    };
}

// Initial state
const initialState: UIState = {
    notifications: [],
    sidebarOpen: true,
    darkMode: localStorage.getItem('darkMode') === 'true',
    selectedTabIndex: 0,
    fullscreenMode: false,
    modal: {
        open: false,
        type: null,
        props: null
    }
};

// UI slice
const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        // Notifications
        addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
            const id = new Date().getTime().toString();
            state.notifications.push({
                id,
                ...action.payload
            });
        },
        removeNotification: (state, action: PayloadAction<string>) => {
            state.notifications = state.notifications.filter(
                notification => notification.id !== action.payload
            );
        },
        clearNotifications: (state) => {
            state.notifications = [];
        },

        // Sidebar
        toggleSidebar: (state) => {
            state.sidebarOpen = !state.sidebarOpen;
        },
        setSidebarOpen: (state, action: PayloadAction<boolean>) => {
            state.sidebarOpen = action.payload;
        },

        // Dark mode
        toggleDarkMode: (state) => {
            const newValue = !state.darkMode;
            state.darkMode = newValue;
            localStorage.setItem('darkMode', String(newValue));
        },
        setDarkMode: (state, action: PayloadAction<boolean>) => {
            state.darkMode = action.payload;
            localStorage.setItem('darkMode', String(action.payload));
        },

        // Tab selection
        setSelectedTabIndex: (state, action: PayloadAction<number>) => {
            state.selectedTabIndex = action.payload;
        },

        // Fullscreen mode
        toggleFullscreenMode: (state) => {
            state.fullscreenMode = !state.fullscreenMode;
        },
        setFullscreenMode: (state, action: PayloadAction<boolean>) => {
            state.fullscreenMode = action.payload;
        },

        // Modal management
        openModal: (state, action: PayloadAction<{ type: string; props?: Record<string, any> }>) => {
            state.modal = {
                open: true,
                type: action.payload.type,
                props: action.payload.props || null
            };
        },
        closeModal: (state) => {
            state.modal = {
                open: false,
                type: null,
                props: null
            };
        },
        updateModalProps: (state, action: PayloadAction<Record<string, any>>) => {
            if (state.modal.props) {
                state.modal.props = {
                    ...state.modal.props,
                    ...action.payload
                };
            } else {
                state.modal.props = action.payload;
            }
        }
    }
});

export const {
    addNotification,
    removeNotification,
    clearNotifications,
    toggleSidebar,
    setSidebarOpen,
    toggleDarkMode,
    setDarkMode,
    setSelectedTabIndex,
    toggleFullscreenMode,
    setFullscreenMode,
    openModal,
    closeModal,
    updateModalProps
} = uiSlice.actions;

export default uiSlice.reducer;