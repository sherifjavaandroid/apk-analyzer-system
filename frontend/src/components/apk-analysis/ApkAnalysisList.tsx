// frontend/src/components/apk-analysis/ApkAnalysisList.tsx
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
    useTheme
} from '@mui/material';
import {
    Android as AndroidIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Pending as PendingIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';

// Types
interface Analysis {
    id: string;
    filename: string;
    status: string;
    created_at: string;
    completed_at?: string;
    error?: string;
}

interface ApkAnalysisListProps {
    analyses: Analysis[];
    onAnalysisSelect: (id: string) => void;
    selectedAnalysis: string | undefined;
    loading: boolean;
}

const ApkAnalysisList: React.FC<ApkAnalysisListProps> = ({
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

    // Get filename display
    const getFilenameDisplay = (filename: string): string => {
        // Truncate if too long
        return filename.length > 30 ? filename.substring(0, 27) + '...' : filename;
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
                    No APK analyses found. Upload an APK to get started.
                </Typography>
            </Box>
        );
    }

    return (
        <List disablePadding>
            {analyses.map((analysis, index) => {
                const { icon, color, label } = getStatusInfo(analysis.status);
                const isSelected = analysis.id === selectedAnalysis;

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
                                <AndroidIcon color={isSelected ? 'primary' : 'inherit'} />
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Typography
                                        variant="body2"
                                        fontWeight={isSelected ? 500 : 400}
                                        color={isSelected ? 'primary' : 'textPrimary'}
                                    >
                                        {getFilenameDisplay(analysis.filename)}
                                    </Typography>
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