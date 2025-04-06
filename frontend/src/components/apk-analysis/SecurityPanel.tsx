// frontend/src/components/apk-analysis/SecurityPanel.tsx
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
    Report as ReportIcon
} from '@mui/icons-material';

// Types
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

interface SecurityPanelProps {
    security?: SecurityScanResult;
}

const SecurityPanel: React.FC<SecurityPanelProps> = ({ security }) => {
    const theme = useTheme();

    // State for issues table
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [filter, setFilter] = useState<string | null>(null);

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
                return <InfoIcon sx={{ color: getSeverityColor(severity) }} />;
            case 'info':
                return <InfoIcon sx={{ color: getSeverityColor(severity) }} />;
            default:
                return <InfoIcon sx={{ color: theme.palette.text.secondary }} />;
        }
    };

    // Get risk level label and color based on score
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

    // Filter issues by severity
    const getFilteredIssues = () => {
        if (!filter) return security.issues;
        return security.issues.filter(issue => issue.severity.toLowerCase() === filter.toLowerCase());
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

    return (
        <Box>
            {/* Security Summary */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item>
                        <CircularProgress
                            variant="determinate"
                            value={security.risk_score}
                            size={80}
                            thickness={8}
                            sx={{
                                color: riskLevel.color,
                                '& .MuiCircularProgress-circle': {
                                    strokeLinecap: 'round',
                                },
                            }}
                        />
                    </Grid>
                    <Grid item xs>
                        <Typography variant="h6" gutterBottom>
                            Security Risk Score
                        </Typography>
                        <Typography variant="h3" sx={{ color: riskLevel.color, fontWeight: 500 }}>
                            {security.risk_score}
                            <Typography component="span" variant="h6" color="text.secondary" sx={{ ml: 1 }}>
                                / 100
                            </Typography>
                        </Typography>
                        <Chip
                            label={riskLevel.label}
                            sx={{
                                backgroundColor: `${riskLevel.color}20`,
                                color: riskLevel.color,
                                fontWeight: 500
                            }}
                        />
                    </Grid>
                    <Grid item>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Total Issues
                        </Typography>
                        <Typography variant="h4">
                            {security.issues_count}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* Security Details */}
            <Grid container spacing={3}>
                {/* Severity Breakdown */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardHeader
                            title="Issues by Severity"
                            titleTypographyProps={{ variant: 'h6' }}
                            avatar={<SecurityIcon />}
                        />
                        <Divider />
                        <CardContent>
                            <List>
                                {Object.entries(security.severity_counts).map(([severity, count]) => (
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
                            {filter && (
                                <Button
                                    variant="text"
                                    size="small"
                                    onClick={() => setFilter(null)}
                                    sx={{ mt: 1 }}
                                >
                                    Clear Filter
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Issues */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardHeader
                            title="Security Issues"
                            titleTypographyProps={{ variant: 'h6' }}
                            avatar={<BugReportIcon />}
                            action={
                                <Box sx={{ display: 'flex' }}>
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
                        <TableContainer sx={{ maxHeight: 440 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Severity</TableCell>
                                        <TableCell>Issue</TableCell>
                                        <TableCell>Location</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredIssues
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((issue) => (
                                            <TableRow key={issue.issue_id} hover>
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
                                                <TableCell>
                                                    {issue.location ? (
                                                        <Tooltip title={issue.location}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <FolderIcon fontSize="small" color="action" />
                                                                <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                                                                    {issue.location}
                                                                </Typography>
                                                                {issue.line_number && (
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        :{issue.line_number}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </Tooltip>
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
                                            <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
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
                <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                        Issue Details
                    </Typography>
                    {filteredIssues
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((issue) => (
                            <Accordion key={issue.issue_id} sx={{ mb: 1 }}>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{
                                        '&.Mui-expanded': { minHeight: 48 },
                                        '& .MuiAccordionSummary-content.Mui-expanded': { margin: '12px 0' }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                        {getSeverityIcon(issue.severity)}
                                        <Typography variant="subtitle1">{issue.title}</Typography>
                                        <Box sx={{ flexGrow: 1 }} />
                                        <Chip
                                            label={issue.severity.toUpperCase()}
                                            size="small"
                                            sx={{
                                                backgroundColor: `${getSeverityColor(issue.severity)}20`,
                                                color: getSeverityColor(issue.severity),
                                                fontWeight: 500
                                            }}
                                        />
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <Typography variant="body2" paragraph>
                                                {issue.description}
                                            </Typography>
                                        </Grid>

                                        {issue.location && (
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Location
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <FolderIcon fontSize="small" color="action" />
                                                    <Typography variant="body2">
                                                        {issue.location}
                                                        {issue.line_number && `:${issue.line_number}`}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        )}

                                        {issue.cvss_score && (
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    CVSS Score
                                                </Typography>
                                                <Typography variant="body2">
                                                    {issue.cvss_score.toFixed(1)} / 10.0
                                                </Typography>
                                            </Grid>
                                        )}

                                        {issue.recommendation && (
                                            <Grid item xs={12}>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Recommendation
                                                </Typography>
                                                <Typography variant="body2" paragraph>
                                                    {issue.recommendation}
                                                </Typography>
                                            </Grid>
                                        )}

                                        {issue.references && issue.references.length > 0 && (
                                            <Grid item xs={12}>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    References
                                                </Typography>
                                                <List dense disablePadding>
                                                    {issue.references.map((reference, index) => (
                                                        <ListItem key={index} sx={{ px: 0 }}>
                                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                                <LinkIcon fontSize="small" />
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={
                                                                    <Typography variant="body2">
                                                                        {reference}
                                                                    </Typography>
                                                                }
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </Grid>
                                        )}

                                        <Grid item xs={12} sx={{ mt: 1 }}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<ReportIcon />}
                                                sx={{ mr: 1 }}
                                            >
                                                Generate Fix
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                </Grid>
            </Grid>
        </Box>
    );
};

export default SecurityPanel;