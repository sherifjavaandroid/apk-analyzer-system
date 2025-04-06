// frontend/src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';

// Import reducers
import authReducer from './slices/authSlice';
import apkAnalysisReducer from './slices/apkAnalysisSlice';
import githubAnalysisReducer from './slices/githubAnalysisSlice';
import aiAnalysisReducer from './slices/aiAnalysisSlice';
import reportsReducer from './slices/reportsSlice';
import uiReducer from './slices/uiSlice';

// Create store
const store = configureStore({
    reducer: {
        auth: authReducer,
        apkAnalysis: apkAnalysisReducer,
        githubAnalysis: githubAnalysisReducer,
        aiAnalysis: aiAnalysisReducer,
        reports: reportsReducer,
        ui: uiReducer,
    },
    // Add middleware here if needed
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: {
            // Ignore non-serializable values in specific action types
            ignoredActions: ['apkAnalysis/uploadApk/fulfilled'],
        },
    }),
});

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;