// frontend/src/components/github-analysis/CodeQualityPanel.tsx
import React, { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Card,
    CardContent,
    CardHeader,
    Divider,
    Chip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    LinearProgress,
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TablePagination,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Stack,
    Tooltip,
    IconButton,
    useTheme
} from '@mui/material';
import {
    Code as CodeIcon,
    BugReport as BugReportIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    CheckCircle as CheckCircleIcon,
    ExpandMore as ExpandMoreIcon,
    TextSnippet as TextSnippetIcon,
    Description as DescriptionIcon,
    Speed as SpeedIcon,
    InsertChart as InsertChartIcon,
    FilterList as FilterListIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// Types
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

interface CodeQualityPanelProps {
    codeQuality?: CodeQualityResult;
}

const CodeQualityPanel: React.FC<CodeQualityPanelProps> = ({ codeQuality }) => {
    const theme = useTheme();

    // State for issues table
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [filter, setFilter] = useState<string | null>(null);
    const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

    if (!codeQuality) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                    Code quality analysis results not available.
                </Typography>
            </Box>
        );
    }

    // Calculate severity color
    const getSeverityColor = (severity: string): string => {
        switch (severity.toLowerCase()) {
            case 'high':
                return theme.palette.error.main;
            case 'medium':
                return theme.palette.warning.main;
            case 'low':
                return theme.palette.info.main;
            default:
                return theme.palette.text.secondary;
        }
    };

    // Get severity icon
    const getSeverityIcon = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'high':
                return <ErrorIcon sx={{ color: getSeverityColor(severity) }} />;
            case 'medium':
                return <WarningIcon sx={{ color: getSeverityColor(severity) }} />;
            case 'low':
                return <InfoIcon sx={{ color: getSeverityColor(severity) }} />;
            default:
                return <InfoIcon sx={{ color: theme.palette.text.secondary }} />;
        }
    };

    // Get score color
    const getScoreColor = (score: number): string => {
        if (score >= 80) return theme.palette.success.main;
        if (score >= 60) return theme.palette.info.main;
        if (score >= 40) return theme.palette.warning.main;
        return theme.palette.error.main;
    };

    // Prepare issues by severity chart data
    const severityChartData = Object.entries(codeQuality.issues_by_severity).map(([severity, count]) => ({
        name: severity.charAt(0).toUpperCase() + severity.slice(1),
        value: count,
        color: getSeverityColor(severity)
    }));

    // Prepare radar chart data for code metrics
    const radarData = [
        {
            subject: 'Quality',
            value: codeQuality.quality_score / 100,
            fullMark: 1
        },
        {
            subject: 'Maintainability',
            value: codeQuality.maintainability_score / 100,
            fullMark: 1
        },
        {
            subject: 'Simplicity',
            value: (100 - codeQuality.complexity_score) / 100,
            fullMark: 1
        },
        {
            subject: 'Test Coverage',
            value: (codeQuality.test_coverage || 0) / 100,
            fullMark: 1
        }
    ];

    // Filter issues by severity
    const getFilteredIssues = () => {
        if (!filter) return codeQuality.issues;
        return codeQuality.issues.filter(issue => issue.severity.toLowerCase() === filter.toLowerCase());
    };

    const filteredIssues = getFilteredIssues();

    // Handle pagination
    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Handle issue expansion
    const handleIssueExpansion = (issueId: string) => {
        setExpandedIssue(expandedIssue === issueId ? null : issueId);
    };

    return (
        <Box>
            {/* Code Quality Summary */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" gutterBottom>
                                Overall Quality Score
                            </Typography>
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                <CircularProgressWithLabel
                                    value={codeQuality.quality_score}
                                    color={getScoreColor(codeQuality.quality_score)}
                                    size={120}
                                />
                            </Box>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <Typography variant="h6" gutterBottom>
                            Code Metrics
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderColor: getScoreColor(codeQuality.complexity_score),
                                        borderWidth: 2
                                    }}
                                >
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Complexity Score
                                    </Typography>
                                    <Typography variant="h5" sx={{ color: getScoreColor(codeQuality.complexity_score) }}>
                                        {codeQuality.complexity_score}
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={codeQuality.complexity_score}
                                        sx={{
                                            height: 6,
                                            mt: 1,
                                            bgcolor: `${getScoreColor(codeQuality.complexity_score)}30`,
                                            '& .MuiLinearProgress-bar': {
                                                bgcolor: getScoreColor(codeQuality.complexity_score)
                                            }
                                        }}
                                    />
                                </Paper>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderColor: getScoreColor(codeQuality.maintainability_score),
                                        borderWidth: 2
                                    }}
                                >
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Maintainability Score
                                    </Typography>
                                    <Typography variant="h5" sx={{ color: getScoreColor(codeQuality.maintainability_score) }}>
                                        {codeQuality.maintainability_score}
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={codeQuality.maintainability_score}
                                        sx={{
                                            height: 6,
                                            mt: 1,
                                            bgcolor: `${getScoreColor(codeQuality.maintainability_score)}30`,
                                            '& .MuiLinearProgress-bar': {
                                                bgcolor: getScoreColor(codeQuality.maintainability_score)
                                            }
                                        }}
                                    />
                                </Paper>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderColor: getScoreColor(codeQuality.test_coverage || 0),
                                        borderWidth: 2
                                    }}
                                >
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Test Coverage
                                    </Typography>
                                    <Typography variant="h5" sx={{ color: getScoreColor(codeQuality.test_coverage || 0) }}>
                                        {codeQuality.test_coverage || 0}%
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={codeQuality.test_coverage || 0}
                                        sx={{
                                            height: 6,
                                            mt: 1,
                                            bgcolor: `${getScoreColor(codeQuality.test_coverage || 0)}30`,
                                            '& .MuiLinearProgress-bar': {
                                                bgcolor: getScoreColor(codeQuality.test_coverage || 0)
                                            }
                                        }}
                                    />
                                </Paper>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>

            {/* Charts and Issues */}
            <Grid container spacing={3}>
                {/* Radar Chart */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader
                            title="Code Quality Metrics"
                            titleTypographyProps={{ variant: 'h6' }}
                            avatar={<InsertChartIcon />}
                        />
                        <Divider />
                        <CardContent>
                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart outerRadius={90} data={radarData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" />
                                        <PolarRadiusAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                                        <Radar
                                            name="Code Quality"
                                            dataKey="value"
                                            stroke={theme.palette.primary.main}
                                            fill={theme.palette.primary.main}
                                            fillOpacity={0.6}
                                        />
                                        <RechartsTooltip formatter={(value) => [`${(Number(value) * 100).toFixed(0)}%`, 'Score']} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Issues by Severity */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader
                            title="Issues by Severity"
                            titleTypographyProps={{ variant: 'h6' }}
                            avatar={<BugReportIcon />}
                            subheader={`${codeQuality.issues_count} issues found`}
                        />
                        <Divider />
                        <CardContent>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ height: 200 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={severityChartData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={70}
                                                    label
                                                >
                                                    {severityChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip formatter={(value, name) => [`${value} issues`, name]} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <List dense>
                                        {Object.entries(codeQuality.issues_by_severity).map(([severity, count]) => (
                                            <ListItem
                                                key={severity}
                                                sx={{ px: 1 }}
                                                button={count > 0}
                                                onClick={() => count > 0 && setFilter(severity === filter ? null : severity)}
                                                selected={severity === filter}
                                            >
                                                <ListItemIcon>
                                                    {getSeverityIcon(severity)}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="body2">
                                                            {severity.charAt(0).toUpperCase() + severity.slice(1)}
                                                        </Typography>
                                                    }
                                                />
                                                <Chip
                                                    label={count}
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 500,
                                                        backgroundColor: count > 0 ? `${getSeverityColor(severity)}20` : undefined,
                                                        color: count > 0 ? getSeverityColor(severity) : undefined,
                                                    }}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Issues Table */}
                <Grid item xs={12}>
                    <Card>
                        <CardHeader
                            title="Code Quality Issues"
                            titleTypographyProps={{ variant: 'h6' }}
                            avatar={<BugReportIcon />}
                            action={
                                <Box sx={{ display: 'flex' }}>
                                    {filter && (
                                        <Chip
                                            label={`Filtered by: ${filter}`}
                                            size="small"
                                            onDelete={() => setFilter(null)}
                                            sx={{ mr: 1 }}
                                        />
                                    )}
                                    <Tooltip title="Filter">
                                        <IconButton>
                                            <FilterListIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Search">
                                        <IconButton>
                                            <SearchIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            }
                        />
                        <Divider />
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Severity</TableCell>
                                        <TableCell>Issue</TableCell>
                                        <TableCell>File</TableCell>
                                        <TableCell>Line</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredIssues
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((issue) => (
                                            <TableRow
                                                key={issue.issue_id}
                                                hover
                                                onClick={() => handleIssueExpansion(issue.issue_id)}
                                                sx={{ cursor: 'pointer' }}
                                            >
                                                <TableCell>
                                                    <Chip
                                                        label={issue.severity.toUpperCase()}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: `${getSeverityColor(issue.severity)}20`,
                                                            color: getSeverityColor(issue.severity),
                                                            fontWeight: 500
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>{issue.title}</TableCell>
                                                <TableCell>
                                                    {issue.file_path ? (
                                                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                                            {issue.file_path.split('/').pop()}
                                                        </Typography>
                                                    ) : (
                                                        "Unknown"
                                                    )}
                                                </TableCell>
                                                <TableCell>{issue.line_number || 'N/A'}</TableCell>
                                            </TableRow>
                                        ))}
                                    {filteredIssues.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    No issues found
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25]}
                            component="div"
                            count={filteredIssues.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </Card>
                </Grid>

                {/* Issue Details */}
                {expandedIssue && (
                    <Grid item xs={12}>
                        <Card>
                            <CardHeader
                                title="Issue Details"
                                titleTypographyProps={{ variant: 'h6' }}
                                avatar={<TextSnippetIcon />}
                            />
                            <Divider />
                            <CardContent>
                                {filteredIssues
                                    .filter(issue => issue.issue_id === expandedIssue)
                                    .map(issue => (
                                        <Box key={issue.issue_id}>
                                            <Typography variant="h6" gutterBottom color={getSeverityColor(issue.severity)}>
                                                {issue.title}
                                            </Typography>

                                            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                                Description
                                            </Typography>
                                            <Typography variant="body2" paragraph>
                                                {issue.description}
                                            </Typography>

                                            {(issue.file_path || issue.line_number) && (
                                                <>
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        Location
                                                    </Typography>
                                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', mb: 2 }}>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <DescriptionIcon fontSize="small" color="action" />
                                                            <Typography variant="body2">
                                                                {issue.file_path || 'Unknown file'}
                                                                {issue.line_number && ` (Line: ${issue.line_number}${issue.column ? `, Column: ${issue.column}` : ''})`}
                                                            </Typography>
                                                        </Stack>
                                                    </Paper>
                                                </>
                                            )}

                                            {issue.source && (
                                                <>
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        Source Code
                                                    </Typography>
                                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', mb: 2 }}>
                                                        <Typography variant="body2" component="pre" sx={{
                                                            fontFamily: 'monospace',
                                                            whiteSpace: 'pre-wrap',
                                                            wordBreak: 'break-all',
                                                            overflowX: 'auto',
                                                            fontSize: '0.8rem'
                                                        }}>
                                                            {issue.source}
                                                        </Typography>
                                                    </Paper>
                                                </>
                                            )}

                                            {issue.recommendation && (
                                                <>
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        Recommendation
                                                    </Typography>
                                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: `${theme.palette.info.main}10` }}>
                                                        <Typography variant="body2">
                                                            {issue.recommendation}
                                                        </Typography>
                                                    </Paper>
                                                </>
                                            )}
                                        </Box>
                                    ))}
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

// Helper component for circular progress with label
const CircularProgressWithLabel: React.FC<{ value: number; color?: string, size?: number }> = ({ value, color, size = 100 }) => {
    const theme = useTheme();

    return (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
                variant="determinate"
                value={100}
                size={size}
                thickness={4}
                sx={{ color: theme.palette.grey[200] }}
            />
            <CircularProgress
                variant="determinate"
                value={value}
                size={size}
                thickness={4}
                sx={{
                    position: 'absolute',
                    left: 0,
                    color: color,
                }}
            />
            <Box
                sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography
                    variant="h4"
                    component="div"
                    color={color || 'text.primary'}
                    sx={{ fontWeight: 'bold' }}
                >
                    {Math.round(value)}
                </Typography>
            </Box>
        </Box>
    );
};

export default CodeQualityPanel;