// frontend/src/components/github-analysis/GithubRepoForm.tsx
import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    CircularProgress,
    Alert,
    Divider,
    FormControl,
    FormControlLabel,
    Checkbox,
    Grid,
    Stack,
    useTheme
} from '@mui/material';
import {
    GitHub as GitHubIcon,
    Search as SearchIcon,
    Folder as FolderIcon,
    VerifiedUser as VerifiedUserIcon,
    BugReport as BugReportIcon,
    BarChart as BarChartIcon
} from '@mui/icons-material';

interface GithubRepoFormProps {
    onSubmit: (repoUrl: string, branch: string) => void;
    analyzing: boolean;
}

const GithubRepoForm: React.FC<GithubRepoFormProps> = ({ onSubmit, analyzing }) => {
    const theme = useTheme();

    const [repoUrl, setRepoUrl] = useState('');
    const [branch, setBranch] = useState('main');
    const [error, setError] = useState<string | null>(null);

    const [includeSecurity, setIncludeSecurity] = useState(true);
    const [includeCodeQuality, setIncludeCodeQuality] = useState(true);
    const [includeDependencies, setIncludeDependencies] = useState(true);

    // Validate repository URL
    const validateRepo = (): boolean => {
        if (!repoUrl) {
            setError('Repository URL is required');
            return false;
        }

        // Check if URL is a valid GitHub URL
        const githubRegex = /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/;
        if (!githubRegex.test(repoUrl)) {
            setError('Invalid GitHub repository URL. Format should be: https://github.com/owner/repo');
            return false;
        }

        setError(null);
        return true;
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (validateRepo()) {
            onSubmit(repoUrl, branch);
        }
    };

    return (
        <Paper
            sx={{
                p: 3,
                width: '100%',
                height: '100%',
                minHeight: 400,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Typography variant="h6" gutterBottom>
                GitHub Repository Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter a GitHub repository URL to analyze its code quality, security issues, and dependencies.
            </Typography>

            <Divider sx={{ mb: 3 }} />

            {/* Error alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Repository form */}
            <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="GitHub Repository URL"
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            placeholder="https://github.com/owner/repo"
                            variant="outlined"
                            required
                            disabled={analyzing}
                            InputProps={{
                                startAdornment: <GitHubIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                            }}
                            helperText="Example: https://github.com/facebook/react"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Branch Name"
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            placeholder="main"
                            variant="outlined"
                            disabled={analyzing}
                            helperText="Leave empty for default branch"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            disabled={analyzing}
                            startIcon={analyzing ? <CircularProgress size={20} /> : <SearchIcon />}
                            sx={{ height: '56px' }}
                        >
                            {analyzing ? 'Analyzing...' : 'Analyze Repository'}
                        </Button>
                    </Grid>
                </Grid>
            </Box>

            <Typography variant="subtitle2" gutterBottom>
                Analysis Options
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={includeCodeQuality}
                                onChange={(e) => setIncludeCodeQuality(e.target.checked)}
                                color="primary"
                            />
                        }
                        label="Code Quality"
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={includeSecurity}
                                onChange={(e) => setIncludeSecurity(e.target.checked)}
                                color="primary"
                            />
                        }
                        label="Security Analysis"
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={includeDependencies}
                                onChange={(e) => setIncludeDependencies(e.target.checked)}
                                color="primary"
                            />
                        }
                        label="Dependencies"
                    />
                </Grid>
            </Grid>

            <Divider sx={{ mb: 3 }} />

            {/* Features explanation */}
            <Typography variant="subtitle2" gutterBottom>
                Analysis Features
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <VerifiedUserIcon color="primary" />
                            <Box>
                                <Typography variant="subtitle2">Security Analysis</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Detects vulnerabilities, secrets, and security misconfigurations
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <BugReportIcon color="secondary" />
                            <Box>
                                <Typography variant="subtitle2">Code Quality</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Analyzes code complexity, maintainability, and best practices
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <FolderIcon color="info" />
                            <Box>
                                <Typography variant="subtitle2">Repository Structure</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Provides insights into the repository organization and content
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <BarChartIcon color="success" />
                            <Box>
                                <Typography variant="subtitle2">Dependencies</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Analyzes dependencies, versions, and vulnerabilities
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default GithubRepoForm;