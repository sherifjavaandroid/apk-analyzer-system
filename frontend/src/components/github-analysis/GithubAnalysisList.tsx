// frontend/src/components/github-analysis/GithubAnalysisList.tsx
import React from 'react';
import {
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Typography,
    Box,
    Chip,
    CircularProgress,
    Tooltip,
    useTheme
} from '@mui/material';
import {
    GitHub as GitHubIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Pending as PendingIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';

// Types
interface Analysis {
    id: string;
    repository_url: string;
    branch: string;
    status: string;
    created_at: string;
    completed_at?: string;
    error?: string;
}

interface GithubAnalysisListProps {
    analyses: Analysis[];
    onAnalysisSelect: (id: string) => void;
    selectedAnalysis?: string;
    loading: boolean;
}

const GithubAnalysisList: React.FC<GithubAnalysisListProps> = ({
                                                                   analyses,
                                                                   onAnalysisSelect,
                                                                   selectedAnalysis,
                                                                   loading
                                                               }) => {
    const theme = useTheme();

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

    // Get status icon and color
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

    // Extract repo name from URL
    const getRepoName = (url: string): string => {
        try {
            const parts = url.split('/');
            if (parts.length >= 2) {
                const owner = parts[parts.length - 2];
                const repo = parts[parts.length - 1];
                return `${owner}/${repo}`;
            }
        } catch (e) {
            // In case of error, return the original URL
        }
        return url;
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (analyses.length === 0) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    No GitHub analyses found. Analyze a repository to get started.
                </Typography>
            </Box>
        );
    }

    return (
        <List disablePadding>
            {analyses.map((analysis, index) => {
                const { icon, color, label } = getStatusInfo(analysis.status);
                const isSelected = analysis.id === selectedAnalysis;
                const repoName = getRepoName(analysis.repository_url);

                return (
                    <React.Fragment key={analysis.id}>
                        {index > 0 && <Divider />}
                        <ListItemButton
                            selected={isSelected}
                            onClick={() => onAnalysisSelect(analysis.id)}
                            sx={{
                                px: 2,
                                py: 1.5,
                                backgroundColor: isSelected ? `${theme.palette.primary.main}1A` : 'transparent',
                                '&:hover': {
                                    backgroundColor: isSelected ? `${theme.palette.primary.main}1A` : `${theme.palette.action.hover}`,
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <GitHubIcon color={isSelected ? 'primary' : 'inherit'} />
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Tooltip title={analysis.repository_url}>
                                        <Typography
                                            variant="body2"
                                            fontWeight={isSelected ? 500 : 400}
                                            color={isSelected ? 'primary' : 'textPrimary'}
                                            noWrap
                                        >
                                            {repoName}
                                        </Typography>
                                    </Tooltip>
                                }
                                secondary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                        <Chip
                                            icon={icon}
                                            label={label}
                                            size="small"
                                            sx={{
                                                height: 20,
                                                '& .MuiChip-label': { px: 1, fontSize: '0.7rem' },
                                                '& .MuiChip-icon': { fontSize: '0.8rem', ml: 0.5 },
                                                backgroundColor: `${color}20`,
                                                color: color,
                                                borderColor: color
                                            }}
                                            variant="outlined"
                                        />
                                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                            {formatDate(analysis.created_at)}
                                        </Typography>
                                    </Box>
                                }
                                primaryTypographyProps={{ noWrap: true }}
                            />
                        </ListItemButton>
                    </React.Fragment>
                );
            })}
        </List>
    );
};

export default GithubAnalysisList;