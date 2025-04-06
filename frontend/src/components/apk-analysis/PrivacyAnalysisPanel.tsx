// frontend/src/components/apk-analysis/PrivacyAnalysisPanel.tsx
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
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    LinearProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Switch,
    FormControlLabel,
    Button,
    Tooltip,
    useTheme
} from '@mui/material';
import {
    Security as SecurityIcon,
    PrivacyTip as PrivacyTipIcon,
    LocationOn as LocationIcon,
    Camera as CameraIcon,
    Mic as MicIcon,
    ContactPhone as ContactsIcon,
    Storage as StorageIcon,
    AddCircle as AddCircleIcon,
    RemoveCircle as RemoveCircleIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    ExpandMore as ExpandMoreIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

// Types
interface PrivacyIssue {
    id: string;
    type: string;
    title: string;
    description: string;
    risk_level: 'high' | 'medium' | 'low';
    gdpr_relevant: boolean;
    ccpa_relevant: boolean;
    recommendation?: string;
}

interface DataCollection {
    type: string;
    collected: boolean;
    shared_with_third_parties: boolean;
    purpose?: string;
    details?: string;
}

interface PrivacyAnalysisResult {
    privacy_score: number;
    issues_count: number;
    risk_level: 'high' | 'medium' | 'low';
    data_collections: DataCollection[];
    trackers_detected: string[];
    third_party_libraries: {
        analytics: string[];
        advertising: string[];
        location: string[];
        social: string[];
    };
    privacy_issues: PrivacyIssue[];
    permissions_analysis: {
        privacy_related_permissions: string[];
        unnecessary_permissions: string[];
        dangerous_permissions: string[];
    };
}

interface PrivacyAnalysisPanelProps {
    privacyAnalysis?: PrivacyAnalysisResult;
}

const PrivacyAnalysisPanel: React.FC<PrivacyAnalysisPanelProps> = ({ privacyAnalysis }) => {
    const theme = useTheme();

    // State for showing only GDPR/CCPA relevant issues
    const [showOnlyRelevant, setShowOnlyRelevant] = useState(false);
    const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

    if (!privacyAnalysis) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                    Privacy analysis results not available.
                </Typography>
            </Box>
        );
    }

    // Color for risk level
    const getRiskLevelColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'high':
                return theme.palette.error.main;
            case 'medium':
                return theme.palette.warning.main;
            case 'low':
                return theme.palette.info.main;
            default:
                return theme.palette.text.secondary;
        }
    };

    // Icon for data type
    const getDataTypeIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'location':
                return <LocationIcon />;
            case 'camera':
                return <CameraIcon />;
            case 'microphone':
                return <MicIcon />;
            case 'contacts':
                return <ContactsIcon />;
            case 'storage':
                return <StorageIcon />;
            default:
                return <PrivacyTipIcon />;
        }
    };

    // Filter issues based on relevance toggle
    const filteredIssues = showOnlyRelevant
        ? privacyAnalysis.privacy_issues.filter(issue => issue.gdpr_relevant || issue.ccpa_relevant)
        : privacyAnalysis.privacy_issues;

    // Data for permissions pie chart
    const permissionsData = [
        {
            name: 'Privacy Related',
            value: privacyAnalysis.permissions_analysis.privacy_related_permissions.length,
            color: theme.palette.warning.main
        },
        {
            name: 'Unnecessary',
            value: privacyAnalysis.permissions_analysis.unnecessary_permissions.length,
            color: theme.palette.error.main
        },
        {
            name: 'Dangerous',
            value: privacyAnalysis.permissions_analysis.dangerous_permissions.length,
            color: theme.palette.error.dark
        }
    ];

    // Handle accordion expansion
    const handleAccordionChange = (issueId: string) => {
        setExpandedIssue(expandedIssue === issueId ? null : issueId);
    };

    return (
        <Box>
            {/* Privacy Score Overview */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom>
                            Privacy Score
                        </Typography>
                        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                            <CircularProgressWithLabel
                                value={privacyAnalysis.privacy_score}
                                color={getRiskLevelColor(privacyAnalysis.risk_level)}
                                size={120}
                                thickness={8}
                            />
                        </Box>
                        <Chip
                            label={`${privacyAnalysis.risk_level.toUpperCase()} RISK`}
                            sx={{
                                mt: 1,
                                backgroundColor: `${getRiskLevelColor(privacyAnalysis.risk_level)}20`,
                                color: getRiskLevelColor(privacyAnalysis.risk_level),
                                fontWeight: 500
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <Typography variant="subtitle1" gutterBottom>
                            Privacy Summary
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <Paper
                                    variant="outlined"
                                    sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                >
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Privacy Issues
                                    </Typography>
                                    <Typography variant="h4" color="error">
                                        {privacyAnalysis.issues_count}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Paper
                                    variant="outlined"
                                    sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                >
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Trackers
                                    </Typography>
                                    <Typography variant="h4" color="warning.main">
                                        {privacyAnalysis.trackers_detected.length}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Paper
                                    variant="outlined"
                                    sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                >
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Data Types Collected
                                    </Typography>
                                    <Typography variant="h4" color="info.main">
                                        {privacyAnalysis.data_collections.filter(d => d.collected).length}
                                    </Typography>
                                </Paper>
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                This application collects personal data and has a {privacyAnalysis.risk_level} privacy risk level.
                                {privacyAnalysis.trackers_detected.length > 0 && ` It contains ${privacyAnalysis.trackers_detected.length} known tracking libraries.`}
                                {" "}There are {privacyAnalysis.permissions_analysis.privacy_related_permissions.length} permission requests that may impact user privacy.
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Data Collection */}
            <Typography variant="h6" gutterBottom>
                Data Collection Analysis
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={7}>
                    <Card>
                        <CardHeader
                            title="Data Collection Types"
                            titleTypographyProps={{ variant: 'subtitle1' }}
                            avatar={<PrivacyTipIcon />}
                        />
                        <Divider />
                        <CardContent>
                            <List>
                                {privacyAnalysis.data_collections.map((collection, index) => (
                                    <ListItem key={index} divider={index < privacyAnalysis.data_collections.length - 1}>
                                        <ListItemIcon>
                                            {getDataTypeIcon(collection.type)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Typography variant="subtitle2">
                                                        {collection.type.charAt(0).toUpperCase() + collection.type.slice(1)}
                                                    </Typography>
                                                    <Box sx={{ flexGrow: 1 }} />
                                                    {collection.collected ? (
                                                        <Chip
                                                            icon={<AddCircleIcon fontSize="small" />}
                                                            label="Collected"
                                                            size="small"
                                                            color="warning"
                                                            sx={{ mr: 1 }}
                                                        />
                                                    ) : (
                                                        <Chip
                                                            icon={<RemoveCircleIcon fontSize="small" />}
                                                            label="Not Collected"
                                                            size="small"
                                                            color="success"
                                                            variant="outlined"
                                                            sx={{ mr: 1 }}
                                                        />
                                                    )}
                                                    {collection.shared_with_third_parties && (
                                                        <Chip
                                                            label="Shared"
                                                            size="small"
                                                            color="error"
                                                        />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <>
                                                    {collection.purpose && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            Purpose: {collection.purpose}
                                                        </Typography>
                                                    )}
                                                    {collection.details && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            {collection.details}
                                                        </Typography>
                                                    )}
                                                </>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={5}>
                    <Card>
                        <CardHeader
                            title="Third-Party Libraries"
                            titleTypographyProps={{ variant: 'subtitle1' }}
                            avatar={<CodeIcon />}
                        />
                        <Divider />
                        <CardContent>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Analytics Libraries
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {privacyAnalysis.third_party_libraries.analytics.length > 0 ? (
                                            privacyAnalysis.third_party_libraries.analytics.map((lib, idx) => (
                                                <Chip
                                                    key={idx}
                                                    label={lib}
                                                    size="small"
                                                    color="info"
                                                    variant="outlined"
                                                />
                                            ))
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                No analytics libraries detected
                                            </Typography>
                                        )}
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Advertising Libraries
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {privacyAnalysis.third_party_libraries.advertising.length > 0 ? (
                                            privacyAnalysis.third_party_libraries.advertising.map((lib, idx) => (
                                                <Chip
                                                    key={idx}
                                                    label={lib}
                                                    size="small"
                                                    color="error"
                                                    variant="outlined"
                                                />
                                            ))
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                No advertising libraries detected
                                            </Typography>
                                        )}
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Location Tracking
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {privacyAnalysis.third_party_libraries.location.length > 0 ? (
                                            privacyAnalysis.third_party_libraries.location.map((lib, idx) => (
                                                <Chip
                                                    key={idx}
                                                    label={lib}
                                                    size="small"
                                                    color="warning"
                                                    variant="outlined"
                                                />
                                            ))
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                No location tracking libraries detected
                                            </Typography>
                                        )}
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Permissions Analysis */}
            <Typography variant="h6" gutterBottom>
                Privacy Permissions Analysis
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={5}>
                    <Card>
                        <CardHeader
                            title="Permissions Distribution"
                            titleTypographyProps={{ variant: 'subtitle1' }}
                            avatar={<SecurityIcon />}
                        />
                        <Divider />
                        <CardContent>
                            <Box sx={{ height: 250 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={permissionsData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        >
                                            {permissionsData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(value) => [`${value} permissions`, 'Count']} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={7}>
                    <Card>
                        <CardHeader
                            title="Privacy-Related Permissions"
                            titleTypographyProps={{ variant: 'subtitle1' }}
                            avatar={<PrivacyTipIcon />}
                        />
                        <Divider />
                        <CardContent>
                            <Box sx={{ maxHeight: 250, overflow: 'auto' }}>
                                <List dense>
                                    {privacyAnalysis.permissions_analysis.privacy_related_permissions.map((permission, idx) => (
                                        <ListItem key={idx}>
                                            <ListItemIcon>
                                                <PrivacyTipIcon color="warning" />
                                            </ListItemIcon>
                                            <ListItemText primary={permission} />
                                        </ListItem>
                                    ))}
                                    {privacyAnalysis.permissions_analysis.dangerous_permissions.map((permission, idx) => (
                                        <ListItem key={`dangerous-${idx}`}>
                                            <ListItemIcon>
                                                <ErrorIcon color="error" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={permission}
                                                secondary="Dangerous permission"
                                            />
                                        </ListItem>
                                    ))}
                                    {privacyAnalysis.permissions_analysis.unnecessary_permissions.map((permission, idx) => (
                                        <ListItem key={`unnecessary-${idx}`}>
                                            <ListItemIcon>
                                                <WarningIcon color="warning" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={permission}
                                                secondary="Potentially unnecessary permission"
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Privacy Issues */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                    Privacy Issues
                </Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={showOnlyRelevant}
                            onChange={(e) => setShowOnlyRelevant(e.target.checked)}
                            color="primary"
                        />
                    }
                    label="Show only GDPR/CCPA relevant"
                />
            </Box>

            {filteredIssues.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                        No privacy issues found matching the current filter.
                    </Typography>
                </Paper>
            ) : (
                filteredIssues.map((issue) => (
                    <Accordion
                        key={issue.id}
                        expanded={expandedIssue === issue.id}
                        onChange={() => handleAccordionChange(issue.id)}
                        sx={{ mb: 2 }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                {issue.risk_level === 'high' ? (
                                    <ErrorIcon color="error" sx={{ mr: 2 }} />
                                ) : issue.risk_level === 'medium' ? (
                                    <WarningIcon color="warning" sx={{ mr: 2 }} />
                                ) : (
                                    <InfoIcon color="info" sx={{ mr: 2 }} />
                                )}
                                <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                                    {issue.title}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Chip
                                        label={issue.risk_level.toUpperCase()}
                                        size="small"
                                        sx={{
                                            backgroundColor: `${getRiskLevelColor(issue.risk_level)}20`,
                                            color: getRiskLevelColor(issue.risk_level),
                                        }}
                                    />
                                    {issue.gdpr_relevant && (
                                        <Chip
                                            label="GDPR"
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                    )}
                                    {issue.ccpa_relevant && (
                                        <Chip
                                            label="CCPA"
                                            size="small"
                                            color="secondary"
                                            variant="outlined"
                                        />
                                    )}
                                </Box>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="body2" paragraph>
                                        {issue.description}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Type:
                                    </Typography>
                                    <Typography variant="body2" paragraph>
                                        {issue.type}
                                    </Typography>
                                </Grid>
                                {issue.recommendation && (
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Recommendation:
                                        </Typography>
                                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                                            <Typography variant="body2">
                                                {issue.recommendation}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                )}
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            size="small"
                                        >
                                            View Detailed Privacy Report
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </AccordionDetails>
                    </Accordion>
                ))
            )}
        </Box>
    );
};

// CircularProgressWithLabel component (also define here in case the imported one is not available)
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

export default PrivacyAnalysisPanel;