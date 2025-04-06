// frontend/src/components/apk-analysis/TechnologyPanel.tsx
import React, { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Card,
    CardContent,
    CardHeader,
    Divider,
    Chip,
    Avatar,
    List,
    ListItem,
    ListItemText,
    LinearProgress,
    Tabs,
    Tab,
    useTheme
} from '@mui/material';
import {
    Code as CodeIcon,
    Android as AndroidIcon,
    ViewModule as ViewModuleIcon,
    Storage as StorageIcon,
    Dns as DnsIcon,
    Analytics as AnalyticsIcon,
    MonetizationOn as MonetizationOnIcon,
    Devices as DevicesIcon,
    GitHub as GitHubIcon,
    Language as LanguageIcon
} from '@mui/icons-material';

// Additional framework icons
import { SiFlutter, SiReact, SiXamarin, SiApachecordova, SiUnity } from 'react-icons/si';

// Types
interface TechnologyDetectionResult {
    frameworks: {
        detected: string[];
        details: Record<string, any>;
    };
    libraries: {
        detected: string[];
        details: Record<string, any>;
        categories?: Record<string, string[]>;
    };
    ui_toolkit: {
        detected: string | null;
        details: Record<string, any>;
    };
    programming_languages: {
        detected: string[];
        details: Record<string, any>;
    };
    backend_technologies: {
        detected: string[];
        details: Record<string, any>;
    };
    analytics_services: {
        detected: string[];
        details: Record<string, any>;
    };
    ad_networks: {
        detected: string[];
        details: Record<string, any>;
    };
}

interface TechnologyPanelProps {
    technology?: TechnologyDetectionResult;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tech-tabpanel-${index}`}
            aria-labelledby={`tech-tab-${index}`}
            {...other}
            style={{ width: '100%' }}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
};

const TechnologyPanel: React.FC<TechnologyPanelProps> = ({ technology }) => {
    const theme = useTheme();
    const [tabValue, setTabValue] = useState(0);

    if (!technology) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                    Technology detection results not available.
                </Typography>
            </Box>
        );
    }

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // Get framework icon
    const getFrameworkIcon = (framework: string) => {
        switch (framework.toLowerCase()) {
            case 'flutter':
                return <SiFlutter size={24} color={theme.palette.primary.main} />;
            case 'react native':
                return <SiReact size={24} color={theme.palette.primary.main} />;
            case 'xamarin':
                return <SiXamarin size={24} color={theme.palette.primary.main} />;
            case 'cordova':
            case 'cordova/phonegap':
                return <SiApachecordova size={24} color={theme.palette.primary.main} />;
            case 'unity':
                return <SiUnity size={24} color={theme.palette.primary.main} />;
            case 'native android':
            default:
                return <AndroidIcon color="primary" />;
        }
    };

    // Get main framework
    const getMainFramework = () => {
        if (!technology.frameworks.detected || technology.frameworks.detected.length === 0) {
            return 'Native Android';
        }
        return technology.frameworks.detected[0];
    };

    const mainFramework = getMainFramework();
    const frameworkVersion = technology.frameworks.details[mainFramework]?.version || 'Unknown';

    return (
        <Box>
            {/* Framework Overview */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item>
                        <Avatar
                            sx={{
                                width: 64,
                                height: 64,
                                bgcolor: `${theme.palette.primary.main}20`,
                            }}
                        >
                            {getFrameworkIcon(mainFramework)}
                        </Avatar>
                    </Grid>
                    <Grid item xs>
                        <Typography variant="h5">
                            {mainFramework}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, flexWrap: 'wrap', gap: 1 }}>
                            <Chip
                                label={`Version: ${frameworkVersion}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                            {technology.programming_languages.detected.map((language, index) => (
                                <Chip
                                    key={index}
                                    label={language}
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                />
                            ))}
                            {technology.ui_toolkit.detected && (
                                <Chip
                                    label={`UI: ${technology.ui_toolkit.detected}`}
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                />
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Tabs Navigation */}
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab
                        label="Overview"
                        icon={<CodeIcon />}
                        iconPosition="start"
                    />
                    <Tab
                        label="Libraries"
                        icon={<ViewModuleIcon />}
                        iconPosition="start"
                    />
                    <Tab
                        label="Backend"
                        icon={<DnsIcon />}
                        iconPosition="start"
                    />
                    <Tab
                        label="Analytics & Ads"
                        icon={<AnalyticsIcon />}
                        iconPosition="start"
                    />
                </Tabs>

                {/* Overview Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={3}>
                        {/* Main Framework */}
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardHeader
                                    title="Framework Details"
                                    titleTypographyProps={{ variant: 'h6' }}
                                    avatar={<CodeIcon />}
                                />
                                <Divider />
                                <CardContent>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <Avatar sx={{ mr: 2, bgcolor: `${theme.palette.primary.main}20` }}>
                                                    {getFrameworkIcon(mainFramework)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="h6">{mainFramework}</Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Version: {frameworkVersion}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {technology.frameworks.details[mainFramework]?.confidence && (
                                                <Box sx={{ mt: 2, mb: 3 }}>
                                                    <Typography variant="body2" gutterBottom>
                                                        Detection Confidence
                                                    </Typography>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={technology.frameworks.details[mainFramework].confidence}
                                                        sx={{ height: 10, borderRadius: 5 }}
                                                    />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {technology.frameworks.details[mainFramework].confidence}%
                                                    </Typography>
                                                </Box>
                                            )}

                                            <Typography variant="body2" paragraph>
                                                {mainFramework === 'Flutter' && 'Flutter is Google\'s UI toolkit for building natively compiled applications for mobile, web, and desktop from a single codebase. It uses Dart as the programming language.'}
                                                {mainFramework === 'React Native' && 'React Native is a framework for building native mobile apps using JavaScript and React. It allows developers to use React along with native platform capabilities.'}
                                                {mainFramework === 'Xamarin' && 'Xamarin is a Microsoft platform for building mobile apps with .NET and C#. It allows developers to share code across platforms while still delivering native performance.'}
                                                {mainFramework === 'Cordova/PhoneGap' && 'Apache Cordova (formerly PhoneGap) is a platform for building mobile applications using HTML, CSS, and JavaScript. It wraps your web application in a native container.'}
                                                {mainFramework === 'Unity' && 'Unity is a cross-platform game engine developed by Unity Technologies, primarily used to develop video games and simulations for mobile devices, but can be used for many other applications.'}
                                                {mainFramework === 'Native Android' && 'This application is developed using the native Android development stack, which typically involves Java or Kotlin programming languages and the Android SDK.'}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Programming Languages */}
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardHeader
                                    title="Programming Languages"
                                    titleTypographyProps={{ variant: 'h6' }}
                                    avatar={<LanguageIcon />}
                                />
                                <Divider />
                                <CardContent>
                                    {technology.programming_languages.detected.length > 0 ? (
                                        <Grid container spacing={2}>
                                            {technology.programming_languages.detected.map((language, index) => {
                                                const details = technology.programming_languages.details[language] || {};
                                                const isPrimary = details.primary || index === 0;
                                                return (
                                                    <Grid item xs={12} key={index}>
                                                        <Paper
                                                            variant="outlined"
                                                            sx={{
                                                                p: 2,
                                                                bgcolor: isPrimary ? `${theme.palette.primary.main}10` : undefined,
                                                                border: isPrimary ? `1px solid ${theme.palette.primary.main}` : undefined,
                                                            }}
                                                        >
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Typography variant="subtitle1" fontWeight={isPrimary ? 500 : 400}>
                                                                    {language}
                                                                    {isPrimary && (
                                                                        <Chip
                                                                            label="Primary"
                                                                            size="small"
                                                                            color="primary"
                                                                            sx={{ ml: 1 }}
                                                                        />
                                                                    )}
                                                                </Typography>
                                                                {details.confidence && (
                                                                    <Chip
                                                                        label={`${details.confidence}% confidence`}
                                                                        size="small"
                                                                        variant="outlined"
                                                                    />
                                                                )}
                                                            </Box>
                                                        </Paper>
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No programming languages detected.
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* UI Toolkit */}
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardHeader
                                    title="UI Toolkit"
                                    titleTypographyProps={{ variant: 'h6' }}
                                    avatar={<DevicesIcon />}
                                />
                                <Divider />
                                <CardContent>
                                    {technology.ui_toolkit.detected ? (
                                        <Box>
                                            <Typography variant="h6" gutterBottom>
                                                {technology.ui_toolkit.detected}
                                            </Typography>

                                            {technology.ui_toolkit.details.confidence && (
                                                <Box sx={{ mt: 2, mb: 3 }}>
                                                    <Typography variant="body2" gutterBottom>
                                                        Detection Confidence
                                                    </Typography>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={technology.ui_toolkit.details.confidence}
                                                        sx={{ height: 10, borderRadius: 5 }}
                                                    />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {technology.ui_toolkit.details.confidence}%
                                                    </Typography>
                                                </Box>
                                            )}

                                            {technology.ui_toolkit.details.alternative_toolkits &&
                                                technology.ui_toolkit.details.alternative_toolkits.length > 0 && (
                                                    <Box sx={{ mt: 2 }}>
                                                        <Typography variant="body2" gutterBottom>
                                                            Alternative Toolkits Detected
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                            {technology.ui_toolkit.details.alternative_toolkits.map((toolkit, index) => (
                                                                <Chip
                                                                    key={index}
                                                                    label={toolkit}
                                                                    size="small"
                                                                    variant="outlined"
                                                                />
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                )}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No specific UI toolkit detected.
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Other Frameworks */}
                        {technology.frameworks.detected.length > 1 && (
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardHeader
                                        title="Additional Frameworks"
                                        titleTypographyProps={{ variant: 'h6' }}
                                        avatar={<ViewModuleIcon />}
                                    />
                                    <Divider />
                                    <CardContent>
                                        <List disablePadding>
                                            {technology.frameworks.detected.slice(1).map((framework, index) => {
                                                const details = technology.frameworks.details[framework] || {};
                                                return (
                                                    <ListItem key={index} divider={index < technology.frameworks.detected.length - 2}>
                                                        <ListItemText
                                                            primary={framework}
                                                            secondary={`Version: ${details.version || 'Unknown'}`}
                                                            primaryTypographyProps={{ fontWeight: 500 }}
                                                        />
                                                        {details.confidence && (
                                                            <Chip
                                                                label={`${details.confidence}% confidence`}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        )}
                                                    </ListItem>
                                                );
                                            })}
                                        </List>
                                    </CardContent>
                                </Card>
                            </Grid>
                        )}
                    </Grid>
                </TabPanel>

                {/* Libraries Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Grid container spacing={3}>
                        {/* Library Categories */}
                        {technology.libraries.categories && Object.keys(technology.libraries.categories).length > 0 && (
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Libraries by Category
                                </Typography>
                                <Grid container spacing={2}>
                                    {Object.entries(technology.libraries.categories).map(([category, libs], index) => (
                                        <Grid item xs={12} sm={6} md={4} key={index}>
                                            <Card variant="outlined">
                                                <CardHeader
                                                    title={category}
                                                    titleTypographyProps={{ variant: 'subtitle1' }}
                                                    subheader={`${libs.length} libraries`}
                                                    subheaderTypographyProps={{ variant: 'caption' }}
                                                />
                                                <Divider />
                                                <CardContent sx={{ pt: 1 }}>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                        {libs.map((lib, libIndex) => (
                                                            <Chip
                                                                key={libIndex}
                                                                label={lib}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        ))}
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Grid>
                        )}

                        {/* All Libraries */}
                        <Grid item xs={12}>
                            <Card>
                                <CardHeader
                                    title="Detected Libraries"
                                    titleTypographyProps={{ variant: 'h6' }}
                                    avatar={<ViewModuleIcon />}
                                    subheader={`${technology.libraries.detected.length} libraries detected`}
                                />
                                <Divider />
                                <CardContent>
                                    {technology.libraries.detected.length > 0 ? (
                                        <Grid container spacing={1}>
                                            {technology.libraries.detected.map((library, index) => {
                                                const details = technology.libraries.details[library] || {};
                                                return (
                                                    <Grid item xs={12} sm={6} md={4} key={index}>
                                                        <Paper variant="outlined" sx={{ p: 1.5 }}>
                                                            <Typography variant="subtitle2" noWrap>
                                                                {library}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                                                                {details.category && (
                                                                    <Chip
                                                                        label={details.category}
                                                                        size="small"
                                                                        variant="outlined"
                                                                    />
                                                                )}
                                                                {details.confidence && (
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {details.confidence}% confidence
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </Paper>
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No libraries detected.
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Backend Tab */}
                <TabPanel value={tabValue} index={2}>
                    <Grid container spacing={3}>
                        {/* Backend Technologies */}
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardHeader
                                    title="Backend Technologies"
                                    titleTypographyProps={{ variant: 'h6' }}
                                    avatar={<DnsIcon />}
                                />
                                <Divider />
                                <CardContent>
                                    {technology.backend_technologies.detected.length > 0 ? (
                                        <Grid container spacing={2}>
                                            {technology.backend_technologies.detected.map((tech, index) => {
                                                const details = technology.backend_technologies.details[tech] || {};
                                                return (
                                                    <Grid item xs={12} key={index}>
                                                        <Paper
                                                            variant="outlined"
                                                            sx={{
                                                                p: 2,
                                                                bgcolor: index === 0 ? `${theme.palette.primary.main}10` : undefined,
                                                                border: index === 0 ? `1px solid ${theme.palette.primary.main}` : undefined,
                                                            }}
                                                        >
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Typography variant="subtitle1" fontWeight={500}>
                                                                    {tech}
                                                                </Typography>
                                                                {details.confidence && (
                                                                    <Chip
                                                                        label={`${details.confidence}% confidence`}
                                                                        size="small"
                                                                        variant="outlined"
                                                                    />
                                                                )}
                                                            </Box>
                                                            {details.note && (
                                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                                    {details.note}
                                                                </Typography>
                                                            )}
                                                        </Paper>
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                    ) : (
                                        <Box sx={{ p: 2, textAlign: 'center' }}>
                                            <Typography variant="body2" color="text.secondary">
                                                No backend technologies detected.
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Backend API Endpoints */}
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardHeader
                                    title="API & Networking"
                                    titleTypographyProps={{ variant: 'h6' }}
                                    avatar={<DnsIcon />}
                                />
                                <Divider />
                                <CardContent>
                                    <Typography variant="body2" paragraph>
                                        This section shows detected API endpoints and networking configurations.
                                        Advanced API analysis would show URLs, authentication methods, and connection patterns.
                                    </Typography>

                                    <Box sx={{ textAlign: 'center', p: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Advanced API analysis is available in the full report.
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Analytics & Ads Tab */}
                <TabPanel value={tabValue} index={3}>
                    <Grid container spacing={3}>
                        {/* Analytics Services */}
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardHeader
                                    title="Analytics Services"
                                    titleTypographyProps={{ variant: 'h6' }}
                                    avatar={<AnalyticsIcon />}
                                />
                                <Divider />
                                <CardContent>
                                    {technology.analytics_services.detected.length > 0 ? (
                                        <Grid container spacing={2}>
                                            {technology.analytics_services.detected.map((service, index) => {
                                                const details = technology.analytics_services.details[service] || {};
                                                return (
                                                    <Grid item xs={12} key={index}>
                                                        <Paper variant="outlined" sx={{ p: 2 }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Typography variant="subtitle1">
                                                                    {service}
                                                                </Typography>
                                                                {details.confidence && (
                                                                    <Chip
                                                                        label={`${details.confidence}% confidence`}
                                                                        size="small"
                                                                        variant="outlined"
                                                                    />
                                                                )}
                                                            </Box>
                                                        </Paper>
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                    ) : (
                                        <Box sx={{ p: 2, textAlign: 'center' }}>
                                            <Typography variant="body2" color="text.secondary">
                                                No analytics services detected.
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Ad Networks */}
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardHeader
                                    title="Ad Networks"
                                    titleTypographyProps={{ variant: 'h6' }}
                                    avatar={<MonetizationOnIcon />}
                                />
                                <Divider />
                                <CardContent>
                                    {technology.ad_networks.detected.length > 0 ? (
                                        <Grid container spacing={2}>
                                            {technology.ad_networks.detected.map((network, index) => {
                                                const details = technology.ad_networks.details[network] || {};
                                                return (
                                                    <Grid item xs={12} key={index}>
                                                        <Paper variant="outlined" sx={{ p: 2 }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Typography variant="subtitle1">
                                                                    {network}
                                                                </Typography>
                                                                {details.confidence && (
                                                                    <Chip
                                                                        label={`${details.confidence}% confidence`}
                                                                        size="small"
                                                                        variant="outlined"
                                                                    />
                                                                )}
                                                            </Box>
                                                        </Paper>
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                    ) : (
                                        <Box sx={{ p: 2, textAlign: 'center' }}>
                                            <Typography variant="body2" color="text.secondary">
                                                No ad networks detected.
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Privacy Impact */}
                        <Grid item xs={12}>
                            <Card>
                                <CardHeader
                                    title="Privacy Impact Assessment"
                                    titleTypographyProps={{ variant: 'h6' }}
                                />
                                <Divider />
                                <CardContent>
                                    <Typography variant="body2" paragraph>
                                        This section evaluates the privacy impact of detected analytics, ads, and tracking technologies.
                                        Advanced privacy analysis would show data collection patterns and privacy policy compliance.
                                    </Typography>

                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Data Collection Summary
                                        </Typography>
                                        <Paper variant="outlined" sx={{ p: 2 }}>
                                            <Grid container spacing={2}>
                                                <Grid item xs={4}>
                                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                                        Analytics Services
                                                    </Typography>
                                                    <Typography variant="h6">
                                                        {technology.analytics_services.detected.length}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                                        Ad Networks
                                                    </Typography>
                                                    <Typography variant="h6">
                                                        {technology.ad_networks.detected.length}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                                        Privacy Impact
                                                    </Typography>
                                                    <Chip
                                                        label={
                                                            technology.analytics_services.detected.length +
                                                            technology.ad_networks.detected.length > 3 ? "High" :
                                                                technology.analytics_services.detected.length +
                                                                technology.ad_networks.detected.length > 0 ? "Medium" : "Low"
                                                        }
                                                        color={
                                                            technology.analytics_services.detected.length +
                                                            technology.ad_networks.detected.length > 3 ? "error" :
                                                                technology.analytics_services.detected.length +
                                                                technology.ad_networks.detected.length > 0 ? "warning" : "success"
                                                        }
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </TabPanel>
            </Paper>
        </Box>
    );
};

export default TechnologyPanel;.detected.length > 0 ? (
    <Grid container spacing={2}>
        {technology.backend_technologies