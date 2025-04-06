// frontend/src/components/dashboard/ActivityCard.tsx
import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardHeader,
    CardContent,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    Avatar,
    IconButton,
    useTheme
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Description as DescriptionIcon,
    Code as CodeIcon,
    Android as AndroidIcon,
    GitHub as GitHubIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Pending as PendingIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';

interface Activity {
    id: string;
    type: string;
    name: string;
    status: string;
    created_at: string;
}

interface ActivityCardProps {
    activities: Activity[];
    onRefresh?: () => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activities, onRefresh }) => {
    const theme = useTheme();

    // Format date relative to now (e.g., "2 hours ago")
    const formatRelativeTime = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffDay > 0) {
            return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`;
        } else if (diffHour > 0) {
            return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
        } else if (diffMin > 0) {
            return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
        } else {
            return 'Just now';
        }
    };

    // Get activity icon based on type
    const getActivityIcon = (type: string, status: string) => {
        if (type.includes('APK')) {
            return (
                <Avatar sx={{ backgroundColor: `${theme.palette.primary.main}20`, color: theme.palette.primary.main }}>
                    <AndroidIcon />
                </Avatar>
            );
        } else if (type.includes('GitHub')) {
            return (
                <Avatar sx={{ backgroundColor: `${theme.palette.secondary.main}20`, color: theme.palette.secondary.main }}>
                    <GitHubIcon />
                </Avatar>
            );
        } else {
            return (
                <Avatar sx={{ backgroundColor: `${theme.palette.info.main}20`, color: theme.palette.info.main }}>
                    <DescriptionIcon />
                </Avatar>
            );
        }
    };

    // Get status chip based on status
    const getStatusChip = (status: string) => {
        let color;
        let icon;
        let label = status.charAt(0).toUpperCase() + status.slice(1);

        switch (status.toLowerCase()) {
            case 'completed':
                color = 'success';
                icon = <CheckCircleIcon fontSize="small" />;
                break;
            case 'failed':
                color = 'error';
                icon = <ErrorIcon fontSize="small" />;
                break;
            case 'processing':
                color = 'warning';
                icon = <PendingIcon fontSize="small" />;
                break;
            case 'pending':
                color = 'info';
                icon = <ScheduleIcon fontSize="small" />;
                break;
            default:
                color = 'default';
                icon = <DescriptionIcon fontSize="small" />;
        }

        return (
            <Chip
                size="small"
                label={label}
                color={color as any}
                icon={icon}
                sx={{
                    height: 24,
                    '& .MuiChip-label': { px: 1, fontSize: '0.7rem' },
                    '& .MuiChip-icon': { fontSize: '0.8rem', ml: 0.5 }
                }}
            />
        );
    };

    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
                title="Recent Activity"
                titleTypographyProps={{ variant: 'h6' }}
                action={
                    <IconButton onClick={onRefresh}>
                        <RefreshIcon />
                    </IconButton>
                }
            />
            <Divider />
            <CardContent sx={{ flexGrow: 1, p: 0 }}>
                {activities.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            No recent activity found.
                        </Typography>
                    </Box>
                ) : (
                    <List disablePadding>
                        {activities.map((activity, index) => (
                            <React.Fragment key={activity.id}>
                                {index > 0 && <Divider />}
                                <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                                    <ListItemIcon sx={{ mt: 0, minWidth: 50 }}>
                                        {getActivityIcon(activity.type, activity.status)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                <Typography variant="body2" fontWeight={500} sx={{ flexGrow: 1 }}>
                                                    {activity.name}
                                                </Typography>
                                                {getStatusChip(activity.status)}
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    {activity.type} • {formatRelativeTime(activity.created_at)}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </CardContent>
        </Card>
    );
};

export default ActivityCard;