// frontend/src/components/dashboard/AnalyticsOverviewPanel.tsx
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
    ButtonGroup,
    Button,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    useTheme,
    SelectChangeEvent
} from '@mui/material';
import {
    Timeline as TimelineIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Security as SecurityIcon,
    Code as CodeIcon,
    BugReport as BugReportIcon
} from '@mui/icons-material';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

// Types
interface AnalyticsData {
    // Time series data
    timeSeries: {
        apkAnalyses: { date: string; count: number }[];
        githubAnalyses: { date: string; count: number }[];
        issues: { date: string; count: number }[];
    };
    // Issues by category
    issuesByCategory: {
        name: string;
        value: number;
    }[];
    // Issues by severity
    issuesBySeverity: {
        name: string;
        value: number;
    }[];
    // Top technologies
    topTechnologies: {
        name: string;
        count: number;
    }[];
    // Top vulnerabilities
    topVulnerabilities: {
        name: string;
        count: number;
        severity: string;
    }[];
}

interface AnalyticsOverviewPanelProps {
    data: AnalyticsData;
    dateRange: string;
    onDateRangeChange: (range: string) => void;
}

const AnalyticsOverviewPanel: React.FC<AnalyticsOverviewPanelProps> = ({
                                                                           data,
                                                                           dateRange,
                                                                           onDateRangeChange
                                                                       }) => {
    const theme = useTheme();
    const [issueFilter, setIssueFilter] = useState<string>('all');

    // Handle date range change
    const handleDateRangeChange = (range: string) => {
        onDateRangeChange(range);
    };

    // Handle issue filter change
    const handleIssueFilterChange = (event: SelectChangeEvent) => {
        setIssueFilter(event.target.value);
    };

    // Combine APK and GitHub analyses for timeline chart
    const combinedTimelineData = data.timeSeries.apkAnalyses.map((item, index) => {
        const githubItem = data.timeSeries.githubAnalyses[index] || { date: item.date, count: 0 };
        const issuesItem = data.timeSeries.issues[index] || { date: item.date, count: 0 };

        return {
            date: item.date,
            'APK Analyses': item.count,
            'GitHub Analyses': githubItem.count,
            'Issues': issuesItem.count
        };
    });

    // Severity colors
    const severityColors = {
        'Critical': theme.palette.severity.critical,
        'High': theme.palette.severity.high,
        'Medium': theme.palette.severity.medium,
        'Low': theme.palette.severity.low,
        'Info': theme.palette.severity.info
    };

    // Chart colors
    const chartColors = [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.error.main,
        theme.palette.warning.main,
        theme.palette.info.main,
        theme.palette.success.main
    ];

    return (
        <Box>
            {/* Date Range Controls */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Analytics Overview</Typography>
                <ButtonGroup variant="outlined" size="small">
                    <Button
                        onClick={() => handleDateRangeChange('7d')}
                        variant={dateRange === '7d' ? 'contained' : 'outlined'}
                    >
                        7 Days
                    </Button>
                    <Button
                        onClick={() => handleDateRangeChange('30d')}
                        variant={dateRange === '30d' ? 'contained' : 'outlined'}
                    >
                        30 Days
                    </Button>
                    <Button
                        onClick={() => handleDateRangeChange('90d')}
                        variant={dateRange === '90d' ? 'contained' : 'outlined'}
                    >
                        90 Days
                    </Button>
                    <Button
                        onClick={() => handleDateRangeChange('1y')}
                        variant={dateRange === '1y' ? 'contained' : 'outlined'}
                    >
                        1 Year
                    </Button>
                </ButtonGroup>
            </Box>

            {/* Activity Timeline Chart */}
            <Card sx={{ mb: 3 }}>
                <CardHeader
                    title="Analysis Activity Timeline"
                    titleTypographyProps={{ variant: 'subtitle1' }}
                    avatar={<TimelineIcon />}
                />
                <Divider />
                <CardContent>
                    <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={combinedTimelineData}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="APK Analyses"
                                    stroke={theme.palette.primary.main}
                                    activeDot={{ r: 8 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="GitHub Analyses"
                                    stroke={theme.palette.secondary.main}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="Issues"
                                    stroke={theme.palette.error.main}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
                </CardContent>
            </Card>

            {/* Charts Grid */}
            <Grid container spacing={3}>
                {/* Issues by Severity */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader
                            title="Issues by Severity"
                            titleTypographyProps={{ variant: 'subtitle1' }}
                            avatar={<SecurityIcon />}
                            action={
                                <Chip
                                    label={`Total: ${data.issuesBySeverity.reduce((acc, curr) => acc + curr.value, 0)}`}
                                    size="small"
                                    color="primary"
                                />
                            }
                        />
                        <Divider />
                        <CardContent>
                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.issuesBySeverity}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={true}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        >
                                            {data.issuesBySeverity.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={severityColors[entry.name as keyof typeof severityColors] || chartColors[index % chartColors.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => [`${value} issues`, 'Count']} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Issues by Category */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader
                            title="Issues by Category"
                            titleTypographyProps={{ variant: 'subtitle1' }}
                            avatar={<BugReportIcon />}
                            action={
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel id="issue-filter-label">Filter</InputLabel>
                                    <Select
                                        labelId="issue-filter-label"
                                        value={issueFilter}
                                        label="Filter"
                                        onChange={handleIssueFilterChange}
                                    >
                                        <MenuItem value="all">All</MenuItem>
                                        <MenuItem value="security">Security</MenuItem>
                                        <MenuItem value="performance">Performance</MenuItem>
                                        <MenuItem value="quality">Quality</MenuItem>
                                    </Select>
                                </FormControl>
                            }
                        />
                        <Divider />
                        <CardContent>
                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={data.issuesByCategory.filter(item =>
                                            issueFilter === 'all' || item.name.toLowerCase().includes(issueFilter)
                                        )}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar
                                            dataKey="value"
                                            name="Issues"
                                            fill={theme.palette.primary.main}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Top Technologies */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader
                            title="Top Technologies"
                            titleTypographyProps={{ variant: 'subtitle1' }}
                            avatar={<CodeIcon />}
                        />
                        <Divider />
                        <CardContent>
                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={data.topTechnologies}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        layout="vertical"
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis type="category" dataKey="name" width={100} />
                                        <Tooltip formatter={(value) => [`${value} occurrences`, 'Count']} />
                                        <Bar
                                            dataKey="count"
                                            name="Occurrences"
                                            fill={theme.palette.secondary.main}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Top Vulnerabilities */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader
                            title="Top Vulnerabilities"
                            titleTypographyProps={{ variant: 'subtitle1' }}
                            avatar={<SecurityIcon />}
                        />
                        <Divider />
                        <CardContent>
                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={data.topVulnerabilities}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        layout="vertical"
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis type="category" dataKey="name" width={120} />
                                        <Tooltip formatter={(value) => [`${value} instances`, 'Count']} />
                                        <Bar dataKey="count" name="Instances">
                                            {data.topVulnerabilities.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={severityColors[entry.severity as keyof typeof severityColors] || chartColors[index % chartColors.length]}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Trend Summary */}
                <Grid item xs={12}>
                    <Grid container spacing={3}>
                        {/* APK Analysis Trend */}
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                                    <Typography variant="h6">APK Analysis Trend</Typography>
                                </Box>
                                <Typography variant="h4" color="success.main">
                                    +24%
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Increase in APK analyses compared to previous period
                                </Typography>
                                <Box sx={{ height: 100, mt: 2 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={data.timeSeries.apkAnalyses}
                                            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
                                        >
                                            <Area
                                                type="monotone"
                                                dataKey="count"
                                                stroke={theme.palette.success.main}
                                                fill={theme.palette.success.main}
                                                fillOpacity={0.2}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* GitHub Analysis Trend */}
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                                    <Typography variant="h6">GitHub Analysis Trend</Typography>
                                </Box>
                                <Typography variant="h4" color="primary.main">
                                    +18%
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Increase in GitHub analyses compared to previous period
                                </Typography>
                                <Box sx={{ height: 100, mt: 2 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={data.timeSeries.githubAnalyses}
                                            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
                                        >
                                            <Area
                                                type="monotone"
                                                dataKey="count"
                                                stroke={theme.palette.primary.main}
                                                fill={theme.palette.primary.main}
                                                fillOpacity={0.2}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* Issues Trend */}
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <TrendingDownIcon color="error" sx={{ mr: 1 }} />
                                    <Typography variant="h6">Security Issues Trend</Typography>
                                </Box>
                                <Typography variant="h4" color="error.main">
                                    -12%
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Decrease in security issues compared to previous period
                                </Typography>
                                <Box sx={{ height: 100, mt: 2 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={data.timeSeries.issues}
                                            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
                                        >
                                            <Area
                                                type="monotone"
                                                dataKey="count"
                                                stroke={theme.palette.error.main}
                                                fill={theme.palette.error.main}
                                                fillOpacity={0.2}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AnalyticsOverviewPanel;