// frontend/src/config.ts

// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

// Authentication Configuration
export const AUTH_TOKEN_NAME = 'token';
export const AUTH_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// File Upload Configuration
export const MAX_APK_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const ALLOWED_APK_TYPES = ['application/vnd.android.package-archive'];

// Github Repository Analysis Configuration
export const GITHUB_MAX_REPO_SIZE = 1024 * 1024 * 1024; // 1GB

// AI Service Configuration
export const AI_PROVIDERS = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic Claude' },
    { value: 'deepseek', label: 'DeepSeek' }
];

export const AI_MODELS = {
    openai: [
        { value: 'gpt-4', label: 'GPT-4' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
    ],
    anthropic: [
        { value: 'claude-2', label: 'Claude 2' },
        { value: 'claude-instant', label: 'Claude Instant' }
    ],
    deepseek: [
        { value: 'deepseek-coder', label: 'DeepSeek Coder' }
    ]
};

// Reports Configuration
export const REPORT_FORMATS = [
    { value: 'pdf', label: 'PDF' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'html', label: 'HTML' },
    { value: 'sarif', label: 'SARIF' },
    { value: 'json', label: 'JSON' }
];

export const REPORT_TYPES = [
    { value: 'security', label: 'Security Report' },
    { value: 'performance', label: 'Performance Report' },
    { value: 'technology', label: 'Technology Analysis' },
    { value: 'comprehensive', label: 'Comprehensive Report' },
    { value: 'executive', label: 'Executive Summary' },
    { value: 'custom', label: 'Custom Report' }
];

// UI Configuration
export const DEFAULT_THEME = 'light';
export const SIDEBAR_WIDTH = 260;
export const TOPBAR_HEIGHT = 64;

// Chart color palettes
export const CHART_COLORS = {
    primary: [
        '#3F51B5', '#536DFE', '#8C9EFF', '#C5CAE9',
        '#7986CB', '#3949AB', '#303F9F', '#1A237E'
    ],
    severity: {
        critical: '#d32f2f',
        high: '#f44336',
        medium: '#ff9800',
        low: '#ffc107',
        info: '#2196f3'
    },
    status: {
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
        info: '#2196f3',
        pending: '#9e9e9e'
    },
    category: [
        '#673AB7', '#9C27B0', '#E91E63', '#F44336',
        '#FF9800', '#FFC107', '#FFEB3B', '#4CAF50',
        '#009688', '#00BCD4', '#03A9F4', '#2196F3'
    ]
};

// Feature Flags
export const FEATURES = {
    aiExplain: true,
    aiCodeGen: true,
    securitySimulation: false, // Advanced feature - not yet implemented
    collaborativeReports: true,
    customizedDashboards: false, // Premium feature
    automatedScanning: false,    // Premium feature
    integrations: {
        jira: true,
        github: true,
        gitlab: false,
        slack: true,
        teams: false
    }
};

// Error Messages
export const ERROR_MESSAGES = {
    networkError: 'Network error. Please check your internet connection.',
    serverError: 'Server error. Please try again later.',
    authError: 'Authentication error. Please log in again.',
    fileUploadError: 'File upload failed. Please try again.',
    fileSizeError: 'File size exceeds the maximum allowed size.',
    fileTypeError: 'Invalid file type. Only APK files are allowed.',
    repositoryError: 'Repository analysis failed. Please check the URL and try again.',
    aiError: 'AI analysis failed. Please try again later.',
    reportGenError: 'Report generation failed. Please try again.'
};