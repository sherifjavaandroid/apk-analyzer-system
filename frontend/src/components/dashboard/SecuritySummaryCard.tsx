// frontend/src/components/dashboard/SecuritySummaryCard.tsx
import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardHeader,
    CardContent,
    Divider,
    LinearProgress,
    Grid,
    Chip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Button,
    IconButton,
    useTheme
} from '@mui/material';
import {
    Security as SecurityIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    CheckCircle as CheckCircleIcon,
    Shield as ShieldIcon,
    Visibility as VisibilityIcon
} from '@mui/icons-material';

interface SecurityIssue {
    id: string;
    title: string;
    severity: string;
    assetType: string;
    detectedIn: string;
}

interface SecuritySummaryCardProps {
    riskScore: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    recentIssues: SecurityIssue[];
    onViewAllClick?: () => void;
}

const SecuritySummaryCard: React.FC<SecuritySummaryCardProps> = ({
                                                                     riskScore,
                                                                     criticalCount,
                                                                     highCount,
                                                                     mediumCount,
                                                                     lowCount,
                                                                     recentIssues,
                                                                     onViewAllClick
                                                                 }) => {
    const theme = useTheme();

    // Get risk level color
    const getRiskLevelColor = (score: number): string => {
        if (score >= 80) return theme.palette.severity.critical;
        if (score >= 60) return theme.palette.severity.high;
        if (score >= 40) return theme.palette.severity.medium;
        if (score >= 20) return theme.palette.severity.low;
        return theme.palette.severity.info;
    };

    // Get risk level label
    const getRiskLevelLabel = (score: number): string => {
        if (score >= 80) return 'Critical';
        if (score >= 60) return 'High';
        if (score >= 40) return 'Medium';
        if (score >= 20) return 'Low';
        return 'Very Low';
    };

    // Get severity icon
    const getSeverityIcon = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical':
                return <ErrorIcon fontSize="small" sx={{ color: theme.palette.severity.critical }} />;
            case 'high':
                return <ErrorIcon fontSize="small" sx={{ color: theme.palette.severity.high }} />;
            case 'medium':
                return <WarningIcon fontSize="small" sx={{ color: theme.palette.severity.medium }} />;
            case 'low':
                return <InfoIcon fontSize="small" sx={{ color: theme.palette.severity.low }} />;
            default:
                return <InfoIcon fontSize="small" sx={{ color: theme.palette.severity.info }} />;
        }
    };

    // Get severity color
    const getSeverityColor = (severity: string): string => {
        switch (severity.toLowerCase()) {
            case 'critical':
                return theme.palette.severity.critical;
            case 'high':
                return theme.palette.severity.high;
            case 'medium':
                return theme.palette.severity.medium;
            case 'low':
                return theme.palette.severity.low;
            default:
                return theme.palette.severity.info;
        }
    };

    const riskColor = getRiskLevelColor(riskScore);
    const riskLabel = getRiskLevelLabel(riskScore);

    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
                title="Security Summary"
                titleTypographyProps={{ variant: 'h6' }}
                avatar={<SecurityIcon />}
            />
            <Divider />
            <CardContent sx={{ flexGrow: 1 }}>
                <Grid container spacing={2}>
                    {/* Risk Score */}
                    <Grid item xs={12}>
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                                    Overall Risk Score
                                </Typography>
                                <Chip
                                    label={riskLabel}
                                    size="small"
                                    sx={{
                                        backgroundColor: `${riskColor}20`,
                                        color: riskColor,
                                        fontWeight: 500
                                    }}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ flexGrow: 1, mr: 1 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={riskScore}
                                        sx={{
                                            height: 8,
                                            borderRadius: 4,
                                            backgroundColor: `${riskColor}20`,
                                            '& .MuiLinearProgress-bar': {
                                                backgroundColor: riskColor,
                                                borderRadius: 4
                                            }
                                        }}
                                    />
                                </Box>
                                <Typography variant="h6" fontWeight="bold">
                                    {riskScore}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>

                    {/* Issue Counts */}
                    <Grid item xs={6} sm={3}>
                        <Box sx={{
                            backgroundColor: `${theme.palette.severity.critical}10`,
                            p: 1,
                            borderRadius: 1,
                            textAlign: 'center'
                        }}>
                            <Typography variant="h5" sx={{ color: theme.palette.severity.critical }}>
                                {criticalCount}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Critical
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Box sx={{
                            backgroundColor: `${theme.palette.severity.high}10`,
                            p: 1,
                            borderRadius: 1,
                            textAlign: 'center'
                        }}>
                            <Typography variant="h5" sx={{ color: theme.palette.severity.high }}>
                                {highCount}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                High
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Box sx={{
                            backgroundColor: `${theme.palette.severity.medium}10`,
                            p: 1,
                            borderRadius: 1,
                            textAlign: 'center'
                        }}>
                            <Typography variant="h5" sx={{ color: theme.palette.severity.medium }}>
                                {mediumCount}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Medium
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Box sx={{
                            backgroundColor: `${theme.palette.severity.low}10`,
                            p: 1,
                            borderRadius: 1,
                            textAlign: 'center'
                        }}>
                            <Typography variant="h5" sx={{ color: theme.palette.severity.low }}>
                                {lowCount}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Low
                            </Typography>
                        </Box>
                    </Grid>

                    {/* Recent Issues */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                            Recent Security Issues
                        </Typography>
                        {recentIssues.length === 0 ? (
                            <Box sx={{
                                p: 2,
                                textAlign: 'center',
                                backgroundColor: theme.palette.background.default,
                                borderRadius: 1
                            }}>
                                <ShieldIcon
                                    sx={{
                                        fontSize: 32,
                                        color: theme.palette.success.main,
                                        mb: 1
                                    }}
                                />
                                <Typography variant="body2" color="text.secondary">
                                    No security issues found.
                                </Typography>
                            </Box>
                        ) : (
                            <List disablePadding>
                                {recentIssues.map((issue, index) => (
                                    <ListItem key={issue.id} disablePadding sx={{ py: 1 }}>
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            {getSeverityIcon(issue.severity)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2" fontWeight={500}>
                                                    {issue.title}
                                                </Typography>
                                            }
                                            secondary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                    <Chip
                                                        label={issue.severity}
                                                        size="small"
                                                        sx={{
                                                            height: 20,
                                                            '& .MuiChip-label': { px: 1, fontSize: '0.7rem' },
                                                            backgroundColor: `${getSeverityColor(issue.severity)}20`,
                                                            color: getSeverityColor(issue.severity)
                                                        }}
                                                    />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {issue.detectedIn}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Grid>
                </Grid>
            </CardContent>
            <Divider />
            <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    startIcon={<VisibilityIcon />}
                    size="small"
                    onClick={onViewAllClick}
                >
                    View All Issues
                </Button>
            </Box>
        </Card>
    );
};

export default SecuritySummaryCard;