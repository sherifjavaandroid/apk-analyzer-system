// frontend/src/components/layout/Sidebar.tsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Drawer,
    Toolbar,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Collapse,
    useTheme,
    Typography,
    styled
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Android as AndroidIcon,
    GitHub as GitHubIcon,
    Description as ReportIcon,
    BarChart as AnalyticsIcon,
    Security as SecurityIcon,
    Code as CodeIcon,
    Settings as SettingsIcon,
    Book as KnowledgeIcon,
    ExpandLess,
    ExpandMore,
    Memory as TechnologyIcon,
    BugReport as VulnerabilityIcon,
    Assignment as DocumentationIcon
} from '@mui/icons-material';

// Constants
import { SIDEBAR_WIDTH } from '../../config';

// Props
interface SidebarProps {
    open: boolean;
}

// Navigation items
interface NavItem {
    title: string;
    path: string;
    icon: React.ReactNode;
    children?: NavItem[];
}

const navItems: NavItem[] = [
    {
        title: 'Dashboard',
        path: '/dashboard',
        icon: <DashboardIcon />
    },
    {
        title: 'APK Analysis',
        path: '/apk-analysis',
        icon: <AndroidIcon />
    },
    {
        title: 'GitHub Analysis',
        path: '/github-analysis',
        icon: <GitHubIcon />
    },
    {
        title: 'Reports',
        path: '/reports',
        icon: <ReportIcon />
    },
    {
        title: 'Knowledge',
        path: '/knowledge',
        icon: <KnowledgeIcon />,
        children: [
            {
                title: 'Vulnerability Guide',
                path: '/knowledge/vulnerability-guide',
                icon: <VulnerabilityIcon />
            },
            {
                title: 'Best Practices',
                path: '/knowledge/best-practices',
                icon: <DocumentationIcon />
            },
            {
                title: 'Technology Guide',
                path: '/knowledge/technology-guide',
                icon: <TechnologyIcon />
            }
        ]
    },
    {
        title: 'Settings',
        path: '/settings',
        icon: <SettingsIcon />
    }
];

const LogoContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(2, 1),
}));

const Sidebar: React.FC<SidebarProps> = ({ open }) => {
    const theme = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [subMenuOpen, setSubMenuOpen] = React.useState<Record<string, boolean>>({});

    // Check current path to auto-expand relevant submenu
    React.useEffect(() => {
        const newSubMenuState: Record<string, boolean> = {};

        navItems.forEach(item => {
            if (item.children) {
                const isChildActive = item.children.some(child =>
                    location.pathname === child.path || location.pathname.startsWith(child.path + '/')
                );
                newSubMenuState[item.title] = isChildActive;
            }
        });

        setSubMenuOpen(prev => ({
            ...prev,
            ...newSubMenuState
        }));
    }, [location.pathname]);

    const handleNavClick = (path: string) => {
        navigate(path);
    };

    const handleSubMenuToggle = (title: string) => {
        setSubMenuOpen(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    const isActive = (path: string) =>
        location.pathname === path || location.pathname.startsWith(path + '/');

    // Render nav items recursively
    const renderNavItems = (items: NavItem[], level = 0) => {
        return items.map((item) => {
            const isItemActive = isActive(item.path);
            const hasSubMenu = Boolean(item.children && item.children.length > 0);
            const isSubMenuOpen = hasSubMenu && subMenuOpen[item.title];

            return (
                <React.Fragment key={item.path}>
                    <ListItem disablePadding sx={{ display: 'block' }}>
                        <ListItemButton
                            sx={{
                                minHeight: 48,
                                justifyContent: open ? 'initial' : 'center',
                                pl: level * 2 + 2, // Increase padding based on level
                                backgroundColor: isItemActive && !hasSubMenu ?
                                    `${theme.palette.primary.main}1A` : // 10% opacity
                                    'transparent',
                                '&:hover': {
                                    backgroundColor: `${theme.palette.primary.main}14`, // 8% opacity
                                },
                            }}
                            onClick={() => hasSubMenu ? handleSubMenuToggle(item.title) : handleNavClick(item.path)}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 0,
                                    mr: open ? 2 : 'auto',
                                    justifyContent: 'center',
                                    color: isItemActive ? theme.palette.primary.main : 'inherit',
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.title}
                                sx={{
                                    opacity: open ? 1 : 0,
                                    color: isItemActive ? theme.palette.primary.main : 'inherit',
                                    '& .MuiTypography-root': {
                                        fontWeight: isItemActive ? 500 : 400,
                                    }
                                }}
                            />
                            {hasSubMenu && open && (
                                isSubMenuOpen ? <ExpandLess /> : <ExpandMore />
                            )}
                        </ListItemButton>
                    </ListItem>

                    {/* Render submenu if applicable */}
                    {hasSubMenu && (
                        <Collapse in={open && isSubMenuOpen} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                {renderNavItems(item.children!, level + 1)}
                            </List>
                        </Collapse>
                    )}
                </React.Fragment>
            );
        });
    };

    return (
        <Drawer
            variant="permanent"
            open={open}
            sx={{
                width: open ? SIDEBAR_WIDTH : theme.spacing(7),
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: {
                    width: open ? SIDEBAR_WIDTH : theme.spacing(7),
                    boxSizing: 'border-box',
                    borderRight: `1px solid ${theme.palette.divider}`,
                    transition: theme.transitions.create('width', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                    overflowX: 'hidden',
                },
            }}
        >
            <Toolbar />

            <LogoContainer>
                {open && (
                    <Typography variant="h6" color="primary" noWrap>
                        APK Analyzer
                    </Typography>
                )}
                {!open && (
                    <AndroidIcon color="primary" />
                )}
            </LogoContainer>

            <Divider />

            <List>
                {renderNavItems(navItems)}
            </List>

            <Box sx={{ flexGrow: 1 }} />

            <Divider />

            <Box sx={{ p: 2, display: open ? 'block' : 'none' }}>
                <Typography variant="caption" color="text.secondary">
                    Version 1.0.0
                </Typography>
            </Box>
        </Drawer>
    );
};

export default Sidebar;