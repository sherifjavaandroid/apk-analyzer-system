// frontend/src/store/slices/reportsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

// Types
interface Report {
    id: string;
    title: string;
    description: string;
    created_at: string;
    updated_at: string;
    report_type: string;
    format: string;
    status: string;
    owner_id: string;
    data: Record<string, any>;
    analysis_ids: string[];
}

interface ReportTemplate {
    id: string;
    name: string;
    description: string;
    report_type: string;
    format: string;
    template_data: Record<string, any>;
}

interface GenerateReportRequest {
    title: string;
    description?: string;
    report_type: string;
    format: string;
    template_id?: string;
    analysis_ids: string[];
    options?: Record<string, any>;
}

interface ReportsState {
    reports: Report[];
    currentReport: Report | null;
    templates: ReportTemplate[];
    loading: boolean;
    generating: boolean;
    error: string | null;
}

// Initial state
const initialState: ReportsState = {
    reports: [],
    currentReport: null,
    templates: [],
    loading: false,
    generating: false,
    error: null
};

// Async thunks
export const getReports = createAsyncThunk(
    'reports/getReports',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/reports`);
            return response.data.reports;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch reports');
        }
    }
);

export const getReport = createAsyncThunk(
    'reports/getReport',
    async (reportId: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/reports/${reportId}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch report');
        }
    }
);

export const generateReport = createAsyncThunk(
    'reports/generateReport',
    async (request: GenerateReportRequest, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/reports/generate`, request);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to generate report');
        }
    }
);

export const getReportTemplates = createAsyncThunk(
    'reports/getTemplates',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/reports/templates`);
            return response.data.templates;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch report templates');
        }
    }
);

export const deleteReport = createAsyncThunk(
    'reports/deleteReport',
    async (reportId: string, { rejectWithValue }) => {
        try {
            await axios.delete(`${API_BASE_URL}/api/reports/${reportId}`);
            return reportId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to delete report');
        }
    }
);

// Reports slice
const reportsSlice = createSlice({
    name: 'reports',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearCurrentReport: (state) => {
            state.currentReport = null;
        }
    },
    extraReducers: (builder) => {
        // Get Reports
        builder.addCase(getReports.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(getReports.fulfilled, (state, action) => {
            state.loading = false;
            state.reports = action.payload;
        });
        builder.addCase(getReports.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Get Report
        builder.addCase(getReport.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(getReport.fulfilled, (state, action) => {
            state.loading = false;
            state.currentReport = action.payload;
        });
        builder.addCase(getReport.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Generate Report
        builder.addCase(generateReport.pending, (state) => {
            state.generating = true;
            state.error = null;
        });
        builder.addCase(generateReport.fulfilled, (state, action) => {
            state.generating = false;
            state.currentReport = action.payload;
            state.reports.push(action.payload);
        });
        builder.addCase(generateReport.rejected, (state, action) => {
            state.generating = false;
            state.error = action.payload as string;
        });

        // Get Report Templates
        builder.addCase(getReportTemplates.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(getReportTemplates.fulfilled, (state, action) => {
            state.loading = false;
            state.templates = action.payload;
        });
        builder.addCase(getReportTemplates.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Delete Report
        builder.addCase(deleteReport.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(deleteReport.fulfilled, (state, action) => {
            state.loading = false;
            state.reports = state.reports.filter(report => report.id !== action.payload);
            if (state.currentReport && state.currentReport.id === action.payload) {
                state.currentReport = null;
            }
        });
        builder.addCase(deleteReport.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
    }
});

export const { clearError, clearCurrentReport } = reportsSlice.actions;
export default reportsSlice.reducer;