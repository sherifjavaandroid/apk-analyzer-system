// frontend/src/components/dashboard/RecentAnalysesTable.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    CardHeader,
    CardContent,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    IconButton,
    Tooltip,
    TextField,
    InputAdornment,
    useTheme
} from '@mui/material';
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    FilterList as FilterListIcon,
    Android as AndroidIcon,
    GitHub as GitHubIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Pending as PendingIcon,
    Schedule as ScheduleIcon,
    Visibility as VisibilityIcon,
    MoreVert as MoreVertIcon
} from '@mui/icons-material';

interface Analysis {
    id: string;
    filename?: string;
    repository_url?: string;
    status: string;
    created_at: string;
    completed_at?: string;
    error?: string;
    results?: any;
}

interface RecentAnalysesTableProps {
    analyses: Analysis[];
    onRefresh?: () => void;
}

const RecentAnalysesTable: React.FC<RecentAnalysesTableProps> = ({ analyses, onRefresh }) => {
    const theme = useTheme();
    const navigate = useNavigate();

    // State for pagination and filtering
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [searchTerm, setSearchTerm] = useState('');

    // Format date string
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Get the type of analysis
    const getAnalysisType = (analysis: Analysis): 'APK' | 'GitHub' => {
        return 'filename' in analysis ? 'APK' : 'GitHub';
    };

    // Get the name of the analysis for display
    const getAnalysisName = (analysis: Analysis): string => {
        if ('filename' in analysis && analysis.filename) {
            return analysis.filename;
        } else if ('repository_url' in analysis && analysis.repository_url) {
            // Extract owner/repo from the URL
            const urlParts = analysis.repository_url.split('/');
            if (urlParts.length >= 2) {
                return `${urlParts[urlParts.length - 2]}/${urlParts[urlParts.length - 1]}`;
            }
            return analysis.repository_url;
        }
        return 'Unknown';
    };

    // Get status info (icon, color, label)
    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'completed':
                return {
                    icon: <CheckCircleIcon fontSize="small" />,
                    color: theme.palette.success.main,
                    label: 'Completed'
                };
            case 'failed':
                return {
                    icon: <ErrorIcon fontSize="small" />,
                    color: theme.palette.error.main,
                    label: 'Failed'
                };
            case 'processing':
                return {
                    icon: <PendingIcon fontSize="small" />,
                    color: theme.palette.warning.main,
                    label: 'Processing'
                };
            case 'pending':
                return {
                    icon: <ScheduleIcon fontSize="small" />,
                    color: theme.palette.info.main,
                    label: 'Pending'
                };
            default:
                return {
                    icon: <ScheduleIcon fontSize="small" />,
                    color: theme.palette.text.secondary,
                    label: status
                };
        }
    };

    // Filter analyses based on search term
    const filteredAnalyses = analyses.filter(analysis => {
        const name = getAnalysisName(analysis).toLowerCase();
        const type = getAnalysisType(analysis).toLowerCase();
        const status = analysis.status.toLowerCase();
        const term = searchTerm.toLowerCase();

        return name.includes(term) || type.includes(term) || status.includes(term);
    });

    // Handle pagination
    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Handle viewing analysis details
    const handleViewAnalysis = (analysis: Analysis) => {
        const type = getAnalysisType(analysis);
        const path = type === 'APK' ? '/apk-analysis' : '/github-analysis';
        navigate(path, { state: { analysisId: analysis.id } });
    };

    return (
        <Card>
            <CardHeader
                title="Recent Analyses"
                titleTypographyProps={{ variant: 'h6' }}
                action={
                    <Box sx={{ display: 'flex' }}>
                        <Tooltip title="Refresh">
                            <IconButton onClick={onRefresh}>
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Filter">
                            <IconButton>
                                <FilterListIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                }
            />
            <Divider />
            <CardContent sx={{ p: 2 }}>
                <TextField
                    placeholder="Search analyses..."
                    fullWidth
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ mb: 2 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Type</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell>Completed</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredAnalyses
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((analysis) => {
                                    const type = getAnalysisType(analysis);
                                    const name = getAnalysisName(analysis);
                                    const { icon, color, label } = getStatusInfo(analysis.status);

                                    return (
                                        <TableRow
                                            key={analysis.id}
                                            hover
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        >
                                            <TableCell>
                                                <Chip
                                                    icon={type === 'APK' ? <AndroidIcon /> : <GitHubIcon />}
                                                    label={type}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: `${type === 'APK' ? theme.palette.primary.main : theme.palette.secondary.main}20`,
                                                        color: type === 'APK' ? theme.palette.primary.main : theme.palette.secondary.main,
                                                        '& .MuiChip-icon': {
                                                            color: 'inherit'
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                                                    {name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    icon={icon}
                                                    label={label}
                                                    size="small"
                                                    sx={{
                                                        height: 24,
                                                        '& .MuiChip-label': { px: 1, fontSize: '0.7rem' },
                                                        '& .MuiChip-icon': { fontSize: '1rem' },
                                                        backgroundColor: `${color}20`,
                                                        color: color
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {formatDate(analysis.created_at)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {analysis.completed_at ? (
                                                    <Typography variant="body2">
                                                        {formatDate(analysis.completed_at)}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">
                                                        -
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title="View Analysis">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleViewAnalysis(analysis)}
                                                    >
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="More Options">
                                                    <IconButton size="small">
                                                        <MoreVertIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            {filteredAnalyses.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            No analyses found.
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
                    count={filteredAnalyses.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </CardContent>
        </Card>
    );
};

export default RecentAnalysesTable;