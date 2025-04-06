// frontend/src/pages/Reports.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Card,
    CardContent,
    CardHeader,
    CardActions,
    Button,
    Divider,
    IconButton,
    TextField,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    Chip,
    CircularProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    Alert,
    Snackbar,
    useTheme,
    SelectChangeEvent
} from '@mui/material';
import {
    Description as DescriptionIcon,
    PictureAsPdf as PdfIcon,
    Code as CodeIcon,
    InsertDriveFile as FileIcon,
    Article as ArticleIcon,
    FilterList as FilterListIcon,
    Search as SearchIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    ArrowRight as ArrowRightIcon
} from '@mui/icons-material';

// Redux
import { RootState, AppDispatch } from '../store';
import {
    getReports,
    getReport,
    generateReport,
    getReportTemplates,
    deleteReport
} from '../store/slices/reportsSlice';
import { getAnalyses } from '../store/slices/apkAnalysisSlice';
import { getGithubAnalyses } from '../store/slices/githubAnalysisSlice';

// Config
import { REPORT_FORMATS, REPORT_TYPES } from '../config';

// Types
interface ReportGenerateForm {
    title: string;
    description: string;
    reportType: string;
    format: string;
    templateId?: string;
    analysisIds: string[];
}

const Reports: React.FC = () => {
    const theme = useTheme();
    const dispatch = useDispatch<AppDispatch>();

    // Redux state
    const { reports, templates, currentReport, loading, generating, error } = useSelector(
        (state: RootState) => state.reports
    );
    const { analyses: apkAnalyses } = useSelector(
        (state: RootState) => state.apkAnalysis
    );
    const { analyses: githubAnalyses } = useSelector(
        (state: RootState) => state.githubAnalysis
    );

    // Local state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<string | null>(null);
    const [formData, setFormData] = useState<ReportGenerateForm>({
        title: '',
        description: '',
        reportType: 'comprehensive',
        format: 'pdf',
        analysisIds: []
    });
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

    // Combined analyses for selection
    const allAnalyses = [
        ...apkAnalyses.map(a => ({ id: a.id, name: (a as any).filename || 'APK Analysis', type: 'APK' })),
        ...githubAnalyses.map(a => ({
            id: a.id,
            name: (a as any).repository_url ? (a as any).repository_url.split('/').slice(-2).join('/') : 'GitHub Analysis',
            type: 'GitHub'
        }))
    ];

    // Fetch data on component mount
    useEffect(() => {
        dispatch(getReports());
        dispatch(getReportTemplates());
        dispatch(getAnalyses());
        dispatch(getGithubAnalyses());
    }, [dispatch]);

    // Handle dialog open
    const handleOpenDialog = () => {
        setDialogOpen(true);
    };

    // Handle dialog close
    const handleCloseDialog = () => {
        setDialogOpen(false);
    };

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Handle select changes
    const handleSelectChange = (e: SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Handle multiple select changes (analysis IDs)
    const handleAnalysisChange = (e: SelectChangeEvent<string[]>) => {
        const value = e.target.value as string[];
        setFormData({
            ...formData,
            analysisIds: value
        });
    };

    // Handle report generation
    const handleGenerateReport = () => {
        dispatch(generateReport({
            title: formData.title,
            description: formData.description,
            report_type: formData.reportType,
            format: formData.format,
            template_id: formData.templateId,
            analysis_ids: formData.analysisIds
        })).then((result) => {
            if (result.meta.requestStatus === 'fulfilled') {
                setSnackbarMessage('Report generated successfully');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
                handleCloseDialog();
            } else {
                setSnackbarMessage('Failed to generate report');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
            }
        });
    };

    // Handle report selection
    const handleReportSelect = (reportId: string) => {
        setSelectedReport(reportId);
        dispatch(getReport(reportId));
    };

    // Handle report deletion
    const handleDeleteReport = (reportId: string) => {
        if (window.confirm('Are you sure you want to delete this report?')) {
            dispatch(deleteReport(reportId)).then((result) => {
                if (result.meta.requestStatus === 'fulfilled') {
                    setSnackbarMessage('Report deleted successfully');
                    setSnackbarSeverity('success');
                    setSnackbarOpen(true);
                    if (selectedReport === reportId) {
                        setSelectedReport(null);
                    }
                } else {
                    setSnackbarMessage('Failed to delete report');
                    setSnackbarSeverity('error');
                    setSnackbarOpen(true);
                }
            });
        }
    };

    // Handle refresh
    const handleRefresh = () => {
        dispatch(getReports());
    };

    // Get report icon based on format
    const getReportIcon = (format: string) => {
        switch (format) {
            case 'pdf':
                return <PdfIcon />;
            case 'markdown':
                return <ArticleIcon />;
            case 'html':
                return <CodeIcon />;
            case 'sarif':
            case 'json':
                return <CodeIcon />;
            default:
                return <FileIcon />;
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Reports
                </Typography>
                <Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenDialog}
                        sx={{ mr: 2 }}
                    >
                        Generate Report
                    </Button>
                    <IconButton onClick={handleRefresh} disabled={loading}>
                        <RefreshIcon />
                    </IconButton>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Left panel - Reports list */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardHeader
                            title="Report Library"
                            titleTypographyProps={{ variant: 'h6' }}
                            action={
                                <Box sx={{ display: 'flex' }}>
                                    <IconButton size="small">
                                        <FilterListIcon />
                                    </IconButton>
                                    <IconButton size="small">
                                        <SearchIcon />
                                    </IconButton>
                                </Box>
                            }
                        />
                        <Divider />
                        <CardContent sx={{ p: 0 }}>
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                    <CircularProgress size={24} />
                                </Box>
                            ) : reports.length === 0 ? (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        No reports found. Generate a new report to get started.
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        startIcon={<AddIcon />}
                                        onClick={handleOpenDialog}
                                        sx={{ mt: 2 }}
                                    >
                                        Generate Report
                                    </Button>
                                </Box>
                            ) : (
                                <List disablePadding>
                                    {reports.map((report, index) => (
                                        <React.Fragment key={report.id}>
                                            {index > 0 && <Divider />}
                                            <ListItem
                                                button
                                                selected={selectedReport === report.id}
                                                onClick={() => handleReportSelect(report.id)}
                                            >
                                                <ListItemIcon>
                                                    {getReportIcon(report.format)}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={report.title}
                                                    secondary={
                                                        <>
                                                            {report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)}{' '}
                                                            • {new Date(report.created_at).toLocaleDateString()}
                                                        </>
                                                    }
                                                />
                                                <ListItemSecondaryAction>
                                                    <IconButton
                                                        edge="end"
                                                        onClick={() => handleDeleteReport(report.id)}
                                                        size="small"
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                        </React.Fragment>
                                    ))}
                                </List>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right panel - Report details */}
                <Grid item xs={12} md={8}>
                    {currentReport ? (
                        <Card>
                            <CardHeader
                                title={currentReport.title}
                                titleTypographyProps={{ variant: 'h6' }}
                                subheader={`Generated on ${new Date(currentReport.created_at).toLocaleDateString()}`}
                                avatar={getReportIcon(currentReport.format)}
                                action={
                                    <Button
                                        variant="outlined"
                                        startIcon={<DownloadIcon />}
                                        size="small"
                                    >
                                        Download {currentReport.format.toUpperCase()}
                                    </Button>
                                }
                            />
                            <Divider />
                            <CardContent>
                                <Typography variant="body2" paragraph>
                                    {currentReport.description || 'No description provided.'}
                                </Typography>

                                {/* Report type and format */}
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid item xs={6}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Report Type
                                        </Typography>
                                        <Chip
                                            label={currentReport.report_type.charAt(0).toUpperCase() + currentReport.report_type.slice(1)}
                                            color="primary"
                                            variant="outlined"
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Format
                                        </Typography>
                                        <Chip
                                            label={currentReport.format.toUpperCase()}
                                            color="secondary"
                                            variant="outlined"
                                        />
                                    </Grid>
                                </Grid>

                                {/* Report preview - simplified placeholder */}
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 3,
                                        minHeight: 300,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                        backgroundColor: theme.palette.background.default
                                    }}
                                >
                                    <DescriptionIcon sx={{ fontSize: 48, color: theme.palette.text.secondary, mb: 2 }} />
                                    <Typography variant="body1" align="center" gutterBottom>
                                        Report Preview
                                    </Typography>
                                    <Typography variant="body2" align="center" color="text.secondary">
                                        Download the report to view its full content.
                                    </Typography>
                                </Paper>
                            </CardContent>
                            <Divider />
                            <CardActions>
                                <Button
                                    startIcon={<DeleteIcon />}
                                    color="error"
                                    onClick={() => handleDeleteReport(currentReport.id)}
                                >
                                    Delete Report
                                </Button>
                            </CardActions>
                        </Card>
                    ) : (
                        <Paper sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <DescriptionIcon sx={{ fontSize: 64, color: theme.palette.text.secondary, mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                No Report Selected
                            </Typography>
                            <Typography variant="body1" color="text.secondary" gutterBottom>
                                Select a report from the list or generate a new report to view its details.
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={handleOpenDialog}
                                sx={{ mt: 2, alignSelf: 'center' }}
                            >
                                Generate New Report
                            </Button>
                        </Paper>
                    )}
                </Grid>
            </Grid>

            {/* Generate Report Dialog */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>Generate New Report</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Report Title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                multiline
                                rows={3}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Report Type</InputLabel>
                                <Select
                                    name="reportType"
                                    value={formData.reportType}
                                    label="Report Type"
                                    onChange={handleSelectChange}
                                >
                                    {REPORT_TYPES.map((type) => (
                                        <MenuItem key={type.value} value={type.value}>
                                            {type.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Format</InputLabel>
                                <Select
                                    name="format"
                                    value={formData.format}
                                    label="Format"
                                    onChange={handleSelectChange}
                                >
                                    {REPORT_FORMATS.map((format) => (
                                        <MenuItem key={format.value} value={format.value}>
                                            {format.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Select Analyses</InputLabel>
                                <Select
                                    name="analysisIds"
                                    multiple
                                    value={formData.analysisIds}
                                    label="Select Analyses"
                                    onChange={handleAnalysisChange}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {(selected as string[]).map((value) => {
                                                const analysis = allAnalyses.find(a => a.id === value);
                                                return (
                                                    <Chip
                                                        key={value}
                                                        label={analysis ? `${analysis.type}: ${analysis.name}` : value}
                                                        size="small"
                                                    />
                                                );
                                            })}
                                        </Box>
                                    )}
                                >
                                    {allAnalyses.map((analysis) => (
                                        <MenuItem key={analysis.id} value={analysis.id}>
                                            <Typography variant="body2">
                                                <strong>{analysis.type}:</strong> {analysis.name}
                                            </Typography>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        {templates.length > 0 && (
                            <Grid item xs={12}>
                                <FormControl fullWidth margin="normal">
                                    <InputLabel>Template (Optional)</InputLabel>
                                    <Select
                                        name="templateId"
                                        value={formData.templateId || ''}
                                        label="Template (Optional)"
                                        onChange={handleSelectChange}
                                    >
                                        <MenuItem value="">
                                            <em>None</em>
                                        </MenuItem>
                                        {templates.map((template) => (
                                            <MenuItem key={template.id} value={template.id}>
                                                {template.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGenerateReport}
                        variant="contained"
                        color="primary"
                        disabled={generating || !formData.title || formData.analysisIds.length === 0}
                        startIcon={generating ? <CircularProgress size={20} /> : <DescriptionIcon />}
                    >
                        {generating ? 'Generating...' : 'Generate Report'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={5000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbarOpen(false)}
                    severity={snackbarSeverity}
                    variant="filled"
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Reports;