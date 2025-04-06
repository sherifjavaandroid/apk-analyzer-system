// frontend/src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardHeader,
    Button,
    Divider,
    IconButton,
    Tooltip,
    useTheme,
    Paper
} from '@mui/material';
import {
    Timeline,
    Assignment,
    Security,
    Speed,
    Code,
    BugReport,
    GitHub,
    AddCircleOutline,
    Refresh
} from '@mui/icons-material';

// Charts
import {
    PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

// Redux
import { RootState, AppDispatch } from '../store';
import { getAnalyses } from '../store/slices/apkAnalysisSlice';
import { getGithubAnalyses } from '../store/slices/githubAnalysisSlice';
import { getReports } from '../store/slices/reportsSlice';

// Components
import DashboardActivityCard from '../components/dashboard/ActivityCard';
import StatsCard from '../components/dashboard/StatsCard';
import SecuritySummaryCard from '../components/dashboard/SecuritySummaryCard';
import RecentAnalysesTable from '../components/dashboard/RecentAnalysesTable';

// Constants and utils
import { CHART_COLORS } from '../config';

const Dashboard: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const theme = useTheme();

    const { analyses: apkAnalyses, loading: apkLoading } = useSelector((state: RootState) => state.apkAnalysis);
    const { analyses: githubAnalyses, loading: githubLoading } = useSelector((state: RootState) => state.githubAnalysis);
    const { reports, loading: reportsLoading } = useSelector((state: RootState) => state.reports);
    const { user } = useSelector((state: RootState) => state.auth);

    const [isRefreshing, setIsRefreshing] = useState(false);

    // Fetch data on component mount
    useEffect(() => {
        dispatch(getAnalyses());
        dispatch(getGithubAnalyses());
        dispatch(getReports());
    }, [dispatch]);

    // Combined analyses for charts and tables
    const allAnalyses = [...apkAnalyses, ...githubAnalyses].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const refreshData = () => {
        setIsRefreshing(true);
        Promise.all([
            dispatch(getAnalyses()),
            dispatch(getGithubAnalyses()),
            dispatch(getReports())
        ]).finally(() => {
            setIsRefreshing(false);
        });
    };

    // Chart data preparation
    const securityIssuesByType = [
        { name: 'Critical', value: 12, color: theme.palette.severity.critical },
        { name: 'High', value: 28, color: theme.palette.severity.high },
        { name: 'Medium', value: 45, color: theme.palette.severity.medium },
        { name: 'Low', value: 37, color: theme.palette.severity.low },
        { name: 'Info', value: 22, color: theme.palette.severity.info }
    ];

    const analysisByType = [
        { name: 'APK', value: apkAnalyses.length, color: theme.palette.primary.main },
        { name: 'GitHub', value: githubAnalyses.length, color: theme.palette.secondary.main }
    ];

    const recentActivityData = allAnalyses.slice(0, 5).map(analysis => ({
        id: analysis.id,
        type: 'analysis' in analysis ? 'APK Analysis' : 'GitHub Analysis',
        name: 'filename' in analysis
            ? (analysis as any).filename
            : 'repository_url' in analysis
                ? (analysis as any).repository_url.split('/').slice(-2).join('/')
                : 'Unknown',
        status: analysis.status,
        created_at: analysis.created_at
    }));

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Dashboard
                </Typography>
                <Box>
                    <Tooltip title="Refresh data">
                        <IconButton onClick={refreshData} disabled={isRefreshing || apkLoading || githubLoading || reportsLoading}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Stats cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard
                        title="APK Analyses"
                        value={apkAnalyses.length}
                        icon={<Assignment />}
                        color={theme.palette.primary.main}
                        onClick={() => navigate('/apk-analysis')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard
                        title="GitHub Repos"
                        value={githubAnalyses.length}
                        icon={<GitHub />}
                        color={theme.palette.secondary.main}
                        onClick={() => navigate('/github-analysis')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard
                        title="Reports"
                        value={reports.length}
                        icon={<Timeline />}
                        color={theme.palette.success.main}
                        onClick={() => navigate('/reports')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard
                        title="Security Issues"
                        value={142}
                        icon={<Security />}
                        color={theme.palette.error.main}
                        trend="up"
                        trendValue="12%"
                    />
                </Grid>
            </Grid>

            {/* Charts and activity */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* Security Issues Chart */}
                <Grid item xs={12} md={6} lg={4}>
                    <Card>
                        <CardHeader
                            title="Security Issues by Severity"
                            titleTypographyProps={{ variant: 'h6' }}
                            action={
                                <Tooltip title="View Security Details">
                                    <IconButton onClick={() => navigate('/reports')}>
                                        <Security />
                                    </IconButton>
                                </Tooltip>
                            }
                        />
                        <Divider />
                        <CardContent>
                            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={securityIssuesByType}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            nameKey="name"
                                            label
                                        >
                                            {securityIssuesByType.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(value, name) => [`${value} issues`, name]} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Analysis Types Chart */}
                <Grid item xs={12} md={6} lg={4}>
                    <Card>
                        <CardHeader
                            title="Analysis Types"
                            titleTypographyProps={{ variant: 'h6' }}
                            action={
                                <Tooltip title="New Analysis">
                                    <IconButton onClick={() => navigate('/apk-analysis')}>
                                        <AddCircleOutline />
                                    </IconButton>
                                </Tooltip>
                            }
                        />
                        <Divider />
                        <CardContent>
                            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analysisByType}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <RechartsTooltip formatter={(value, name) => [`${value} analyses`, name]} />
                                        <Bar dataKey="value">
                                            {analysisByType.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Activity Feed */}
                <Grid item xs={12} lg={4}>
                    <DashboardActivityCard activities={recentActivityData} />
                </Grid>
            </Grid>

            {/* Recent Analyses */}
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <RecentAnalysesTable analyses={allAnalyses.slice(0, 10)} />
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;