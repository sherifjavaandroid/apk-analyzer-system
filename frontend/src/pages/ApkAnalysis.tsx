// frontend/src/pages/ApkAnalysis.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Tab,
    Tabs,
    Button,
    Paper,
    Grid,
    Card,
    CardContent,
    CardHeader,
    Divider,
    LinearProgress,
    CircularProgress,
    Alert,
    IconButton,
    useTheme,
    Stack
} from '@mui/material';
import {
    CloudUpload,
    Refresh,
    FilterList,
    Android,
    Security,
    Speed,
    Code
} from '@mui/icons-material';

// Components
import ApkUploader from '../components/apk-analysis/ApkUploader';
import ApkInfoPanel from '../components/apk-analysis/ApkInfoPanel';
import SecurityPanel from '../components/apk-analysis/SecurityPanel';
import PerformancePanel from '../components/apk-analysis/PerformancePanel';
import TechnologyPanel from '../components/apk-analysis/TechnologyPanel';
import ApkAnalysisList from '../components/apk-analysis/ApkAnalysisList';

// Redux
import { RootState, AppDispatch } from '../store';
import {
    uploadApk,
    getAnalyses,
    getAnalysisResult,
    clearCurrentAnalysis
} from '../store/slices/apkAnalysisSlice';

// Constants
import { MAX_APK_FILE_SIZE, ALLOWED_APK_TYPES } from '../config';

// Interface for tab panels
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`apk-analysis-tabpanel-${index}`}
            aria-labelledby={`apk-analysis-tab-${index}`}
            {...other}
            style={{ width: '100%' }}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
};

const ApkAnalysis: React.FC = () => {
    const theme = useTheme();
    const dispatch = useDispatch<AppDispatch>();

    const { analyses, currentAnalysis, loading, error, uploading, progress } = useSelector(
        (state: RootState) => state.apkAnalysis
    );

    const [tabValue, setTabValue] = useState(0);
    const [showUploader, setShowUploader] = useState(true);

    // Fetch analyses on component mount
    useEffect(() => {
        dispatch(getAnalyses());
    }, [dispatch]);

    // Poll for analysis status if it's still processing
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (currentAnalysis && currentAnalysis.status === 'processing') {
            intervalId = setInterval(() => {
                dispatch(getAnalysisResult(currentAnalysis.id));
            }, 5000); // Poll every 5 seconds
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [currentAnalysis, dispatch]);

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleFileUpload = (file: File) => {
        dispatch(uploadApk(file));
        setShowUploader(false);
    };

    const handleRefresh = () => {
        dispatch(getAnalyses());
    };

    const handleAnalysisSelect = (analysisId: string) => {
        dispatch(getAnalysisResult(analysisId));
        setShowUploader(false);
    };

    const handleNewAnalysis = () => {
        dispatch(clearCurrentAnalysis());
        setShowUploader(true);
        setTabValue(0);
    };

    // Check if analysis has completed and has results
    const hasResults = currentAnalysis &&
        currentAnalysis.status === 'completed' &&
        currentAnalysis.results;

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    APK Analysis
                </Typography>
                <Box>
                    <Button
                        variant="contained"
                        startIcon={<CloudUpload />}
                        onClick={handleNewAnalysis}
                        sx={{ mr: 2 }}
                    >
                        New Analysis
                    </Button>
                    <IconButton onClick={handleRefresh} disabled={loading}>
                        <Refresh />
                    </IconButton>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Left panel - Analysis list */}
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardHeader
                            title="Recent Analyses"
                            titleTypographyProps={{ variant: 'h6' }}
                            action={
                                <IconButton>
                                    <FilterList />
                                </IconButton>
                            }
                        />
                        <Divider />
                        <CardContent sx={{ p: 0 }}>
                            <ApkAnalysisList
                                analyses={analyses}
                                onAnalysisSelect={handleAnalysisSelect}
                                selectedAnalysis={currentAnalysis?.id}
                                loading={loading}
                            />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right panel - Analysis content */}
                <Grid item xs={12} md={9}>
                    {/* Uploader or Analysis display */}
                    {showUploader ? (
                        <ApkUploader
                            onFileSelected={handleFileUpload}
                            maxSize={MAX_APK_FILE_SIZE}
                            allowedTypes={ALLOWED_APK_TYPES}
                            uploading={uploading}
                            progress={progress}
                        />
                    ) : (
                        <>
                            {uploading && (
                                <Paper sx={{ p: 2, mb: 3 }}>
                                    <Typography variant="body1" gutterBottom>
                                        Uploading and analyzing APK file...
                                    </Typography>
                                    <LinearProgress variant="determinate" value={progress} sx={{ mb: 1 }} />
                                    <Typography variant="caption" color="text.secondary">
                                        {progress}% complete
                                    </Typography>
                                </Paper>
                            )}

                            {currentAnalysis && currentAnalysis.status === 'processing' && (
                                <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center' }}>
                                    <CircularProgress size={24} sx={{ mr: 2 }} />
                                    <Typography variant="body1">
                                        Analysis in progress. This may take a few minutes...
                                    </Typography>
                                </Paper>
                            )}

                            {currentAnalysis && (
                                <Paper sx={{ mb: 3 }}>
                                    <Tabs
                                        value={tabValue}
                                        onChange={handleTabChange}
                                        variant="scrollable"
                                        scrollButtons="auto"
                                        sx={{ borderBottom: 1, borderColor: 'divider' }}
                                    >
                                        <Tab
                                            label="Overview"
                                            icon={<Android />}
                                            iconPosition="start"
                                            disabled={!hasResults}
                                        />
                                        <Tab
                                            label="Security"
                                            icon={<Security />}
                                            iconPosition="start"
                                            disabled={!hasResults}
                                        />
                                        <Tab
                                            label="Performance"
                                            icon={<Speed />}
                                            iconPosition="start"
                                            disabled={!hasResults}
                                        />
                                        <Tab
                                            label="Technology"
                                            icon={<Code />}
                                            iconPosition="start"
                                            disabled={!hasResults}
                                        />
                                    </Tabs>

                                    {/* Tab Content */}
                                    <TabPanel value={tabValue} index={0}>
                                        {hasResults ? (
                                            <ApkInfoPanel apkInfo={currentAnalysis.results?.apk_info} />
                                        ) : (
                                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                                <Typography variant="body1" color="text.secondary">
                                                    {currentAnalysis.status === 'failed'
                                                        ? 'Analysis failed. Please try again.'
                                                        : 'Analysis results not available yet.'}
                                                </Typography>
                                            </Box>
                                        )}
                                    </TabPanel>

                                    <TabPanel value={tabValue} index={1}>
                                        {hasResults ? (
                                            <SecurityPanel security={currentAnalysis.results?.security} />
                                        ) : (
                                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                                <Typography variant="body1" color="text.secondary">
                                                    Security results not available yet.
                                                </Typography>
                                            </Box>
                                        )}
                                    </TabPanel>

                                    <TabPanel value={tabValue} index={2}>
                                        {hasResults ? (
                                            <PerformancePanel performance={currentAnalysis.results?.performance} />
                                        ) : (
                                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                                <Typography variant="body1" color="text.secondary">
                                                    Performance results not available yet.
                                                </Typography>
                                            </Box>
                                        )}
                                    </TabPanel>

                                    <TabPanel value={tabValue} index={3}>
                                        {hasResults ? (
                                            <TechnologyPanel technology={currentAnalysis.results?.technology} />
                                        ) : (
                                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                                <Typography variant="body1" color="text.secondary">
                                                    Technology results not available yet.
                                                </Typography>
                                            </Box>
                                        )}
                                    </TabPanel>
                                </Paper>
                            )}

                            {!currentAnalysis && !uploading && (
                                <Paper sx={{ p: 3, textAlign: 'center' }}>
                                    <Stack spacing={2} alignItems="center">
                                        <Android color="primary" sx={{ fontSize: 48 }} />
                                        <Typography variant="h6">
                                            No Analysis Selected
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary">
                                            Select an analysis from the list or upload a new APK file.
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            startIcon={<CloudUpload />}
                                            onClick={handleNewAnalysis}
                                        >
                                            Upload APK
                                        </Button>
                                    </Stack>
                                </Paper>
                            )}
                        </>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

export default ApkAnalysis;