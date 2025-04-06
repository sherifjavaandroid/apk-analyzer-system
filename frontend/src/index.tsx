// frontend/src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

// Main App component
import App from './App';

// Redux store
import store from './store';

// Global styles
import './styles/index.css';

// Setup axios defaults
import { API_BASE_URL, AUTH_TOKEN_NAME } from './config';
axios.defaults.baseURL = API_BASE_URL;

// Add auth token to requests if available
const token = localStorage.getItem(AUTH_TOKEN_NAME);
if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Setup axios interceptors for handling errors globally
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle unauthorized errors (token expired, etc.)
        if (error.response && error.response.status === 401) {
            localStorage.removeItem(AUTH_TOKEN_NAME);
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <React.StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </Provider>
    </React.StrictMode>
);