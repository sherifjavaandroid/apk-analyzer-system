# frontend/src/store/slices/githubAnalysisSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

// Types
interface RepositoryInfo {
    name: string;
    owner: string;
    description?: string;
    default_branch: string;
    stars: number;
    forks: number;
    open_issues: number;
    language?: string;
    license?: string;
    size: number;
    last_commit?: string;
    created_at?: string;
    updated_at?: string;
}

interface RepositoryStructure {
    files_count: number;
    directories_count: number;
    size_bytes: number;
    languages: Record<string, number>;
    file_extensions: Record<string, number>;
    files: Array<{
        path: string;
        type: string;
        size?: number;
        extension?: string;
        language?: string;
    }>;
    top_directories: string[];
}

interface CodeQualityIssue {
    issue_id: string;
    severity: string;
    title: string;
    description: string;
    file_path?: string;
    line_number?: number;
    column?: number;
    source?: string;
    recommendation?: string;
}

interface CodeQualityResult {
    issues_count: number;
    quality_score: number;
    complexity_score: number;
    maintainability_score: number;
    test_coverage?: number;
    issues_by_severity: Record<string, number>;
    issues: CodeQualityIssue[];
    summary: Record<string, any>;
}

interface Dependency {
    name: string;
    current_version: string;
    latest_version?: string;
    is_outdated: boolean;
    dependency_type: string;
    ecosystem: string;
    license?: string;
    vulnerabilities: any[];
}

interface DependenciesResult {
    ecosystems_detected: string[];
    dependencies_count: number;
    direct_dependencies_count: number;
    outdated_dependencies_count: number;
    vulnerable_dependencies_count: number;
    dependencies: Dependency[];
    dependency_graph?: Record<string, string[]>;
    summary: Record<string, any>;
}

interface SecurityIssue {
    issue_id: string;
    severity: string;
    title: string;
    description: string;
    file_path?: string;
    line_number?: number;
    issue_type: string;
    recommendation?: string;
    cwe_id?: string;
    references: string[];
}

interface SecurityScanResult {
    risk_score: number;
    issues_count: number;
    secrets_found: number;
    vulnerabilities_found: number;
    misconfigurations_found: number;
    severity_counts: Record<string, number>;
    issues: SecurityIssue[];
    summary: Record<string, any>;
}

interface GithubAnalysisResults {
    repository_info?: RepositoryInfo;
    repository_structure?: RepositoryStructure;
    code_quality?: CodeQualityResult;
    dependencies?: DependenciesResult;
    security?: SecurityScanResult;
}

interface GithubAnalysisResponse {
    id: string;
    repository_url: string;
    branch: string;
    status: string;
    created_at: string;
    completed_at?: string;
    error?: string;
    results?: GithubAnalysisResults;
    options?: Record<string, any>;
}

interface GithubAnalysisState {
    analyses: GithubAnalysisResponse[];
    currentAnalysis: GithubAnalysisResponse | null;
    loading: boolean;
    analyzing: boolean;
    error: string | null;
}

// Request payload type
interface AnalyzeGithubRepoPayload {
    repository_url: string;
    branch?: string;
    options?: Record<string, any>;
}

// Initial state
const initialState: GithubAnalysisState = {
    analyses: [],
    currentAnalysis: null,
    loading: false,
    analyzing: false,
    error: null
};

// Async thunks
export const analyzeGithubRepo = createAsyncThunk(
    'githubAnalysis/analyzeRepo',
    async (payload: AnalyzeGithubRepoPayload, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/github/analyze`, payload);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Github repo analysis failed');
        }
    }
);

export const getGithubAnalyses = createAsyncThunk(
    'githubAnalysis/getAnalyses',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/github/analyses`);
            return response.data.analyses;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch analyses');
        }
    }
);

export const getGithubAnalysisResult = createAsyncThunk(
    'githubAnalysis/getAnalysisResult',
    async (analysisId: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/github/analysis/${analysisId}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch analysis result');
        }
    }
);

// Github Analysis slice
const githubAnalysisSlice = createSlice({
    name: 'githubAnalysis',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearCurrentAnalysis: (state) => {
            state.currentAnalysis = null;
        }
    },
    extraReducers: (builder) => {
        // Analyze Github Repo
        builder.addCase(analyzeGithubRepo.pending, (state) => {
            state.analyzing = true;
            state.error = null;
        });
        builder.addCase(analyzeGithubRepo.fulfilled, (state, action) => {
            state.analyzing = false;
            state.currentAnalysis = action.payload;
        });
        builder.addCase(analyzeGithubRepo.rejected, (state, action) => {
            state.analyzing = false;
            state.error = action.payload as string;
        });

        // Get Github Analyses
        builder.addCase(getGithubAnalyses.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(getGithubAnalyses.fulfilled, (state, action) => {
            state.loading = false;
            state.analyses = action.payload;
        });
        builder.addCase(getGithubAnalyses.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Get Github Analysis Result
        builder.addCase(getGithubAnalysisResult.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(getGithubAnalysisResult.fulfilled, (state, action) => {
            state.loading = false;
            state.currentAnalysis = action.payload;
        });
        builder.addCase(getGithubAnalysisResult.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
    }
});

export const { clearError, clearCurrentAnalysis } = githubAnalysisSlice.actions;
export default githubAnalysisSlice.reducer;