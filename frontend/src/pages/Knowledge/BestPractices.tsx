// frontend/src/pages/Knowledge/BestPractices.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    TextField,
    InputAdornment,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Tabs,
    Tab,
    Breadcrumbs,
    Link,
    useTheme
} from '@mui/material';
import {
    Search as SearchIcon,
    Assignment as AssignmentIcon,
    Code as CodeIcon,
    Speed as SpeedIcon,
    Security as SecurityIcon,
    Storage as StorageIcon,
    BugReport as BugReportIcon,
    Bolt as BoltIcon,
    Home as HomeIcon,
    ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

// Tab panel interface
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

// Tab panel component
const TabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`best-practices-tabpanel-${index}`}
            aria-labelledby={`best-practices-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
};

// Best practices categories
const bestPracticesCategories = [
    {
        id: 'security',
        title: 'Security',
        icon: <SecurityIcon />,
        color: '#f44336'
    },
    {
        id: 'performance',
        title: 'Performance',
        icon: <SpeedIcon />,
        color: '#4caf50'
    },
    {
        id: 'code-quality',
        title: 'Code Quality',
        icon: <CodeIcon />,
        color: '#2196f3'
    },
    {
        id: 'data-management',
        title: 'Data Management',
        icon: <StorageIcon />,
        color: '#9c27b0'
    },
    {
        id: 'testing',
        title: 'Testing',
        icon: <BugReportIcon />,
        color: '#ff9800'
    }
];

// Mock best practices
const bestPractices = [
//

return (
    <Box sx={{ p: 3 }}>
        {/* Breadcrumbs Navigation */}
        <Breadcrumbs sx={{ mb: 3 }}>
            <Link
                underline="hover"
                color="inherit"
                sx={{ display: 'flex', alignItems: 'center' }}
                onClick={() => navigate('/')}
                style={{ cursor: 'pointer' }}
            >
                <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Home
            </Link>
            <Link
                underline="hover"
                color="inherit"
                sx={{ display: 'flex', alignItems: 'center' }}
                onClick={() => navigate('/knowledge')}
                style={{ cursor: 'pointer' }}
            >
                <AssignmentIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Knowledge Base
            </Link>
            <Typography
                sx={{ display: 'flex', alignItems: 'center' }}
                color="text.primary"
            >
                <SecurityIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Best Practices
            </Typography>
        </Breadcrumbs>

        <Typography variant="h4" component="h1" gutterBottom>
            Mobile Development Best Practices
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
            Guidelines and recommendations for secure, efficient, and high-quality mobile application development.
        </Typography>

        {/* Search Bar */}
        <Box component="form" onSubmit={handleSearch} sx={{ mb: 4, maxWidth: 600 }}>
            <TextField
                fullWidth
                variant="outlined"
                placeholder="Search best practices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            <Button variant="contained" type="submit" size="small">
                                Search
                            </Button>
                        </InputAdornment>
                    ),
                }}
            />
        </Box>

        {/* Categories Tabs */}
        <Paper sx={{ width: '100%', mb: 4 }}>
            <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
                <Tab label="All" icon={<AssignmentIcon />} iconPosition="start" />
                {bestPracticesCategories.map((category, index) => (
                    <Tab
                        key={category.id}
                        label={category.title}
                        icon={category.icon}
                        iconPosition="start"
                        sx={{ color: tabValue === index + 1 ? category.color : 'inherit' }}
                    />
                ))}
            </Tabs>
        </Paper>

        {/* All Best Practices */}
        <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
                {bestPractices.map((practice) => (
                    <Grid item xs={12} md={6} key={practice.id}>
                        <Card
                            sx={{
                                height: '100%',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-5px)',
                                    boxShadow: 4
                                }
                            }}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Chip
                                        label={bestPracticesCategories.find(cat => cat.id === practice.category)?.title}
                                        size="small"
                                        sx={{
                                            backgroundColor: `${bestPracticesCategories.find(cat => cat.id === practice.category)?.color}20`,
                                            color: bestPracticesCategories.find(cat => cat.id === practice.category)?.color
                                        }}
                                    />
                                    <Chip
                                        label={practice.difficulty}
                                        size="small"
                                        sx={{
                                            backgroundColor: `${difficultyColors[practice.difficulty as keyof typeof difficultyColors]}20`,
                                            color: difficultyColors[practice.difficulty as keyof typeof difficultyColors]
                                        }}
                                    />
                                </Box>
                                <Typography variant="h6" gutterBottom>
                                    {practice.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {practice.description}
                                </Typography>
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Key Points:
                                    </Typography>
                                    <List dense disablePadding>
                                        {practice.key_points.map((point, index) => (
                                            <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                                                <ListItemIcon sx={{ minWidth: 30 }}>
                                                    <BoltIcon fontSize="small" color="primary" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={point}
                                                    primaryTypographyProps={{ variant: 'body2' }}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            </CardContent>
                            <CardActions>
                                <Button
                                    size="small"
                                    endIcon={<ArrowForwardIcon />}
                                    onClick={() => {}} // Navigate to detailed guide
                                >
                                    Detailed Guide
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </TabPanel>

        {/* Category-specific Best Practices */}
        {bestPracticesCategories.map((category, index) => (
            <TabPanel value={tabValue} index={index + 1} key={category.id}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" gutterBottom sx={{ color: category.color }}>
                        {category.title} Best Practices
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        {category.id === 'security' && 'Guidelines for implementing secure coding practices in mobile applications.'}
                        {category.id === 'performance' && 'Techniques to optimize application performance and resource usage.'}
                        {category.id === 'code-quality' && 'Standards and practices for maintaining high-quality, maintainable code.'}
                        {category.id === 'data-management' && 'Best practices for efficient data storage, retrieval, and management.'}
                        {category.id === 'testing' && 'Strategies and techniques for comprehensive testing of mobile applications.'}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                </Box>

                <Grid container spacing={3}>
                    {bestPractices
                        .filter(practice => practice.category === category.id)
                        .map((practice) => (
                            <Grid item xs={12} md={6} key={practice.id}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        transition: 'transform 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-5px)',
                                            boxShadow: 4
                                        }
                                    }}
                                >
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                                            <Chip
                                                label={practice.difficulty}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${difficultyColors[practice.difficulty as keyof typeof difficultyColors]}20`,
                                                    color: difficultyColors[practice.difficulty as keyof typeof difficultyColors]
                                                }}
                                            />
                                        </Box>
                                        <Typography variant="h6" gutterBottom>
                                            {practice.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            {practice.description}
                                        </Typography>
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Key Points:
                                            </Typography>
                                            <List dense disablePadding>
                                                {practice.key_points.map((point, index) => (
                                                    <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                                                        <ListItemIcon sx={{ minWidth: 30 }}>
                                                            <BoltIcon fontSize="small" color="primary" />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={point}
                                                            primaryTypographyProps={{ variant: 'body2' }}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Box>
                                    </CardContent>
                                    <CardActions>
                                        <Button
                                            size="small"
                                            endIcon={<ArrowForwardIcon />}
                                            onClick={() => {}} // Navigate to detailed guide
                                        >
                                            Detailed Guide
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                </Grid>
            </TabPanel>
        ))}
    </Box>
);
};

export default BestPractices; Security practices
{
    id: 'secure-storage',
        title: 'Secure Data Storage',
    category: 'security',
    difficulty: 'Medium',
    description: 'Guidelines for securely storing sensitive data in mobile applications.',
    key_points: [
    'Never store sensitive data in SharedPreferences or UserDefaults in plaintext',
    'Use Android Keystore System or iOS Keychain for storing encryption keys',
    'Encrypt sensitive data before storing it in local databases',
    'Clear sensitive data from memory when no longer needed'
]
},
{
    id: 'secure-networking',
        title: 'Secure Networking Practices',
    category: 'security',
    difficulty: 'Medium',
    description: 'Best practices for secure network communication in mobile apps.',
    key_points: [
    'Always use HTTPS for network communications',
    'Implement certificate pinning to prevent man-in-the-middle attacks',
    'Validate server certificates properly',
    'Use modern encryption protocols (TLS 1.2+)'
]
},
{
    id: 'authentication-best',
        title: 'Authentication Best Practices',
    category: 'security',
    difficulty: 'Hard',
    description: 'Guidelines for implementing secure authentication in mobile apps.',
    key_points: [
    'Use OAuth 2.0 or OpenID Connect for authentication when possible',
    'Implement proper session management with secure token handling',
    'Support multi-factor authentication',
    'Enforce strong password policies'
]
},

// Performance practices
{
    id: 'ui-performance',
        title: 'UI Rendering Optimization',
    category: 'performance',
    difficulty: 'Medium',
    description: 'Techniques to optimize UI rendering performance in mobile apps.',
    key_points: [
    'Flatten view hierarchies to reduce nested layouts',
    'Use RecyclerView/UICollectionView efficiently with view recycling',
    'Avoid overdraw by optimizing transparency and background drawing',
    'Use hardware acceleration appropriately'
]
},
{
    id: 'memory-management',
        title: 'Memory Management',
    category: 'performance',
    difficulty: 'Hard',
    description: 'Best practices for efficient memory management in mobile applications.',
    key_points: [
    'Avoid memory leaks by properly releasing resources',
    'Use weak references for callback listeners',
    'Optimize bitmap memory usage by resizing images',
    'Implement proper caching strategies'
]
},

// Code Quality practices
{
    id: 'clean-architecture',
        title: 'Clean Architecture',
    category: 'code-quality',
    difficulty: 'Hard',
    description: 'Guidelines for implementing clean architecture in mobile applications.',
    key_points: [
    'Separate your code into distinct layers (presentation, domain, data)',
    'Use dependency injection for better testability',
    'Follow SOLID principles',
    'Implement proper error handling across layers'
]
},
{
    id: 'code-style',
        title: 'Code Style Guidelines',
    category: 'code-quality',
    difficulty: 'Easy',
    description: 'Standards for code formatting and style to improve maintainability.',
    key_points: [
    'Follow language-specific conventions (Kotlin style guide, Swift style guide)',
    'Use consistent naming conventions',
    'Document your code with proper comments and documentation',
    'Use static analysis tools to enforce style'
]
},

// Data Management practices
{
    id: 'database-optimization',
        title: 'Database Optimization',
    category: 'data-management',
    difficulty: 'Medium',
    description: 'Techniques for optimizing local database performance in mobile apps.',
    key_points: [
    'Use indexes appropriately for frequently queried fields',
    'Structure your database schema efficiently',
    'Use transactions for multiple operations',
    'Implement proper migration strategies'
]
},

// Testing practices
{
    id: 'unit-testing',
        title: 'Effective Unit Testing',
    category: 'testing',
    difficulty: 'Medium',
    description: 'Guidelines for writing effective unit tests for mobile applications.',
    key_points: [
    'Follow the AAA pattern (Arrange, Act, Assert)',
    'Mock dependencies to isolate units under test',
    'Test edge cases and error scenarios',
    'Maintain high test coverage for critical components'
]
}
];

// Difficulty colors
const difficultyColors = {
    'Easy': '#4caf50',
    'Medium': '#ff9800',
    'Hard': '#f44336'
};

const BestPractices: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [tabValue, setTabValue] = useState(0);

    // Handle search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Implement search functionality
    };

    // Handle tab change
    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

//