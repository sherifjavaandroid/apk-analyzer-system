// frontend/src/pages/Knowledge/KnowledgeBase.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardHeader,
    CardActions,
    Button,
    TextField,
    InputAdornment,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Chip,
    useTheme
} from '@mui/material';
import {
    Search as SearchIcon,
    Book as BookIcon,
    BugReport as BugReportIcon,
    Code as CodeIcon,
    Security as SecurityIcon,
    Assignment as AssignmentIcon,
    MobileFriendly as MobileIcon,
    Speed as SpeedIcon,
    ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

// Knowledge categories
const categories = [
    {
        id: 'vulnerability',
        title: 'Security Vulnerabilities',
        icon: <SecurityIcon />,
        count: 42,
        color: '#f44336',
        route: '/knowledge/vulnerability-guide'
    },
    {
        id: 'best-practices',
        title: 'Best Practices',
        icon: <AssignmentIcon />,
        count: 28,
        color: '#4caf50',
        route: '/knowledge/best-practices'
    },
    {
        id: 'technology',
        title: 'Technology Guides',
        icon: <CodeIcon />,
        count: 35,
        color: '#2196f3',
        route: '/knowledge/technology-guide'
    }
];

// Popular articles
const popularArticles = [
    {
        id: 'article-1',
        title: 'Understanding APK Structure',
        category: 'technology',
        excerpt: 'Learn about the internal structure of Android APK files and how they are organized.',
        route: '/knowledge/technology-guide/apk-structure'
    },
    {
        id: 'article-2',
        title: 'Common Android Security Vulnerabilities',
        category: 'vulnerability',
        excerpt: 'An overview of the most common security issues found in Android applications.',
        route: '/knowledge/vulnerability-guide/common-android-vulnerabilities'
    },
    {
        id: 'article-3',
        title: 'Secure Coding Practices for Android',
        category: 'best-practices',
        excerpt: 'Guidelines for writing secure Android code and preventing common security issues.',
        route: '/knowledge/best-practices/secure-coding-android'
    },
    {
        id: 'article-4',
        title: 'Understanding OAuth2 Implementation',
        category: 'vulnerability',
        excerpt: 'A comprehensive guide to implementing OAuth2 securely in mobile applications.',
        route: '/knowledge/vulnerability-guide/oauth2-implementation'
    }
];

// Featured topics
const featuredTopics = [
    {
        id: 'topic-1',
        title: 'Flutter Security',
        category: 'technology',
        icon: <MobileIcon />,
        route: '/knowledge/technology-guide/flutter-security'
    },
    {
        id: 'topic-2',
        title: 'SQL Injection',
        category: 'vulnerability',
        icon: <BugReportIcon />,
        route: '/knowledge/vulnerability-guide/sql-injection'
    },
    {
        id: 'topic-3',
        title: 'Code Obfuscation',
        category: 'best-practices',
        icon: <CodeIcon />,
        route: '/knowledge/best-practices/code-obfuscation'
    },
    {
        id: 'topic-4',
        title: 'Performance Optimization',
        category: 'best-practices',
        icon: <SpeedIcon />,
        route: '/knowledge/best-practices/performance-optimization'
    }
];

const KnowledgeBase: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    // Get category color
    const getCategoryColor = (categoryId: string) => {
        const category = categories.find(cat => cat.id === categoryId);
        return category ? category.color : theme.palette.primary.main;
    };

    // Handle search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real application, this would navigate to search results
        console.log('Searching for:', searchQuery);
    };

    // Navigate to category
    const navigateToCategory = (route: string) => {
        navigate(route);
    };

    // Navigate to article
    const navigateToArticle = (route: string) => {
        // In a real application, this would navigate to the article
        // For now, let's navigate to the parent category
        const parentCategory = route.split('/').slice(0, 3).join('/');
        navigate(parentCategory);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Knowledge Base
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    Comprehensive guides, tutorials, and documentation for APK analysis and security.
                </Typography>

                {/* Search Bar */}
                <Box component="form" onSubmit={handleSearch} sx={{ maxWidth: 600, mx: 'auto', mt: 3 }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search the knowledge base..."
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
            </Box>

            {/* Categories */}
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                Browse by Category
            </Typography>
            <Grid container spacing={3} sx={{ mb: 6 }}>
                {categories.map((category) => (
                    <Grid item xs={12} md={4} key={category.id}>
                        <Card
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-5px)',
                                    boxShadow: 6
                                }
                            }}
                        >
                            <CardHeader
                                avatar={
                                    <Box
                                        sx={{
                                            backgroundColor: `${category.color}20`,
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: category.color
                                        }}
                                    >
                                        {category.icon}
                                    </Box>
                                }
                                title={category.title}
                                subheader={`${category.count} articles`}
                            />
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {category.id === 'vulnerability' &&
                                        'Detailed information about security vulnerabilities, their impact, and how to mitigate them.'}
                                    {category.id === 'best-practices' &&
                                        'Guidelines and recommendations for secure coding, performance optimization, and quality assurance.'}
                                    {category.id === 'technology' &&
                                        'Technical guides for different frameworks, libraries, and technologies used in mobile app development.'}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button
                                    size="small"
                                    endIcon={<ArrowForwardIcon />}
                                    onClick={() => navigateToCategory(category.route)}
                                >
                                    Browse Articles
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Featured Topics */}
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                Featured Topics
            </Typography>
            <Grid container spacing={2} sx={{ mb: 6 }}>
                {featuredTopics.map((topic) => (
                    <Grid item xs={12} sm={6} md={3} key={topic.id}>
                        <Paper
                            sx={{
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                height: '100%',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-5px)',
                                    boxShadow: 3
                                }
                            }}
                            onClick={() => navigateToArticle(topic.route)}
                        >
                            <Box
                                sx={{
                                    backgroundColor: `${getCategoryColor(topic.category)}20`,
                                    width: 60,
                                    height: 60,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: getCategoryColor(topic.category),
                                    mb: 2
                                }}
                            >
                                {topic.icon}
                            </Box>
                            <Typography variant="subtitle1" gutterBottom>
                                {topic.title}
                            </Typography>
                            <Chip
                                label={topic.category.charAt(0).toUpperCase() + topic.category.slice(1)}
                                size="small"
                                sx={{
                                    backgroundColor: `${getCategoryColor(topic.category)}20`,
                                    color: getCategoryColor(topic.category),
                                    mt: 'auto'
                                }}
                            />
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Popular Articles */}
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                Popular Articles
            </Typography>
            <Grid container spacing={3}>
                {popularArticles.map((article) => (
                    <Grid item xs={12} md={6} key={article.id}>
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
                                <Chip
                                    label={article.category.charAt(0).toUpperCase() + article.category.slice(1)}
                                    size="small"
                                    sx={{
                                        backgroundColor: `${getCategoryColor(article.category)}20`,
                                        color: getCategoryColor(article.category),
                                        mb: 1
                                    }}
                                />
                                <Typography variant="h6" gutterBottom>
                                    {article.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    {article.excerpt}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button
                                    size="small"
                                    endIcon={<ArrowForwardIcon />}
                                    onClick={() => navigateToArticle(article.route)}
                                >
                                    Read Article
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Recently Added Section */}
            <Box sx={{ mt: 6 }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                    Recently Added
                </Typography>
                <List sx={{ bgcolor: 'background.paper' }}>
                    {popularArticles.slice(0, 3).map((article, index) => (
                        <React.Fragment key={article.id}>
                            {index > 0 && <Divider component="li" />}
                            <ListItem
                                alignItems="flex-start"
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': {
                                        backgroundColor: 'action.hover'
                                    }
                                }}
                                onClick={() => navigateToArticle(article.route)}
                            >
                                <ListItemIcon>
                                    <BookIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={article.title}
                                    secondary={
                                        <>
                                            <Typography
                                                component="span"
                                                variant="body2"
                                                color="text.primary"
                                            >
                                                {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
                                            </Typography>
                                            {" — " + article.excerpt}
                                        </>
                                    }
                                />
                            </ListItem>
                        </React.Fragment>
                    ))}
                </List>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Button variant="outlined">View All Articles</Button>
                </Box>
            </Box>
        </Box>
    );
};

export default KnowledgeBase;