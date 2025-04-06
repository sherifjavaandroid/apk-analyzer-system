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