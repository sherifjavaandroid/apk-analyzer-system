// frontend/src/store/slices/apkAnalysisSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

// Types
interface ApkInfo {
    package_name: string | null;
    version_name: string | null;
    version_code: number | string | null;
    min_sdk_version: number | null;
    target_sdk_version: number | null;
    permissions: string[];
    activities: string[];
    services: string[];
    receivers: string[];
    providers: string[];
    file_size: number | null;
    dex_files: string[];
    resources: any;
    libraries: any[];
    assets: string[];
    icon: string | null;
    frameworks: any | null;
}

interface SecurityIssue {
    issue_id: string;
    severity: string;
    title: string;
    description: string;
    location?: string;
    line_number?: number;
    recommendation?: string;
    cvss_score?: number;
    references: string[];
}

interface SecurityScanResult {
    risk_score: number;
    issues_count: number;
    severity_counts: Record<string, number>;
    issues: SecurityIssue[];
}

interface PerformanceAnalysisResult {
    apk_size: any;
    startup_estimate: any;
    resource_usage: any;
    memory_usage: any;
    battery_impact: any;
    ui_performance: any;
}

interface TechnologyDetectionResult {
    frameworks: any;
    libraries: any;
    ui_toolkit: any;
    programming_languages: any;
    backend_technologies: any;
    analytics_services: any;
    ad_networks: any;
}

interface AnalysisResults {
    apk_info?: ApkInfo;
    security?: SecurityScanResult;
    performance?: PerformanceAnalysisResult;
    technology?: TechnologyDetectionResult;
}

interface AnalysisResponse {
    id: string;
    filename: string;
    status: string;
    created_at: string;
    completed_at?: string;
    error?: string;
    results?: AnalysisResults;
}

interface ApkAnalysisState {
    analyses: AnalysisResponse[];
    currentAnalysis: AnalysisResponse | null;
    loading: boolean;
    uploading: boolean;
    error: string | null;
    progress: number;
}

// Initial state
const initialState: ApkAnalysisState = {
    analyses: [],
    currentAnalysis: null,
    loading: false,
    uploading: false,
    error: null,
    progress: 0
};

// Async thunks
export const uploadApk = createAsyncThunk(
    'apkAnalysis/uploadApk',
    async (file: File, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent: any) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    // You would dispatch an action to update progress here in a real implementation
                }
            };

            const response = await axios.post(`${API_BASE_URL}/api/apk/analyze`, formData, config);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'APK upload failed');
        }
    }
);

export const getAnalyses = createAsyncThunk(
    'apkAnalysis/getAnalyses',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/apk/analyses`);
            return response.data.analyses;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch analyses');
        }
    }
);

export const getAnalysisResult = createAsyncThunk(
    'apkAnalysis/getAnalysisResult',
    async (analysisId: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/apk/analysis/${analysisId}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch analysis result');
        }
    }
);

// APK Analysis slice
const apkAnalysisSlice = createSlice({
    name: 'apkAnalysis',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearCurrentAnalysis: (state) => {
            state.currentAnalysis = null;
        },
        updateProgress: (state, action) => {
            state.progress = action.payload;
        }
    },
    extraReducers: (builder) => {
        // Upload APK
        builder.addCase(uploadApk.pending, (state) => {
            state.uploading = true;
            state.error = null;
            state.progress = 0;
        });
        builder.addCase(uploadApk.fulfilled, (state, action) => {
            state.uploading = false;
            state.currentAnalysis = action.payload;
            state.progress = 100;
            // Add to analyses list if not already there
            if (!state.analyses.some(analysis => analysis.id === action.payload.id)) {
                state.analyses.unshift(action.payload);
            }
        });
        builder.addCase(uploadApk.rejected, (state, action) => {
            state.uploading = false;
            state.error = action.payload as string;
            state.progress = 0;
        });

        // Get Analyses
        builder.addCase(getAnalyses.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(getAnalyses.fulfilled, (state, action) => {
            state.loading = false;
            state.analyses = action.payload;
        });
        builder.addCase(getAnalyses.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Get Analysis Result
        builder.addCase(getAnalysisResult.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(getAnalysisResult.fulfilled, (state, action) => {
            state.loading = false;
            state.currentAnalysis = action.payload;

            // Update the analysis in the analyses list
            const index = state.analyses.findIndex(analysis => analysis.id === action.payload.id);
            if (index !== -1) {
                state.analyses[index] = action.payload;
            }
        });
        builder.addCase(getAnalysisResult.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
    }
});

export const { clearError, clearCurrentAnalysis, updateProgress } = apkAnalysisSlice.actions;
export default apkAnalysisSlice.reducer;