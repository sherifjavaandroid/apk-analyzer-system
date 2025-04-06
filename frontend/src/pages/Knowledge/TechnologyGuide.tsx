// frontend/src/pages/Knowledge/TechnologyGuide.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardMedia,
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
    Breadcrumbs,
    Link,
    useTheme
} from '@mui/material';
import {
    Search as SearchIcon,
    Assignment as AssignmentIcon,
    Code as CodeIcon,
    Home as HomeIcon,
    ArrowForward as ArrowForwardIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { SiFlutter, SiReactnative, SiKotlin, SiSwift, SiJavascript, SiDart, SiAndroid, SiApple } from 'react-icons/si';

// Technology categories
const technologyCategories = [
    {
        id: 'frameworks',
        title: 'Mobile Frameworks',
        description: 'Cross-platform and native mobile development frameworks.'
    },
    {
        id: 'languages',
        title: 'Programming Languages',
        description: 'Programming languages used in mobile app development.'
    },
    {
        id: 'architecture',
        title: 'Architecture Patterns',
        description: 'Common architectural patterns for mobile applications.'
    },
    {
        id: 'libraries',
        title: 'Popular Libraries',
        description: 'Commonly used libraries and SDKs for mobile development.'
    }
];

// Technology frameworks
const frameworks = [
    {
        id: 'flutter',
        name: 'Flutter',
        category: 'frameworks',
        icon: <SiFlutter size={40} color="#02569B" />,
        description: 'Google's UI toolkit for building natively compiled applications for mobile, web, and desktop from a single codebase.',
        language: 'Dart',
        platforms: ['Android', 'iOS', 'Web', 'Desktop'],
        pros: [
            'Single codebase for multiple platforms',
            'High performance with native compilation',
            'Rich widget library for UI',
            'Hot reload for fast development'
        ],
        cons: [
            'Larger app size compared to native apps',
            'Still maturing ecosystem',
            'Limited access to some platform-specific features',
            'Steeper learning curve for beginners'
        ],
        detection: [
            'Flutter files in APK structure',
            'libflutter.so native library',
            'Flutter-specific UI rendering'
        ],
        security: [
            'Code obfuscation with R8/ProGuard',
            'Secure storage with Flutter Secure Storage',
            'Network security configuration',
            'App signing and verification'
        ]
    },
    {
        id: 'react-native',
        name: 'React Native',
        category: 'frameworks',
        icon: <SiReactnative size={40} color="#61DAFB" />,
        description: 'Facebook's framework for building native mobile apps using JavaScript and React.',
        language: 'JavaScript/TypeScript',
        platforms: ['Android', 'iOS'],
        pros: [
            'Single codebase for multiple platforms',
            'Large community and ecosystem',
            'Familiar React paradigm',
            'Hot reload for fast development'
        ],
        cons: [
            'Performance not as good as native for complex UIs',
            'Requires native modules for some features',
            'Dependency management can be complex',
            'Version upgrades can be challenging'
        ],
        detection: [
            'index.android.bundle or index.ios.bundle files',
            'React Native bridge in native code',
            'JavaScript bundle structure'
        ],
        security: [
            'Code obfuscation with Hermes engine',
            'Secure storage with react-native-keychain',
            'Network security with TLS pinning',
            'JavaScript code protection'
        ]
    },
    {
        id: 'native-android',
        name: 'Native Android',
        category: 'frameworks',
        icon: <SiAndroid size={40} color="#3DDC84" />,
        description: 'Development directly using the Android SDK and platform-specific features.',
        language: 'Kotlin/Java',
        platforms: ['Android'],
        pros: [
            'Full access to all platform features',
            'Best performance for Android apps',
            'Direct support from Google',
            'Extensive documentation and resources'
        ],
        cons: [
            'Platform-specific (Android only)',
            'More code to maintain for multi-platform apps',
            'Longer development time',
            'UI consistency challenges across different Android versions'
        ],
        detection: [
            'Traditional Android app structure',
            'Native Java/Kotlin compiled code',
            'Android-specific resources and assets'
        ],
        security: [
            'ProGuard/R8 code obfuscation',
            'Android Keystore System',
            'Android security best practices',
            'Content providers security'
        ]
    },
    {
        id: 'ios-native',
        name: 'Native iOS',
        category: 'frameworks',
        icon: <SiApple size={40} color="#000000" />,
        description: 'Development directly using iOS SDK and platform-specific features.',
        language: 'Swift/Objective-C',
        platforms: ['iOS'],
        pros: [
            'Full access to all iOS platform features',
            'Best performance for iOS apps',
            'Direct support from Apple',
            'Seamless integration with Apple ecosystem'
        ],
        cons: [
            'Platform-specific (iOS only)',
            'Requires Mac for development',
            'More code to maintain for multi-platform apps',
            'Longer development time'
        ],
        detection: [
            'Not applicable for APK analysis (iOS uses IPA format)',
            'However, some cross-platform apps may have iOS-specific code'
        ],
        security: [
            'App Transport Security (ATS)',
            'iOS Keychain for secure storage',
            'Code signing and app sandboxing',
            'Swift/Objective-C code obfuscation'
        ]
    }
];

// Programming languages
const languages = [
    {
        id: 'kotlin',
        name: 'Kotlin',
        category: 'languages',
        icon: <SiKotlin size={40} color="#7F52FF" />,
        description: 'Modern, concise programming language for Android development, officially supported by Google.',
        platforms: ['Android', 'Cross-platform (Kotlin Multiplatform)'],
        features: [
            'Null safety',
            'Extension functions',
            'Coroutines for asynchronous programming',
            'Interoperability with Java'
        ],
        detection: [
            'Kotlin metadata in compiled DEX files',
            'Kotlin standard library',
            'Kotlin-specific bytecode patterns'
        ]
    },
    {
        id: 'swift',
        name: 'Swift',
        category: 'languages',
        icon: <SiSwift size={40} color="#FA7343" />,
        description: 'Apple's programming language for iOS, macOS, watchOS, and tvOS app development.',
        platforms: ['iOS', 'macOS', 'watchOS', 'tvOS'],
        features: [
            'Type safety',
            'Optionals for handling nil values',
            'Protocol-oriented programming',
            'Automatic reference counting (ARC)'
        ],
        detection: [
            'Not directly detectable in APKs (iOS uses Swift)',
            'May be identified in cross-platform frameworks'
        ]
    },
    {
        id: 'javascript',
        name: 'JavaScript',
        category: 'languages',
        icon: <SiJavascript size={40} color="#F7DF1E" />,
        description: 'Dynamic programming language commonly used with React Native and other hybrid frameworks.',
        platforms: ['Cross-platform'],
        features: [
            'Dynamic typing',
            'Event-driven programming',
            'Closures and first-class functions',
            'Large ecosystem (npm)'
        ],
        detection: [
            'JavaScript bundles in assets',
            'JS engine libraries (Hermes, JavaScriptCore)',
            'JS-native bridge implementations'
        ]
    },
    {
        id: 'dart',
        name: 'Dart',
        category: 'languages',
        icon: <SiDart size={40} color="#0175C2" />,
        description: 'Google's programming language used primarily with the Flutter framework.',
        platforms: ['Cross-platform'],
        features: [
            'AOT and JIT compilation',
            'Type safety with sound null safety',
            'Asynchronous programming with async/await',
            'Optimized for UI development'
        ],
        detection: [
            'Dart VM or compiled Dart code',
            'Flutter framework dependencies',
            'Dart-specific libraries and patterns'
        ]
    }
];

// Architecture patterns
const architecturePatterns = [
    {
        id: 'mvvm',
        name: 'MVVM (Model-View-ViewModel)',
        category: 'architecture',
        description: 'Architecture pattern that separates UI from business logic using a ViewModel layer.',
        frameworks: ['Android (with DataBinding)', 'iOS (with Combine/SwiftUI)', 'Cross-platform'],
        keyComponents: [
            'Model: Data and business logic',
            'View: UI elements and display logic',
            'ViewModel: Mediator between Model and View',
            'Data binding: Connects View and ViewModel'
        ],
        benefits: [
            'Separation of concerns',
            'Testability of business logic',
            'UI state management',
            'Reusability of components'
        ]
    },
    {
        id: 'mvp',
        name: 'MVP (Model-View-Presenter)',
        category: 'architecture',
        description: 'Architecture pattern where the Presenter acts as a middle-man between Model and View.',
        frameworks: ['Android', 'iOS', 'Cross-platform'],
        keyComponents: [
            'Model: Data and business logic',
            'View: UI elements and user interaction',
            'Presenter: Handles view logic and model updates',
            'Contracts: Interfaces defining View-Presenter communication'
        ],
        benefits: [
            'Clear separation of responsibilities',
            'Highly testable',
            'View is separated from data access',
            'Good for complex UIs'
        ]
    },
    {
        id: 'clean-architecture',
        name: 'Clean Architecture',
        category: 'architecture',
        description: 'Architecture approach focusing on separation of concerns with layered design.',
        frameworks: ['Android', 'iOS', 'Cross-platform'],
        keyComponents: [
            'Entities: Enterprise business rules',
            'Use Cases: Application-specific business rules',
            'Interface Adapters: Presenters, Controllers, Gateways',
            'Frameworks & Drivers: UI, Database, External systems'
        ],
        benefits: [
            'Independence of frameworks',
            'Testability',
            'Independence of UI',
            'Independence of database',
            'Independence of external agencies'
        ]
    }
];

const TechnologyGuide: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    // Handle search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Implement search functionality
    };

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
                    <CodeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                    Technology Guide
                </Typography>
            </Breadcrumbs>

            <Typography variant="h4" component="h1" gutterBottom>
                Mobile Development Technologies
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                Comprehensive guide to frameworks, languages, architecture patterns, and libraries used in mobile app development.
            </Typography>

            {/* Search Bar */}
            <Box component="form" onSubmit={handleSearch} sx={{ mb: 4, maxWidth: 600 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search technologies..."
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

            {/* Frameworks Section */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                Mobile Frameworks
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
                Popular frameworks used for mobile application development, each with their own strengths and detection patterns.
            </Typography>
            <Grid container spacing={3} sx={{ mb: 6 }}>
                {frameworks.map((framework) => (
                    <Grid item xs={12} md={6} key={framework.id}>
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
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ mr: 2 }}>
                                        {framework.icon}
                                    </Box>
                                    <Box>
                                        <Typography variant="h6">{framework.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {framework.language}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Typography variant="body2" paragraph>
                                    {framework.description}
                                </Typography>

                                <Typography variant="subtitle2" gutterBottom>
                                    Supported Platforms
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                    {framework.platforms.map((platform) => (
                                        <Chip
                                            key={platform}
                                            label={platform}
                                            size="small"
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Pros
                                        </Typography>
                                        <List dense disablePadding>
                                            {framework.pros.map((pro, index) => (
                                                <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                                                    <ListItemIcon sx={{ minWidth: 30 }}>
                                                        <CheckCircleIcon fontSize="small" color="success" />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={pro}
                                                        primaryTypographyProps={{ variant: 'body2' }}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Cons
                                        </Typography>
                                        <List dense disablePadding>
                                            {framework.cons.map((con, index) => (
                                                <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                                                    <ListItemIcon sx={{ minWidth: 30 }}>
                                                        <CancelIcon fontSize="small" color="error" />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={con}
                                                        primaryTypographyProps={{ variant: 'body2' }}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Grid>
                                </Grid>

                                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                    Detection Patterns
                                </Typography>
                                <List dense disablePadding>
                                    {framework.detection.map((pattern, index) => (
                                        <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                                            <ListItemIcon sx={{ minWidth: 30 }}>
                                                <CodeIcon fontSize="small" color="primary" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={pattern}
                                                primaryTypographyProps={{ variant: 'body2' }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
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

            {/* Programming Languages Section */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                Programming Languages
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
                Key programming languages used in mobile app development, with their features and characteristics.
            </Typography>
            <Grid container spacing={3} sx={{ mb: 6 }}>
                {languages.map((language) => (
                    <Grid item xs={12} sm={6} md={3} key={language.id}>
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
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                    {language.icon}
                                </Box>
                                <Typography variant="h6" align="center" gutterBottom>
                                    {language.name}
                                </Typography>
                                <Typography variant="body2" align="center" color="text.secondary" paragraph>
                                    {language.description}
                                </Typography>

                                <Typography variant="subtitle2" gutterBottom>
                                    Platforms
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                    {language.platforms.map((platform) => (
                                        <Chip
                                            key={platform}
                                            label={platform}
                                            size="small"
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>

                                <Typography variant="subtitle2" gutterBottom>
                                    Key Features
                                </Typography>
                                <List dense disablePadding>
                                    {language.features.map((feature, index) => (
                                        <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                                            <ListItemIcon sx={{ minWidth: 30 }}>
                                                <CheckCircleIcon fontSize="small" color="primary" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={feature}
                                                primaryTypographyProps={{ variant: 'body2' }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>

                                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                    Detection Patterns
                                </Typography>
                                <List dense disablePadding>
                                    {language.detection.map((pattern, index) => (
                                        <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                                            <ListItemIcon sx={{ minWidth: 30 }}>
                                                <CodeIcon fontSize="small" color="primary" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={pattern}
                                                primaryTypographyProps={{ variant: 'body2' }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Architecture Patterns Section */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                Architecture Patterns
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
                Common architectural patterns used in mobile application development, with their components and benefits.
            </Typography>
            <Grid container spacing={3} sx={{ mb: 6 }}>
                {architecturePatterns.map((pattern) => (
                    <Grid item xs={12} md={4} key={pattern.id}>
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
                                <Typography variant="h6" gutterBottom>
                                    {pattern.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    {pattern.description}
                                </Typography>

                                <Typography variant="subtitle2" gutterBottom>
                                    Used With
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                    {pattern.frameworks.map((framework) => (
                                        <Chip
                                            key={framework}
                                            label={framework}
                                            size="small"
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>

                                <Typography variant="subtitle2" gutterBottom>
                                    Key Components
                                </Typography>
                                <List dense disablePadding>
                                    {pattern.keyComponents.map((component, index) => (
                                        <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                                            <ListItemIcon sx={{ minWidth: 30 }}>
                                                <CodeIcon fontSize="small" color="primary" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={component}
                                                primaryTypographyProps={{ variant: 'body2' }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>

                                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                    Benefits
                                </Typography>
                                <List dense disablePadding>
                                    {pattern.benefits.map((benefit, index) => (
                                        <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                                            <ListItemIcon sx={{ minWidth: 30 }}>
                                                <CheckCircleIcon fontSize="small" color="success" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={benefit}
                                                primaryTypographyProps={{ variant: 'body2' }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
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
        </Box>
    );
};

export default TechnologyGuide;