// frontend/src/pages/GithubAnalysis.tsx
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
    TextField,
    CircularProgress,
    Alert,
    IconButton,
    Stack,
    useTheme
} from '@mui/material';
import {
    GitHub as GitHubIcon,
    Refresh,
    Search,
    Code,
    Security,
    Article,
    BarChart,
    FilterList
} from '@mui/icons-material';

// Components
import GithubRepoForm from '../components/github-analysis/GithubRepoForm';
import GithubRepoInfo from '../components/github-analysis/GithubRepoInfo';
import CodeQualityPanel from '../components/github-analysis/CodeQualityPanel';
import SecurityIssuesPanel from '../components/github-analysis/SecurityIssuesPanel';
import DependenciesPanel from '../components/github-analysis/DependenciesPanel';
import GithubAnalysisList from '../components/github-analysis/GithubAnalysisList';

// Redux
import { RootState, AppDispatch } from '../store';
import {
    analyzeGithubRepo,
    getGithubAnalyses,
    getGithubAnalysisResult,
    clearCurrentAnalysis
} from '../store/slices/githubAnalysisSlice';

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
            id={`github-analysis-tabpanel-${index}`}
            aria-labelledby={`github-analysis-tab-${index}`}
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

const GithubAnalysis: React.FC = () => {
    const theme = useTheme();
    const dispatch = useDispatch<AppDispatch>();

    const { analyses, currentAnalysis, loading, analyzing, error } = useSelector(
        (state: RootState) => state.githubAnalysis
    );

    const [tabValue, setTabValue] = useState(0);
    const [showRepoForm, setShowRepoForm] = useState(true);

    // Fetch analyses on component mount
    useEffect(() => {
        dispatch(getGithubAnalyses());
    }, [dispatch]);

    // Poll for analysis status if it's still processing
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (currentAnalysis && currentAnalysis.status === 'processing') {
            intervalId = setInterval(() => {
                dispatch(getGithubAnalysisResult(currentAnalysis.id));
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

    const handleRepoSubmit = (repoUrl: string, branch: string = 'main') => {
        dispatch(analyzeGithubRepo({ repository_url: repoUrl, branch }));
        setShowRepoForm(false);
    };

    const handleRefresh = () => {
        dispatch(getGithubAnalyses());
    };

    const handleAnalysisSelect = (analysisId: string) => {
        dispatch(getGithubAnalysisResult(analysisId));
        setShowRepoForm(false);
    };

    const handleNewAnalysis = () => {
        dispatch(clearCurrentAnalysis());
        setShowRepoForm(true);
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
                    GitHub Repository Analysis
                </Typography>
                <Box>
                    <Button
                        variant="contained"
                        startIcon={<GitHubIcon />}
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
                            <GithubAnalysisList
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
                    {/* Repository form or Analysis display */}
                    {showRepoForm ? (
                        <GithubRepoForm
                            onSubmit={handleRepoSubmit}
                            analyzing={analyzing}
                        />
                    ) : (
                        <>
                            {analyzing && (
                                <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center' }}>
                                    <CircularProgress size={24} sx={{ mr: 2 }} />
                                    <Typography variant="body1">
                                        Analyzing repository. This may take a few minutes...
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
                                            icon={<GitHubIcon />}
                                            iconPosition="start"
                                            disabled={!hasResults}
                                        />
                                        <Tab
                                            label="Code Quality"
                                            icon={<Code />}
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
                                            label="Dependencies"
                                            icon={<Article />}
                                            iconPosition="start"
                                            disabled={!hasResults}
                                        />
                                    </Tabs>

                                    {/* Tab Content */}
                                    <TabPanel value={tabValue} index={0}>
                                        {hasResults ? (
                                            <GithubRepoInfo
                                                repoInfo={currentAnalysis.results?.repository_info}
                                                repoStructure={currentAnalysis.results?.repository_structure}
                                            />
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
                                            <CodeQualityPanel codeQuality={currentAnalysis.results?.code_quality} />
                                        ) : (
                                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                                <Typography variant="body1" color="text.secondary">
                                                    Code quality results not available yet.
                                                </Typography>
                                            </Box>
                                        )}
                                    </TabPanel>

                                    <TabPanel value={tabValue} index={2}>
                                        {hasResults ? (
                                            <SecurityIssuesPanel security={currentAnalysis.results?.security} />
                                        ) : (
                                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                                <Typography variant="body1" color="text.secondary">
                                                    Security results not available yet.
                                                </Typography>
                                            </Box>
                                        )}
                                    </TabPanel>

                                    <TabPanel value={tabValue} index={3}>
                                        {hasResults ? (
                                            <DependenciesPanel dependencies={currentAnalysis.results?.dependencies} />
                                        ) : (
                                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                                <Typography variant="body1" color="text.secondary">
                                                    Dependencies results not available yet.
                                                </Typography>
                                            </Box>
                                        )}
                                    </TabPanel>
                                </Paper>
                            )}

                            {!currentAnalysis && !analyzing && (
                                <Paper sx={{ p: 3, textAlign: 'center' }}>
                                    <Stack spacing={2} alignItems="center">
                                        <GitHubIcon color="primary" sx={{ fontSize: 48 }} />
                                        <Typography variant="h6">
                                            No Analysis Selected
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary">
                                            Select an analysis from the list or analyze a new GitHub repository.
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            startIcon={<GitHubIcon />}
                                            onClick={handleNewAnalysis}
                                        >
                                            Analyze Repository
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

export default GithubAnalysis;