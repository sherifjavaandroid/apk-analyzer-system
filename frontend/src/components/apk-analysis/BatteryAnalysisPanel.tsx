// frontend/src/components/apk-analysis/BatteryAnalysisPanel.tsx
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
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Tabs,
    Tab,
    Alert,
    Button,
    useTheme
} from '@mui/material';
import {
    BatteryChargingFull as BatteryIcon,
    Speed as SpeedIcon,
    Memory as MemoryIcon,
    LocationOn as LocationIcon,
    Wifi as WifiIcon,
    BluetoothSearching as BluetoothIcon,
    Sensors as SensorsIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Info as InfoIcon,
    Timeline as TimelineIcon,
    BarChart as BarChartIcon
} from '@mui/icons-material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';

// Types
interface BatteryUsageItem {
    component: string;
    impact: number;
    description: string;
    recommendation?: string;
}

interface BatteryTestScenario {
    name: string;
    duration_minutes: number;
    battery_drain_percent: number;
    estimated_hours: number;
    details: string;
}

interface BatteryAnalysisResult {
    overall_score: number;
    efficiency_rating: 'excellent' | 'good' | 'average' | 'poor' | 'very_poor';
    high_drain_components: BatteryUsageItem[];
    background_activity: {
        has_excessive_background: boolean;
        wakelock_count: number;
        background_services: string[];
        impact_score: number;
    };
    network_usage: {
        excessive_network: boolean;
        data_transfer_estimate_mb_per_hour: number;
        polling_detected: boolean;
        impact_score: number;
    };
    location_usage: {
        continuous_tracking: boolean;
        high_accuracy_usage: boolean;
        location_request_frequency: 'none' | 'low' | 'medium' | 'high';
        impact_score: number;
    };
    test_scenarios?: BatteryTestScenario[];
    battery_usage_comparison?: {
        app_name: string;
        usage_percent: number;
    }[];
    recommendations: string[];
}

interface BatteryAnalysisPanelProps {
    batteryAnalysis?: BatteryAnalysisResult;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

// Tab Panel Component
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...props }) => {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`battery-tabpanel-${index}`}
            aria-labelledby={`battery-tab-${index}`}
            {...props}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
};

const BatteryAnalysisPanel: React.FC<BatteryAnalysisPanelProps> = ({ batteryAnalysis }) => {
    const theme = useTheme();
    const [tabValue, setTabValue] = useState(0);

    if (!batteryAnalysis) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                    Battery analysis results not available.
                </Typography>
            </Box>
        );
    }

    // Handle tab change
    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // Get color based on efficiency rating
    const getEfficiencyColor = (rating: string): string => {
        switch (rating) {
            case 'excellent':
                return theme.palette.success.main;
            case 'good':
                return theme.palette.success.light;
            case 'average':
                return theme.palette.warning.main;
            case 'poor':
                return theme.palette.warning.dark;
            case 'very_poor':
                return theme.palette.error.main;
            default:
                return theme.palette.info.main;
        }
    };

    // Get color based on impact score
    const getImpactColor = (score: number): string => {
        if (score >= 80) return theme.palette.error.main;
        if (score >= 60) return theme.palette.warning.dark;
        if (score >= 40) return theme.palette.warning.main;
        if (score >= 20) return theme.palette.info.main;
        return theme.palette.success.main;
    };

    // Get icon for component
    const getComponentIcon = (component: string) => {
        switch (component.toLowerCase()) {
            case 'location':
            case 'gps':
                return <LocationIcon color="warning" />;
            case 'network':
            case 'wifi':
            case 'data':
                return <WifiIcon color="info" />;
            case 'bluetooth':
                return <BluetoothIcon color="primary" />;
            case 'sensors':
                return <SensorsIcon color="success" />;
            case 'cpu':
            case 'processor':
                return <SpeedIcon color="error" />;
            case 'memory':
            case 'ram':
                return <MemoryIcon color="secondary" />;
            default:
                return <BatteryIcon color="primary" />;
        }
    };

    // Format time in hours
    const formatHours = (hours: number): string => {
        const wholeHours = Math.floor(hours);
        const minutes = Math.round((hours - wholeHours) * 60);
        return `${wholeHours}h ${minutes}m`;
    };

    // Prepare comparison data for chart
    const comparisonData = batteryAnalysis.battery_usage_comparison || [];

    // Prepare battery drain data for chart from test scenarios
    const batteryDrainData = (batteryAnalysis.test_scenarios || []).map(scenario => ({
        name: scenario.name,
        drainRate: scenario.battery_drain_percent / scenario.duration_minutes * 60, // Drain percent per hour
        estimatedHours: scenario.estimated_hours
    }));

    return (
        <Box>
            {/* Battery Efficiency Overview */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom>
                            Battery Efficiency Score
                        </Typography>
                        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                            <CircularProgressWithLabel
                                value={batteryAnalysis.overall_score}
                                color={getEfficiencyColor(batteryAnalysis.efficiency_rating)}
                                size={120}
                                thickness={8}
                            />
                        </Box>
                        <Chip
                            label={batteryAnalysis.efficiency_rating.toUpperCase().replace('_', ' ')}
                            sx={{
                                mt: 1,
                                backgroundColor: `${getEfficiencyColor(batteryAnalysis.efficiency_rating)}20`,
                                color: getEfficiencyColor(batteryAnalysis.efficiency_rating),
                                fontWeight: 500
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <Typography variant="subtitle1" gutterBottom>
                            Key Battery Impact Factors
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        borderColor: getImpactColor(batteryAnalysis.background_activity.impact_score)
                                    }}
                                >
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Background Activity
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="h5" sx={{ color: getImpactColor(batteryAnalysis.background_activity.impact_score) }}>
                                            {batteryAnalysis.background_activity.impact_score}
                                        </Typography>
                                        {batteryAnalysis.background_activity.has_excessive_background ? (
                                            <WarningIcon color="warning" />
                                        ) : (
                                            <CheckCircleIcon color="success" />
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        borderColor: getImpactColor(batteryAnalysis.network_usage.impact_score)
                                    }}
                                >
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Network Usage
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="h5" sx={{ color: getImpactColor(batteryAnalysis.network_usage.impact_score) }}>
                                            {batteryAnalysis.network_usage.impact_score}
                                        </Typography>
                                        {batteryAnalysis.network_usage.excessive_network ? (
                                            <WarningIcon color="warning" />
                                        ) : (
                                            <CheckCircleIcon color="success" />
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        borderColor: getImpactColor(batteryAnalysis.location_usage.impact_score)
                                    }}
                                >
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Location Usage
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="h5" sx={{ color: getImpactColor(batteryAnalysis.location_usage.impact_score) }}>
                                            {batteryAnalysis.location_usage.impact_score}
                                        </Typography>
                                        {batteryAnalysis.location_usage.continuous_tracking ? (
                                            <WarningIcon color="warning" />
                                        ) : (
                                            <CheckCircleIcon color="success" />
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>

                        {/* Summary Alert */}
                        <Alert
                            severity={batteryAnalysis.overall_score > 70 ? "success" :
                                batteryAnalysis.overall_score > 40 ? "warning" : "error"}
                            sx={{ mt: 2 }}
                        >
                            {batteryAnalysis.overall_score > 70 ?
                                "This application has good battery efficiency with minimal impact on device battery life." :
                                batteryAnalysis.overall_score > 40 ?
                                    "This application has moderate battery usage which may impact device battery life during extended use." :
                                    "This application has high battery consumption that will significantly impact device battery life."}
                        </Alert>
                    </Grid>
                </Grid>
            </Paper>

            {/* Tabs for detailed analysis */}
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="High Drain Components" icon={<BatteryIcon />} iconPosition="start" />
                    <Tab label="Background Activity" icon={<MemoryIcon />} iconPosition="start" />
                    <Tab label="Test Scenarios" icon={<TimelineIcon />} iconPosition="start" />
                    <Tab label="Comparative Analysis" icon={<BarChartIcon />} iconPosition="start" />
                </Tabs>

                {/* High Drain Components Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Card>
                                <CardHeader
                                    title="High Battery Drain Components"
                                    titleTypographyProps={{ variant: 'h6' }}
                                    subheader="Components with significant battery impact"
                                />
                                <Divider />
                                <CardContent>
                                    {batteryAnalysis.high_drain_components.length > 0 ? (
                                        <List>
                                            {batteryAnalysis.high_drain_components.map((item, index) => (
                                                <React.Fragment key={index}>
                                                    {index > 0 && <Divider variant="inset" component="li" />}
                                                    <ListItem alignItems="flex-start">
                                                        <ListItemIcon>
                                                            {getComponentIcon(item.component)}
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={
                                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                    <Typography variant="subtitle1">
                                                                        {item.component}
                                                                    </Typography>
                                                                    <Box sx={{ flexGrow: 1 }} />
                                                                    <Chip
                                                                        label={`Impact: ${item.impact}`}
                                                                        size="small"
                                                                        sx={{
                                                                            backgroundColor: `${getImpactColor(item.impact)}20`,
                                                                            color: getImpactColor(item.impact),
                                                                        }}
                                                                    />
                                                                </Box>
                                                            }
                                                            secondary={
                                                                <>
                                                                    <Typography variant="body2" component="span">
                                                                        {item.description}
                                                                    </Typography>
                                                                    {item.recommendation && (
                                                                        <Typography
                                                                            variant="body2"
                                                                            sx={{ mt: 1, fontStyle: 'italic', color: theme.palette.primary.main }}
                                                                        >
                                                                            Recommendation: {item.recommendation}
                                                                        </Typography>
                                                                    )}
                                                                </>
                                                            }
                                                        />
                                                    </ListItem>
                                                </React.Fragment>
                                            ))}
                                        </List>
                                    ) : (
                                        <Box sx={{ p: 2, textAlign: 'center' }}>
                                            <CheckCircleIcon sx={{ fontSize: 48, color: theme.palette.success.main, mb: 2 }} />
                                            <Typography variant="body1" gutterBottom>
                                                No high drain components detected
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                This application appears to be optimized for battery usage.
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Background Activity Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardHeader
                                    title="Background Activity"
                                    titleTypographyProps={{ variant: 'h6' }}
                                    subheader="Analysis of app behavior when not in foreground"
                                />
                                <Divider />
                                <CardContent>
                                    <List>
                                        <ListItem>
                                            <ListItemIcon>
                                                {batteryAnalysis.background_activity.has_excessive_background ?
                                                    <WarningIcon color="warning" /> :
                                                    <CheckCircleIcon color="success" />}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary="Excessive Background Activity"
                                                secondary={batteryAnalysis.background_activity.has_excessive_background ?
                                                    "The app performs excessive operations in the background which impacts battery life" :
                                                    "The app has appropriate background activity levels"}
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon>
                                                {batteryAnalysis.background_activity.wakelock_count > 2 ?
                                                    <WarningIcon color="warning" /> :
                                                    <InfoIcon color="info" />}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={`Wake Locks: ${batteryAnalysis.background_activity.wakelock_count}`}
                                                secondary="Wake locks prevent the device from entering sleep mode"
                                            />
                                        </ListItem>
                                    </List>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardHeader
                                    title="Background Services"
                                    titleTypographyProps={{ variant: 'h6' }}
                                    subheader="Services running in the background"
                                />
                                <Divider />
                                <CardContent>
                                    {batteryAnalysis.background_activity.background_services.length > 0 ? (
                                        <List dense>
                                            {batteryAnalysis.background_activity.background_services.map((service, index) => (
                                                <ListItem key={index}>
                                                    <ListItemIcon>
                                                        <MemoryIcon />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={service}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    ) : (
                                        <Box sx={{ p: 2, textAlign: 'center' }}>
                                            <Typography variant="body2" color="text.secondary">
                                                No background services detected
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12}>
                            <Card>
                                <CardHeader
                                    title="Network & Location Usage"
                                    titleTypographyProps={{ variant: 'h6' }}
                                    subheader="Analysis of network and location services impact"
                                />
                                <Divider />
                                <CardContent>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Network Usage
                                            </Typography>
                                            <List dense>
                                                <ListItem>
                                                    <ListItemIcon>
                                                        <WifiIcon color="primary" />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary="Data Transfer Estimate"
                                                        secondary={`${batteryAnalysis.network_usage.data_transfer_estimate_mb_per_hour} MB per hour`}
                                                    />
                                                </ListItem>
                                                <ListItem>
                                                    <ListItemIcon>
                                                        {batteryAnalysis.network_usage.polling_detected ?
                                                            <WarningIcon color="warning" /> :
                                                            <CheckCircleIcon color="success" />}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary="Polling Behavior"
                                                        secondary={batteryAnalysis.network_usage.polling_detected ?
                                                            "Frequent polling detected which may drain battery" :
                                                            "No excessive polling detected"}
                                                    />
                                                </ListItem>
                                            </List>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Location Usage
                                            </Typography>
                                            <List dense>
                                                <ListItem>
                                                    <ListItemIcon>
                                                        {batteryAnalysis.location_usage.continuous_tracking ?
                                                            <WarningIcon color="error" /> :
                                                            <CheckCircleIcon color="success" />}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary="Continuous Tracking"
                                                        secondary={batteryAnalysis.location_usage.continuous_tracking ?
                                                            "App continuously tracks location which significantly impacts battery" :
                                                            "No continuous location tracking detected"}
                                                    />
                                                </ListItem>
                                                <ListItem>
                                                    <ListItemIcon>
                                                        {batteryAnalysis.location_usage.high_accuracy_usage ?
                                                            <WarningIcon color="warning" /> :
                                                            <InfoIcon color="info" />}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary="Location Accuracy"
                                                        secondary={batteryAnalysis.location_usage.high_accuracy_usage ?
                                                            "High-accuracy location used which consumes more battery" :
                                                            "Standard location accuracy used"}
                                                    />
                                                </ListItem>
                                                <ListItem>
                                                    <ListItemIcon>
                                                        <LocationIcon />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary="Location Request Frequency"
                                                        secondary={batteryAnalysis.location_usage.location_request_frequency.replace('_', ' ')}
                                                    />
                                                </ListItem>
                                            </List>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Test Scenarios Tab */}
                <TabPanel value={tabValue} index={2}>
                    {batteryAnalysis.test_scenarios && batteryAnalysis.test_scenarios.length > 0 ? (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardHeader
                                        title="Battery Drain Test Scenarios"
                                        titleTypographyProps={{ variant: 'h6' }}
                                        subheader="Measured battery consumption in different scenarios"
                                    />
                                    <Divider />
                                    <CardContent>
                                        <List>
                                            {batteryAnalysis.test_scenarios.map((scenario, index) => (
                                                <React.Fragment key={index}>
                                                    {index > 0 && <Divider />}
                                                    <ListItem alignItems="flex-start">
                                                        <ListItemText
                                                            primary={
                                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                    <Typography variant="subtitle1">
                                                                        {scenario.name}
                                                                    </Typography>
                                                                    <Box sx={{ flexGrow: 1 }} />
                                                                    <Chip
                                                                        label={`${formatHours(scenario.estimated_hours)} battery life`}
                                                                        size="small"
                                                                        color={scenario.estimated_hours > 5 ? "success" :
                                                                            scenario.estimated_hours > 3 ? "primary" : "warning"}
                                                                        variant="outlined"
                                                                    />
                                                                </Box>
                                                            }
                                                            secondary={
                                                                <>
                                                                    <Typography variant="body2" component="span">
                                                                        {scenario.details}
                                                                    </Typography>
                                                                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                                                                        <Typography variant="body2" color="text.secondary">
                                                                            Test duration: {scenario.duration_minutes} minutes
                                                                        </Typography>
                                                                        <Typography variant="body2" color="text.secondary">
                                                                            Battery drain: {scenario.battery_drain_percent}%
                                                                        </Typography>
                                                                    </Box>
                                                                </>
                                                            }
                                                        />
                                                    </ListItem>
                                                </React.Fragment>
                                            ))}
                                        </List>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardHeader
                                        title="Battery Drain Comparison"
                                        titleTypographyProps={{ variant: 'h6' }}
                                        subheader="Battery drain rate per hour in different scenarios"
                                    />
                                    <Divider />
                                    <CardContent>
                                        <Box sx={{ height: 300 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                    data={batteryDrainData}
                                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="name" />
                                                    <YAxis yAxisId="left" orientation="left" label={{ value: '% Drain per Hour', angle: -90, position: 'insideLeft' }} />
                                                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Estimated Hours', angle: 90, position: 'insideRight' }} />
                                                    <RechartsTooltip />
                                                    <Legend />
                                                    <Bar yAxisId="left" dataKey="drainRate" name="Drain % per Hour" fill={theme.palette.error.main} />
                                                    <Bar yAxisId="right" dataKey="estimatedHours" name="Est. Battery Life (hours)" fill={theme.palette.primary.main} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    ) : (
                        <Paper sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body1" color="text.secondary">
                                No battery test scenarios available.
                            </Typography>
                        </Paper>
                    )}
                </TabPanel>

                {/* Comparative Analysis Tab */}
                <TabPanel value={tabValue} index={3}>
                    {comparisonData.length > 0 ? (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Card>
                                    <CardHeader
                                        title="Battery Usage Comparison"
                                        titleTypographyProps={{ variant: 'h6' }}
                                        subheader="Comparison with other similar apps"
                                    />
                                    <Divider />
                                    <CardContent>
                                        <Box sx={{ height: 400 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                    data={comparisonData}
                                                    layout="vertical"
                                                    margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis type="number" domain={[0, 'dataMax']} />
                                                    <YAxis type="category" dataKey="app_name" width={70} />
                                                    <RechartsTooltip formatter={(value) => [`${value}% battery usage`, 'Usage']} />
                                                    <Bar dataKey="usage_percent" name="Battery Usage %" fill={theme.palette.primary.main} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    ) : (
                        <Paper sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body1" color="text.secondary">
                                Comparative battery analysis data is not available.
                            </Typography>
                        </Paper>
                    )}
                </TabPanel>
            </Paper>

            {/* Recommendations */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Battery Optimization Recommendations
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {batteryAnalysis.recommendations.length > 0 ? (
                    <List>
                        {batteryAnalysis.recommendations.map((recommendation, index) => (
                            <ListItem key={index}>
                                <ListItemIcon>
                                    <InfoIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText primary={recommendation} />
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Typography variant="body1" color="text.secondary" align="center">
                        No specific recommendations available for this application.
                    </Typography>
                )}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="outlined" color="primary">
                        Generate Detailed Battery Report
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

// CircularProgressWithLabel component
interface CircularProgressWithLabelProps {
    value: number;
    size?: number;
    thickness?: number;
    color?: string;
}

const CircularProgressWithLabel: React.FC<CircularProgressWithLabelProps> = ({
                                                                                 value,
                                                                                 size = 100,
                                                                                 thickness = 4,
                                                                                 color
                                                                             }) => {
    const theme = useTheme();

    return (
        <Box position="relative" display="inline-flex">
            <Box
                sx={{
                    position: 'relative',
                    display: 'inline-flex',
                }}
            >
                <CircularProgress
                    variant="determinate"
                    value={100}
                    size={size}
                    thickness={thickness}
                    sx={{ color: theme.palette.grey[200] }}
                />
                <CircularProgress
                    variant="determinate"
                    value={value}
                    size={size}
                    thickness={thickness}
                    sx={{
                        position: 'absolute',
                        left: 0,
                        color: color,
                        top: 0
                    }}
                />
            </Box>
            <Box
                sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography
                    variant="h4"
                    component="div"
                    color={color || 'text.primary'}
                    sx={{ fontWeight: 'bold' }}
                >
                    {Math.round(value)}
                </Typography>
            </Box>
        </Box>
    );
};

export default BatteryAnalysisPanel;