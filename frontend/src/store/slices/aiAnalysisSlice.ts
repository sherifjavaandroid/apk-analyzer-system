// frontend/src/store/slices/aiAnalysisSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

// Types
export enum AnalysisType {
    SECURITY = "security",
    VULNERABILITY = "vulnerability",
    CODE_QUALITY = "code_quality",
    PERFORMANCE = "performance",
    COMPLEXITY = "complexity",
    DEPENDENCIES = "dependencies",
    ARCHITECTURE = "architecture",
    RISK_ASSESSMENT = "risk_assessment",
    CUSTOM = "custom"
}

export enum ExplanationType {
    VULNERABILITY = "vulnerability",
    CODE = "code",
    ERROR = "error",
    CONCEPT = "concept",
    DEPENDENCY = "dependency",
    PATTERN = "pattern",
    ALGORITHM = "algorithm",
    CUSTOM = "custom"
}

export enum CodeType {
    FIX_VULNERABILITY = "fix_vulnerability",
    FIX_PERFORMANCE = "fix_performance",
    REFACTOR = "refactor",
    IMPLEMENT_FEATURE = "implement_feature",
    UNIT_TEST = "unit_test",
    DOCUMENTATION = "documentation",
    CUSTOM = "custom"
}

export enum AIProvider {
    OPENAI = "openai",
    ANTHROPIC = "anthropic",
    DEEPSEEK = "deepseek"
}

interface AIRequestBase {
    ai_provider: AIProvider;
    options?: Record<string, any>;
}

interface AIAnalysisRequest extends AIRequestBase {
    analysis_type: AnalysisType;
    data: Record<string, any>;
}

interface AIExplainRequest extends AIRequestBase {
    explanation_type: ExplanationType;
    data: Record<string, any>;
}

interface AICodeRequest extends AIRequestBase {
    code_type: CodeType;
    data: Record<string, any>;
}

interface AIResponse {
    id: string;
    status: string;
    created_at: string;
    completed_at?: string;
    error?: string;
    result?: Record<string, any>;
    request_type?: string;
}

interface AIAnalysisState {
    results: AIResponse[];
    currentResult: AIResponse | null;
    loading: boolean;
    processing: boolean;
    error: string | null;
}

// Initial state
const initialState: AIAnalysisState = {
    results: [],
    currentResult: null,
    loading: false,
    processing: false,
    error: null
};

// Async thunks
export const analyzeWithAI = createAsyncThunk(
    'aiAnalysis/analyze',
    async (request: AIAnalysisRequest, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/ai/analyze`, request);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'AI analysis failed');
        }
    }
);

export const explainWithAI = createAsyncThunk(
    'aiAnalysis/explain',
    async (request: AIExplainRequest, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/ai/explain`, request);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'AI explanation failed');
        }
    }
);

export const generateCodeWithAI = createAsyncThunk(
    'aiAnalysis/generateCode',
    async (request: AICodeRequest, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/ai/generate-code`, request);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'AI code generation failed');
        }
    }
);

export const getAIResult = createAsyncThunk(
    'aiAnalysis/getResult',
    async (resultId: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/ai/result/${resultId}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch AI result');
        }
    }
);

export const getAIResults = createAsyncThunk(
    'aiAnalysis/getResults',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/ai/results`);
            return response.data.results;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch AI results');
        }
    }
);

// AI Analysis slice
const aiAnalysisSlice = createSlice({
    name: 'aiAnalysis',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearCurrentResult: (state) => {
            state.currentResult = null;
        }
    },
    extraReducers: (builder) => {
        // Analyze with AI
        builder.addCase(analyzeWithAI.pending, (state) => {
            state.processing = true;
            state.error = null;
        });
        builder.addCase(analyzeWithAI.fulfilled, (state, action) => {
            state.processing = false;
            state.currentResult = action.payload;
        });
        builder.addCase(analyzeWithAI.rejected, (state, action) => {
            state.processing = false;
            state.error = action.payload as string;
        });

        // Explain with AI
        builder.addCase(explainWithAI.pending, (state) => {
            state.processing = true;
            state.error = null;
        });
        builder.addCase(explainWithAI.fulfilled, (state, action) => {
            state.processing = false;
            state.currentResult = action.payload;
        });
        builder.addCase(explainWithAI.rejected, (state, action) => {
            state.processing = false;
            state.error = action.payload as string;
        });

        // Generate Code with AI
        builder.addCase(generateCodeWithAI.pending, (state) => {
            state.processing = true;
            state.error = null;
        });
        builder.addCase(generateCodeWithAI.fulfilled, (state, action) => {
            state.processing = false;
            state.currentResult = action.payload;
        });
        builder.addCase(generateCodeWithAI.rejected, (state, action) => {
            state.processing = false;
            state.error = action.payload as string;
        });

        // Get AI Result
        builder.addCase(getAIResult.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(getAIResult.fulfilled, (state, action) => {
            state.loading = false;
            state.currentResult = action.payload;
        });
        builder.addCase(getAIResult.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Get AI Results
        builder.addCase(getAIResults.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(getAIResults.fulfilled, (state, action) => {
            state.loading = false;
            state.results = action.payload;
        });
        builder.addCase(getAIResults.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
    }
});

export const { clearError, clearCurrentResult } = aiAnalysisSlice.actions;
export default aiAnalysisSlice.reducer;