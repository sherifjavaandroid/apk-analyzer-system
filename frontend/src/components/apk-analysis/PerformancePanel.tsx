// frontend/src/components/apk-analysis/PerformancePanel.tsx
import React from 'react';
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
    LinearProgress,
    useTheme
} from '@mui/material';
import {
    Speed as SpeedIcon,
    Memory as MemoryIcon,
    Battery60 as BatteryIcon,
    Storage as StorageIcon,
    Smartphone as SmartphoneIcon,
    TimerOutlined as TimerIcon,
    ErrorOutline as ErrorOutlineIcon,
    WarningAmber as WarningIcon,
    ArrowDownward as ArrowDownwardIcon,
    CheckCircleOutline as CheckCircleIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// Types
interface PerformanceAnalysisResult {
    apk_size: {
        total_size_bytes: number;
        total_size_formatted: string;
        estimated_download_time: Record<string, string>;
        components: Array<{
            name: string;
            size_bytes: number;
            size_formatted: string;
            percentage: number;
        }>;
    };
    startup_estimate: {
        score: number;
        factors: Array<{
            name: string;
            impact: string;
            description: string;
        }>;
        recommendations: string[];
    };
    resource_usage: {
        resources_count: {
            layouts: number;
            drawables: number;
            animations: number;
        };
        oversize_resources: Array<{
            path: string;
            size_bytes: number;
            size_formatted: string;
        }>;
        duplicate_resources: string[];
        unused_resources_estimate: any;
    };
    memory_usage: {
        score: number;
        factors: any[];
    };
    battery_impact: {
        score: number;
        factors: any[];
    };
    ui_performance: {
        score: number;
        factors: any[];
    };
}

interface PerformancePanelProps {
    performance?: PerformanceAnalysisResult;
}

const PerformancePanel: React.FC<PerformancePanelProps> = ({ performance }) => {
    const theme = useTheme();

    if (!performance) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                    Performance analysis results not available.
                </Typography>
            </Box>
        );
    }

    // Get score color based on value (lower is better)
    const getScoreColor = (score: number) => {
        if (score <= 25) return theme.palette.success.main;
        if (score <= 50) return theme.palette.info.main;
        if (score <= 75) return theme.palette.warning.main;
        return theme.palette.error.main;
    };

    // Get impact icon based on severity
    const getImpactIcon = (impact: string) => {
        switch (impact.toLowerCase()) {
            case 'high':
                return <ErrorOutlineIcon color="error" />;
            case 'medium':
                return <WarningIcon color="warning" />;
            case 'low':
                return <WarningIcon color="info" />;
            default:
                return <CheckCircleIcon color="success" />;
        }
    };

    return (
        <Box>
            {/* Performance Overview */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3}>
                    {/* Startup Performance */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                            <TimerIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                            <Typography variant="h6" gutterBottom>
                                Startup
                            </Typography>
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                <Box
                                    sx={{
                                        position: 'relative',
                                        display: 'inline-flex',
                                        borderRadius: '50%',
                                        border: `4px solid ${getScoreColor(performance.startup_estimate.score)}40`
                                    }}
                                >
                                    <Typography
                                        variant="h4"
                                        component="div"
                                        color={getScoreColor(performance.startup_estimate.score)}
                                        sx={{
                                            width: 80,
                                            height: 80,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {performance.startup_estimate.score}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Grid>

                    {/* Memory Impact */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                            <MemoryIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                            <Typography variant="h6" gutterBottom>
                                Memory
                            </Typography>
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                <Box
                                    sx={{
                                        position: 'relative',
                                        display: 'inline-flex',
                                        borderRadius: '50%',
                                        border: `4px solid ${getScoreColor(performance.memory_usage.score)}40`
                                    }}
                                >
                                    <Typography
                                        variant="h4"
                                        component="div"
                                        color={getScoreColor(performance.memory_usage.score)}
                                        sx={{
                                            width: 80,
                                            height: 80,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {performance.memory_usage.score}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Grid>

                    {/* Battery Impact */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                            <BatteryIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                            <Typography variant="h6" gutterBottom>
                                Battery
                            </Typography>
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                <Box
                                    sx={{
                                        position: 'relative',
                                        display: 'inline-flex',
                                        borderRadius: '50%',
                                        border: `4px solid ${getScoreColor(performance.battery_impact.score)}40`
                                    }}
                                >
                                    <Typography
                                        variant="h4"
                                        component="div"
                                        color={getScoreColor(performance.battery_impact.score)}
                                        sx={{
                                            width: 80,
                                            height: 80,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {performance.battery_impact.score}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Grid>

                    {/* UI Performance */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                            <SmartphoneIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                            <Typography variant="h6" gutterBottom>
                                UI
                            </Typography>
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                <Box
                                    sx={{
                                        position: 'relative',
                                        display: 'inline-flex',
                                        borderRadius: '50%',
                                        border: `4px solid ${getScoreColor(performance.ui_performance.score)}40`
                                    }}
                                >
                                    <Typography
                                        variant="h4"
                                        component="div"
                                        color={getScoreColor(performance.ui_performance.score)}
                                        sx={{
                                            width: 80,
                                            height: 80,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {performance.ui_performance.score}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Detailed Analysis */}
            <Grid container spacing={3}>
                {/* APK Size Analysis */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader
                            title="APK Size Breakdown"
                            titleTypographyProps={{ variant: 'h6' }}
                            avatar={<StorageIcon />}
                            subheader={`Total Size: ${performance.apk_size.total_size_formatted}`}
                        />
                        <Divider />
                        <CardContent>
                            <Box sx={{ height: 240 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={performance.apk_size.components}
                                            dataKey="size_bytes"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            innerRadius={40}
                                            paddingAngle={1}
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                            labelLine={false}
                                        >
                                            {performance.apk_size.components.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={theme.palette.primary.main}
                                                    opacity={0.5 + (index * 0.1)}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value, name, props) => [props.payload.size_formatted, name]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>

                            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                Estimated Download Time
                            </Typography>
                            <Grid container spacing={1}>
                                {Object.entries(performance.apk_size.estimated_download_time).map(([connectionType, time]) => (
                                    <Grid item xs={6} key={connectionType}>
                                        <Paper
                                            variant="outlined"
                                            sx={{ p: 1, display: 'flex', justifyContent: 'space-between' }}
                                        >
                                            <Typography variant="body2">{connectionType}:</Typography>
                                            <Typography variant="body2" fontWeight={500}>{time}</Typography>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Startup Analysis */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader
                            title="Startup Performance"
                            titleTypographyProps={{ variant: 'h6' }}
                            avatar={<TimerIcon />}
                            subheader={`Score: ${performance.startup_estimate.score}/100`}
                        />
                        <Divider />
                        <CardContent>
                            <Typography variant="subtitle2" gutterBottom>
                                Impact Factors
                            </Typography>

                            <List disablePadding>
                                {performance.startup_estimate.factors.map((factor, index) => (
                                    <ListItem key={index} sx={{ px: 0, py: 1 }}>
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            {getImpactIcon(factor.impact)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={factor.name}
                                            secondary={factor.description}
                                            primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                                            secondaryTypographyProps={{ variant: 'body2' }}
                                        />
                                        <Chip
                                            label={factor.impact}
                                            size="small"
                                            sx={{
                                                textTransform: 'capitalize',
                                                backgroundColor: factor.impact.toLowerCase() === 'high' ?
                                                    `${theme.palette.error.main}20` :
                                                    factor.impact.toLowerCase() === 'medium' ?
                                                        `${theme.palette.warning.main}20` :
                                                        `${theme.palette.info.main}20`,
                                                color: factor.impact.toLowerCase() === 'high' ?
                                                    theme.palette.error.main :
                                                    factor.impact.toLowerCase() === 'medium' ?
                                                        theme.palette.warning.main :
                                                        theme.palette.info.main
                                            }}
                                        />
                                    </ListItem>
                                ))}

                                {performance.startup_estimate.factors.length === 0 && (
                                    <ListItem>
                                        <ListItemIcon>
                                            <CheckCircleIcon color="success" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="No significant startup issues detected"
                                            primaryTypographyProps={{ variant: 'body2' }}
                                        />
                                    </ListItem>
                                )}
                            </List>

                            {performance.startup_estimate.recommendations.length > 0 && (
                                <>
                                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                        Recommendations
                                    </Typography>
                                    <List disablePadding dense>
                                        {performance.startup_estimate.recommendations.map((recommendation, index) => (
                                            <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                                                <ListItemIcon sx={{ minWidth: 24 }}>
                                                    <ArrowDownwardIcon fontSize="small" color="primary" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={recommendation}
                                                    primaryTypographyProps={{ variant: 'body2' }}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Resource Usage */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader
                            title="Resource Usage"
                            titleTypographyProps={{ variant: 'h6' }}
                            avatar={<StorageIcon />}
                        />
                        <Divider />
                        <CardContent>
                            {/* Resource Counts */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Resource Counts
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={4}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h5" color="primary">
                                                {performance.resource_usage.resources_count.layouts}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Layouts
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h5" color="secondary">
                                                {performance.resource_usage.resources_count.drawables}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Drawables
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h5" color="info.main">
                                                {performance.resource_usage.resources_count.animations}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Animations
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Oversize Resources */}
                            {performance.resource_usage.oversize_resources.length > 0 && (
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Oversize Resources
                                    </Typography>
                                    <List disablePadding dense>
                                        {performance.resource_usage.oversize_resources.slice(0, 5).map((resource, index) => (
                                            <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                                                <ListItemIcon sx={{ minWidth: 36 }}>
                                                    <WarningIcon fontSize="small" color="warning" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                                            {resource.path.split('/').pop()}
                                                        </Typography>
                                                    }
                                                    secondary={resource.size_formatted}
                                                    primaryTypographyProps={{ variant: 'body2' }}
                                                    secondaryTypographyProps={{ variant: 'caption' }}
                                                />
                                            </ListItem>
                                        ))}

                                        {performance.resource_usage.oversize_resources.length > 5 && (
                                            <ListItem sx={{ px: 0, py: 0.5 }}>
                                                <ListItemText
                                                    primary={`${performance.resource_usage.oversize_resources.length - 5} more oversize resources...`}
                                                    primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                                                />
                                            </ListItem>
                                        )}
                                    </List>
                                </Box>
                            )}

                            {/* Unused Resources Estimate */}
                            {performance.resource_usage.unused_resources_estimate && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Unused Resources
                                    </Typography>
                                    <Paper variant="outlined" sx={{ p: 1.5 }}>
                                        <Typography variant="body2">
                                            {performance.resource_usage.unused_resources_estimate.message}
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                            <strong>Recommendation:</strong> {performance.resource_usage.unused_resources_estimate.recommendation}
                                        </Typography>
                                    </Paper>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Battery & UI Impact */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader
                            title="Battery & UI Impact"
                            titleTypographyProps={{ variant: 'h6' }}
                            avatar={<BatteryIcon />}
                        />
                        <Divider />
                        <CardContent>
                            {/* Battery Impact Factors */}
                            {performance.battery_impact.factors.length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Battery Impact Factors
                                    </Typography>
                                    <List disablePadding>
                                        {performance.battery_impact.factors.map((factor, index) => (
                                            <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                                                <ListItemIcon sx={{ minWidth: 36 }}>
                                                    {getImpactIcon(factor.impact)}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={factor.name}
                                                    secondary={factor.description}
                                                    primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                                                    secondaryTypographyProps={{ variant: 'body2' }}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            )}

                            {/* UI Performance Factors */}
                            {performance.ui_performance.factors.length > 0 && (
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        UI Performance Factors
                                    </Typography>
                                    <List disablePadding>
                                        {performance.ui_performance.factors.map((factor, index) => (
                                            <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                                                <ListItemIcon sx={{ minWidth: 36 }}>
                                                    {getImpactIcon(factor.impact)}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={factor.name}
                                                    secondary={factor.description}
                                                    primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                                                    secondaryTypographyProps={{ variant: 'body2' }}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            )}

                            {/* No issues message */}
                            {performance.battery_impact.factors.length === 0 && performance.ui_performance.factors.length === 0 && (
                                <Box sx={{ p: 2, textAlign: 'center' }}>
                                    <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                                    <Typography variant="body1">
                                        No significant battery or UI performance issues detected.
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PerformancePanel;