// frontend/src/components/github-analysis/SecurityIssuesPanel.tsx
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
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    CircularProgress,
    Button,
    IconButton,
    Tooltip,
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
    useTheme
} from '@mui/material';
import {
    Security as SecurityIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    CheckCircle as CheckCircleIcon,
    BugReport as BugReportIcon,
    ExpandMore as ExpandMoreIcon,
    Link as LinkIcon,
    FilterList as FilterListIcon,
    Search as SearchIcon,
    Folder as FolderIcon,
    Code as CodeIcon,
    GitHub as GitHubIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

// Import the CircularProgressWithLabel component
import CircularProgressWithLabel from '../common/CircularProgressWithLabel';

// Types
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

interface SecurityIssuesPanelProps {
    security?: SecurityScanResult;
}

const SecurityIssuesPanel: React.FC<SecurityIssuesPanelProps> = ({ security }) => {
    const theme = useTheme();

    // State for issues table
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [filter, setFilter] = useState<string | null>(null);
    const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

    if (!security) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                    Security scan results not available.
                </Typography>
            </Box>
        );
    }

    // Calculate severity color
    const getSeverityColor = (severity: string): string => {
        switch (severity.toLowerCase()) {
            case 'critical':
                return theme.palette.severity.critical;
            case 'high':
                return theme.palette.severity.high;
            case 'medium':
                return theme.palette.severity.medium;
            case 'low':
                return theme.palette.severity.low;
            case 'info':
                return theme.palette.severity.info;
            default:
                return theme.palette.text.secondary;
        }
    };

    // Get severity icon
    const getSeverityIcon = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical':
            case 'high':
                return <ErrorIcon sx={{ color: getSeverityColor(severity) }} />;
            case 'medium':
                return <WarningIcon sx={{ color: getSeverityColor(severity) }} />;
            case 'low':
            case 'info':
                return <InfoIcon sx={{ color: getSeverityColor(severity) }} />;
            default:
                return <InfoIcon sx={{ color: theme.palette.text.secondary }} />;
        }
    };

    // Get risk level based on score
    const getRiskLevel = (score: number) => {
        if (score >= 80) {
            return { label: 'Critical', color: theme.palette.severity.critical };
        } else if (score >= 60) {
            return { label: 'High', color: theme.palette.severity.high };
        } else if (score >= 40) {
            return { label: 'Medium', color: theme.palette.severity.medium };
        } else if (score >= 20) {
            return { label: 'Low', color: theme.palette.severity.low };
        } else {
            return { label: 'Very Low', color: theme.palette.severity.info };
        }
    };

    const riskLevel = getRiskLevel(security.risk_score);

    // Prepare severity chart data
    const severityChartData = Object.entries(security.severity_counts).map(([severity, count]) => ({
        name: severity.charAt(0).toUpperCase() + severity.slice(1),
        value: count,
        color: getSeverityColor(severity)
    }));

    // Filter issues by severity
    const getFilteredIssues = () => {
        if (!filter) return security.issues;
        return security.issues.filter(issue => issue.severity.toLowerCase() === filter.toLowerCase());
    };

    const filteredIssues = getFilteredIssues();

    // Handle issue expansion
    const handleIssueExpand = (issueId: string) => {
        setExpandedIssue(issueId === expandedIssue ? null : issueId);
    };

    // Handle pagination
    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box>
            {/* Security Summary */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} sm={6} md={3} sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom>
                            Risk Score
                        </Typography>
                        <CircularProgressWithLabel
                            value={security.risk_score}
                            color={riskLevel.color}
                            size={120}
                            thickness={8}
                        />
                        <Chip
                            label={riskLevel.label}
                            sx={{
                                mt: 1,
                                backgroundColor: `${riskLevel.color}20`,
                                color: riskLevel.color,
                                fontWeight: 500
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={9}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <Paper
                                    variant="outlined"
                                    sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                >
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Total Issues
                                    </Typography>
                                    <Typography variant="h4" color="error">
                                        {security.issues_count}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Paper
                                    variant="outlined"
                                    sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                >
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Secrets Found
                                    </Typography>
                                    <Typography variant="h4" color="warning.main">
                                        {security.secrets_found}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Paper
                                    variant="outlined"
                                    sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                >
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Vulnerabilities
                                    </Typography>
                                    <Typography variant="h4" color="error">
                                        {security.vulnerabilities_found}
                                    </Typography>
                                </Paper>
                            </Grid>
                        </Grid>

                        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 1 }}>
                            Issues by Severity
                        </Typography>
                        <Grid container spacing={1}>
                            {Object.entries(security.severity_counts).map(([severity, count]) => (
                                <Grid item key={severity}>
                                    <Chip
                                        icon={getSeverityIcon(severity)}
                                        label={`${severity.charAt(0).toUpperCase() + severity.slice(1)}: ${count}`}
                                        onClick={() => setFilter(severity === filter ? null : severity)}
                                        sx={{
                                            backgroundColor: severity === filter ? `${getSeverityColor(severity)}20` : undefined,
                                            color: severity === filter ? getSeverityColor(severity) : undefined,
                                            '& .MuiChip-icon': {
                                                color: getSeverityColor(severity)
                                            },
                                            borderColor: getSeverityColor(severity),
                                            borderWidth: severity === filter ? 2 : 1
                                        }}
                                        variant="outlined"
                                    />
                                </Grid>
                            ))}
                            {filter && (
                                <Grid item>
                                    <Chip
                                        label="Clear Filter"
                                        onClick={() => setFilter(null)}
                                        color="default"
                                        size="small"
                                    />
                                </Grid>
                            )}
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>

            {/* Security Charts and Issues List */}
            <Grid container spacing={3}>
                {/* Severity Pie Chart */}
                <Grid item xs={12} md={5}>
                    <Card>
                        <CardHeader
                            title="Issues by Severity"
                            titleTypographyProps={{ variant: 'h6' }}
                            avatar={<SecurityIcon />}
                        />
                        <Divider />
                        <CardContent>
                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={severityChartData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        >
                                            {severityChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(value) => [`${value} issues`, 'Count']} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Issues Table */}
                <Grid item xs={12} md={7}>
                    <Card>
                        <CardHeader
                            title="Security Issues"
                            titleTypographyProps={{ variant: 'h6' }}
                            avatar={<BugReportIcon />}
                            action={
                                <Box sx={{ display: 'flex' }}>
                                    <IconButton size="small" onClick={() => setFilter(null)}>
                                        <FilterListIcon />
                                    </IconButton>
                                    <IconButton size="small">
                                        <SearchIcon />
                                    </IconButton>
                                </Box>
                            }
                        />
                        <Divider />
                        <TableContainer sx={{ maxHeight: 400 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Severity</TableCell>
                                        <TableCell>Issue</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Location</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredIssues
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((issue) => (
                                            <TableRow
                                                key={issue.issue_id}
                                                hover
                                                onClick={() => handleIssueExpand(issue.issue_id)}
                                                sx={{ cursor: 'pointer' }}
                                            >
                                                <TableCell>
                                                    <Chip
                                                        label={issue.severity.toUpperCase()}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: `${getSeverityColor(issue.severity)}20`,
                                                            color: getSeverityColor(issue.severity),
                                                            fontWeight: 500,
                                                            '& .MuiChip-label': { px: 1 }
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>{issue.title}</TableCell>
                                                <TableCell>{issue.issue_type}</TableCell>
                                                <TableCell>
                                                    {issue.file_path ? (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <FolderIcon fontSize="small" color="action" />
                                                            <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                                                {issue.file_path.split('/').pop()}
                                                                {issue.line_number && `:${issue.line_number}`}
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">
                                                            Not specified
                                                        </Typography>
                                                    )}
                                                </TableCell>
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
            </Grid>

            {/* Issue Details */}
            <Box sx={{ mt: 3 }}>
                {filteredIssues
                    .filter(issue => issue.issue_id === expandedIssue)
                    .map((issue) => (
                        <Card key={issue.issue_id} sx={{ mb: 3 }}>
                            <CardHeader
                                title={issue.title}
                                titleTypographyProps={{ variant: 'h6' }}
                                avatar={getSeverityIcon(issue.severity)}
                                action={
                                    <Chip
                                        label={issue.severity.toUpperCase()}
                                        size="small"
                                        sx={{
                                            backgroundColor: `${getSeverityColor(issue.severity)}20`,
                                            color: getSeverityColor(issue.severity),
                                            fontWeight: 500
                                        }}
                                    />
                                }
                            />
                            <Divider />
                            <CardContent>
                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <Typography variant="body2" paragraph>
                                            {issue.description}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Issue Type
                                        </Typography>
                                        <Typography variant="body2" paragraph>
                                            {issue.issue_type}
                                        </Typography>
                                    </Grid>

                                    {issue.file_path && (
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Location
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <FolderIcon fontSize="small" color="action" />
                                                <Typography variant="body2">
                                                    {issue.file_path}
                                                    {issue.line_number && `:${issue.line_number}`}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    )}

                                    {issue.recommendation && (
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Recommendation
                                            </Typography>
                                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                                                <Typography variant="body2">
                                                    {issue.recommendation}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    )}

                                    {issue.cwe_id && (
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                CWE Reference
                                            </Typography>
                                            <Link
                                                href={`https://cwe.mitre.org/data/definitions/${issue.cwe_id.split('-')[1]}.html`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                            >
                                                <LinkIcon fontSize="small" />
                                                <Typography variant="body2">
                                                    {issue.cwe_id}
                                                </Typography>
                                            </Link>
                                        </Grid>
                                    )}

                                    {issue.references && issue.references.length > 0 && (
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                References
                                            </Typography>
                                            <List dense disablePadding>
                                                {issue.references.map((reference, index) => (
                                                    <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                                            <LinkIcon fontSize="small" />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={
                                                                <Typography
                                                                    variant="body2"
                                                                    component="a"
                                                                    href={reference}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    sx={{ color: 'primary.main' }}
                                                                >
                                                                    {reference}
                                                                </Typography>
                                                            }
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Grid>
                                    )}
                                </Grid>
                            </CardContent>
                        </Card>
                    ))}
            </Box>
        </Box>
    );
};

export default SecurityIssuesPanel;