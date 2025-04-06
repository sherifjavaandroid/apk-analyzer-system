// frontend/src/components/layout/Layout.tsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
    Box,
    CssBaseline,
    AppBar as MuiAppBar,
    Toolbar,
    IconButton,
    Typography,
    Avatar,
    Menu,
    MenuItem,
    Divider,
    ListItemIcon,
    useTheme,
    styled
} from '@mui/material';
import {
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    AccountCircle,
    Settings,
    Logout,
    Brightness4,
    Brightness7
} from '@mui/icons-material';

// Components
import Sidebar from './Sidebar';
import Notifications from './Notifications';
import SearchBar from './SearchBar';

// Redux
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { toggleSidebar, setDarkMode } from '../../store/slices/uiSlice';

// Constants
import { SIDEBAR_WIDTH } from '../../config';

// Props type
interface LayoutProps {
    darkMode: boolean;
    toggleTheme: () => void;
}

// Styled components
const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})<{
    open: boolean;
}>(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        marginLeft: SIDEBAR_WIDTH,
        width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
    open: boolean;
}>(({ theme, open }) => ({
    flexGrow: 1,
    transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: 0,
    ...(open && {
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
        marginLeft: SIDEBAR_WIDTH,
    }),
}));

const Layout: React.FC<LayoutProps> = ({ darkMode, toggleTheme }) => {
    const dispatch = useDispatch<AppDispatch>();
    const theme = useTheme();
    const { sidebarOpen } = useSelector((state: RootState) => state.ui);
    const { user } = useSelector((state: RootState) => state.auth);

    // User menu state
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const userMenuOpen = Boolean(anchorEl);

    const handleDrawerToggle = () => {
        dispatch(toggleSidebar());
    };

    const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleUserMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleUserMenuClose();
        dispatch(logout());
    };

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            <CssBaseline />

            {/* Top App Bar */}
            <AppBar position="fixed" open={sidebarOpen}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="toggle drawer"
                        onClick={handleDrawerToggle}
                        edge="start"
                        sx={{ mr: 2 }}
                    >
                        {sidebarOpen ? <ChevronLeftIcon /> : <MenuIcon />}
                    </IconButton>

                    <Typography variant="h6" noWrap component="div" sx={{ display: { xs: 'none', sm: 'block' } }}>
                        APK Analyzer System
                    </Typography>

                    <SearchBar />

                    <Box sx={{ flexGrow: 1 }} />

                    {/* Theme toggle */}
                    <IconButton color="inherit" onClick={toggleTheme}>
                        {darkMode ? <Brightness7 /> : <Brightness4 />}
                    </IconButton>

                    {/* Notifications */}
                    <Notifications />

                    {/* User menu */}
                    <Box sx={{ ml: 2 }}>
                        <IconButton
                            onClick={handleUserMenuOpen}
                            size="small"
                            aria-controls={userMenuOpen ? 'account-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={userMenuOpen ? 'true' : undefined}
                            color="inherit"
                        >
                            <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                                {user?.username ? user.username[0].toUpperCase() : 'U'}
                            </Avatar>
                        </IconButton>
                    </Box>

                    <Menu
                        id="account-menu"
                        anchorEl={anchorEl}
                        open={userMenuOpen}
                        onClose={handleUserMenuClose}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        <MenuItem onClick={handleUserMenuClose}>
                            <ListItemIcon>
                                <AccountCircle fontSize="small" />
                            </ListItemIcon>
                            Profile
                        </MenuItem>
                        <MenuItem onClick={() => { handleUserMenuClose(); window.location.href = '/settings'; }}>
                            <ListItemIcon>
                                <Settings fontSize="small" />
                            </ListItemIcon>
                            Settings
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon>
                                <Logout fontSize="small" />
                            </ListItemIcon>
                            Logout
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* Sidebar */}
            <Sidebar open={sidebarOpen} />

            {/* Main content */}
            <Main open={sidebarOpen}>
                <Toolbar /> {/* This creates space equal to the AppBar height */}
                <Outlet />
            </Main>
        </Box>
    );
};

export default Layout;