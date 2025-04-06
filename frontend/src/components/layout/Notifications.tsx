// frontend/src/components/layout/Notifications.tsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Badge,
    IconButton,
    Popover,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Typography,
    Box,
    Button,
    Divider,
    Tooltip,
    useTheme
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    Delete as DeleteIcon,
    ClearAll as ClearAllIcon
} from '@mui/icons-material';

// Redux imports
import { RootState, AppDispatch } from '../../store';
import { clearNotifications, removeNotification } from '../../store/slices/uiSlice';

const Notifications: React.FC = () => {
    const theme = useTheme();
    const dispatch = useDispatch<AppDispatch>();

    // Get notifications from Redux store
    const notifications = useSelector((state: RootState) => state.ui.notifications);

    // Local state for popover
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    // Handle opening notifications popover
    const handleOpenNotifications = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    // Handle closing notifications popover
    const handleCloseNotifications = () => {
        setAnchorEl(null);
    };

    // Handle dismissing a notification
    const handleDismissNotification = (id: string) => {
        dispatch(removeNotification(id));
    };

    // Handle clearing all notifications
    const handleClearAllNotifications = () => {
        dispatch(clearNotifications());
        handleCloseNotifications();
    };

    // Get notification icon based on type
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <CheckCircleIcon color="success" />;
            case 'error':
                return <ErrorIcon color="error" />;
            case 'warning':
                return <WarningIcon color="warning" />;
            case 'info':
            default:
                return <InfoIcon color="info" />;
        }
    };

    const open = Boolean(anchorEl);
    const popoverId = open ? 'notifications-popover' : undefined;

    return (
        <>
            <Tooltip title="Notifications">
                <IconButton
                    color="inherit"
                    onClick={handleOpenNotifications}
                    aria-describedby={popoverId}
                >
                    <Badge badgeContent={notifications.length} color="error">
                        <NotificationsIcon />
                    </Badge>
                </IconButton>
            </Tooltip>

            <Popover
                id={popoverId}
                open={open}
                anchorEl={anchorEl}
                onClose={handleCloseNotifications}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        width: 360,
                        maxHeight: 400,
                        overflow: 'auto'
                    }
                }}
            >
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Notifications</Typography>
                    {notifications.length > 0 && (
                        <Tooltip title="Clear all">
                            <IconButton size="small" onClick={handleClearAllNotifications}>
                                <ClearAllIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>

                <Divider />

                {notifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Info color="disabled" sx={{ fontSize: 48, mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                            No notifications
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {notifications.map((notification) => (
                            <ListItem
                                key={notification.id}
                                alignItems="flex-start"
                                secondaryAction={
                                    <IconButton
                                        edge="end"
                                        size="small"
                                        onClick={() => handleDismissNotification(notification.id)}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                }
                                sx={{
                                    borderLeft: `4px solid ${
                                        notification.type === 'success'
                                            ? theme.palette.success.main
                                            : notification.type === 'error'
                                                ? theme.palette.error.main
                                                : notification.type === 'warning'
                                                    ? theme.palette.warning.main
                                                    : theme.palette.info.main
                                    }`,
                                    '&:hover': {
                                        backgroundColor: theme.palette.action.hover
                                    }
                                }}
                            >
                                <ListItemIcon>
                                    {getNotificationIcon(notification.type)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={notification.message}
                                    secondary={new Date().toLocaleTimeString()}
                                    primaryTypographyProps={{
                                        variant: 'body2',
                                        color: 'textPrimary'
                                    }}
                                    secondaryTypographyProps={{
                                        variant: 'caption',
                                        color: 'textSecondary'
                                    }}
                                />
                            </ListItem>
                        ))}
                    </List>
                )}

                {notifications.length > 0 && (
                    <>
                        <Divider />
                        <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
                            <Button
                                size="small"
                                onClick={handleClearAllNotifications}
                                startIcon={<ClearAllIcon />}
                            >
                                Clear All
                            </Button>
                        </Box>
                    </>
                )}
            </Popover>
        </>
    );
};

export default Notifications;