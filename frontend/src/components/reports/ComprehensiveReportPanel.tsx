permissions_count?: number;
dangerous_permissions_count?: number;
file_size?: number;
dependencies_count?: number;
outdated_dependencies_count?: number;
vulnerable_dependencies_count?: number;
};
result_details?: any;
}

interface ComprehensiveReportPanelProps {
    report: {
        id: string;
        title: string;
        description: string;
        created_at: string;
        report_type: string;
        format: string;
        analyses: AnalysisResult[];
    };
    onExport?: (format: string) => void;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const ComprehensiveReportPanel: React.FC<ComprehensiveReportPanelProps> = ({ report, onExport }) => {
    const theme = useTheme();
    const [activeStep, setActiveStep] = useState(0);
    const [expandedSection, setExpandedSection] = useState<string | null>('overview');

    // Handle section expansion
    const handleSectionChange = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    // Calculate overall scores
    const calculateAverageScore = (scoreName: string): number => {
        const scores = report.analyses
            .map(analysis => analysis.summary[scoreName] || 0)
            .filter(score => score > 0);

        if (scores.length === 0) return 0;

        return Math.round(scores.reduce((acc, score) => acc + score, 0) / scores.length);
    };

    const securityScore = calculateAverageScore('security_score');
    const performanceScore = calculateAverageScore('performance_score');
    const qualityScore = calculateAverageScore('quality_score');
    const privacyScore = calculateAverageScore('privacy_score');
    const batteryScore = calculateAverageScore('battery_score');

    // Count total issues by severity
    const totalCriticalIssues = report.analyses.reduce((acc, analysis) =>
        acc + (analysis.summary.critical_issues || 0), 0);
    const totalHighIssues = report.analyses.reduce((acc, analysis) =>
        acc + (analysis.summary.high_issues || 0), 0);
    const totalMediumIssues = report.analyses.reduce((acc, analysis) =>
        acc + (analysis.summary.medium_issues || 0), 0);
    const totalLowIssues = report.analyses.reduce((acc, analysis) =>
        acc + (analysis.summary.low_issues || 0), 0);

    // Get all technologies used
    const allTechnologies = new Set<string>();
    report.analyses.forEach(analysis => {
        if (analysis.summary.technologies) {
            analysis.summary.technologies.forEach(tech => allTechnologies.add(tech));
        }
    });

    // Get color based on score
    const getScoreColor = (score: number): string => {
        if (score >= 80) return theme.palette.success.main;
        if (score >= 60) return theme.palette.info.main;
        if (score >= 40) return theme.palette.warning.main;
        return theme.palette.error.main;
    };

    // Get security level based on score
    const getSecurityLevel = (score: number): string => {
        if (score >= 80) return 'Secure';
        if (score >= 60) return 'Moderate Risk';
        if (score >= 40) return 'High Risk';
        return 'Critical Risk';
    };

    // Format date string
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    // Format file size
    const formatFileSize = (bytes: number | undefined): string => {
        if (!bytes) return 'Unknown';

        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Byte';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
    };

    // Prepare radar chart data
    const radarData = [
        { subject: 'Security', A: securityScore, fullMark: 100 },
        { subject: 'Performance', A: performanceScore, fullMark: 100 },
        { subject: 'Quality', A: qualityScore, fullMark: 100 },
        { subject: 'Privacy', A: privacyScore || 0, fullMark: 100 },
        { subject: 'Battery', A: batteryScore || 0, fullMark: 100 }
    ];

    // Prepare severity chart data
    const severityData = [
        { name: 'Critical', value: totalCriticalIssues, color: theme.palette.severity.critical },
        { name: 'High', value: totalHighIssues, color: theme.palette.severity.high },
        { name: 'Medium', value: totalMediumIssues, color: theme.palette.severity.medium },
        { name: 'Low', value: totalLowIssues, color: theme.palette.severity.low }
    ];

    return (
        <Box>
            {/* Report Header */}
            <Paper sx={{ p: 3, mb: 3, position: 'relative' }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                        <Typography variant="h5" gutterBottom>
                            {report.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            {report.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                                icon={<DescriptionIcon />}
                                label={`Report Type: ${report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)}`}
                                size="small"
                                variant="outlined"
                            />
                            <Chip
                                icon={<AndroidIcon />}
                                label={`Analyses: ${report.analyses.filter(a => a.type === 'apk').length} APK`}
                                size="small"
                                variant="outlined"
                                color="primary"
                            />
                            <Chip
                                icon={<GitHubIcon />}
                                label={`Analyses: ${report.analyses.filter(a => a.type === 'github').length} GitHub`}
                                size="small"
                                variant="outlined"
                                color="secondary"
                            />
                            <Chip
                                label={`Created: ${formatDate(report.created_at)}`}
                                size="small"
                                variant="outlined"
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1, alignItems: 'center' }}>
                        <Tooltip title="Download PDF">
                            <IconButton color="primary" onClick={() => onExport && onExport('pdf')}>
                                <CloudDownloadIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Print Report">
                            <IconButton color="primary" onClick={() => window.print()}>
                                <PrintIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Share Report">
                            <IconButton color="primary">
                                <ShareIcon />
                            </IconButton>
                        </Tooltip>
                    </Grid>
                </Grid>
            </Paper>

            {/* Executive Summary */}
            <Accordion
                expanded={expandedSection === 'overview'}
                onChange={() => handleSectionChange('overview')}
                sx={{ mb: 2 }}
            >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Executive Summary</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" />
                                        <PolarRadiusAxis domain={[0, 100]} />
                                        <Radar
                                            name="Scores"
                                            dataKey="A"
                                            stroke={theme.palette.primary.main}
                                            fill={theme.palette.primary.main}
                                            fillOpacity={0.6}
                                        />
                                        <RechartsTooltip formatter={(value) => [`${value}/100`, 'Score']} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <Grid container spacing={2}>
                                {/* Security Score */}
                                <Grid item xs={6} sm={4}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            textAlign: 'center',
                                            borderColor: getScoreColor(securityScore),
                                            borderWidth: 2
                                        }}
                                    >
                                        <SecurityIcon sx={{ fontSize: 32, color: getScoreColor(securityScore), mb: 1 }} />
                                        <Typography variant="h5" sx={{ color: getScoreColor(securityScore) }}>
                                            {securityScore}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Security Score
                                        </Typography>
                                        <Chip
                                            label={getSecurityLevel(securityScore)}
                                            size="small"
                                            sx={{
                                                mt: 1,
                                                backgroundColor: `${getScoreColor(securityScore)}20`,
                                                color: getScoreColor(securityScore)
                                            }}
                                        />
                                    </Paper>
                                </Grid>

                                {/* Performance Score */}
                                <Grid item xs={6} sm={4}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            textAlign: 'center',
                                            borderColor: getScoreColor(performanceScore),
                                            borderWidth: 2
                                        }}
                                    >
                                        <SpeedIcon sx={{ fontSize: 32, color: getScoreColor(performanceScore), mb: 1 }} />
                                        <Typography variant="h5" sx={{ color: getScoreColor(performanceScore) }}>
                                            {performanceScore}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Performance Score
                                        </Typography>
                                    </Paper>
                                </Grid>

                                {/* Quality Score */}
                                <Grid item xs={6} sm={4}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            textAlign: 'center',
                                            borderColor: getScoreColor(qualityScore),
                                            borderWidth: 2
                                        }}
                                    >
                                        <CodeIcon sx={{ fontSize: 32, color: getScoreColor(qualityScore), mb: 1 }} />
                                        <Typography variant="h5" sx={{ color: getScoreColor(qualityScore) }}>
                                            {qualityScore}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Code Quality Score
                                        </Typography>
                                    </Paper>
                                </Grid>

                                {/* Privacy Score if available */}
                                {privacyScore > 0 && (
                                    <Grid item xs={6} sm={4}>
                                        <Paper
                                            variant="outlined"
                                            sx={{
                                                p: 2,
                                                textAlign: 'center',
                                                borderColor: getScoreColor(privacyScore),
                                                borderWidth: 2
                                            }}
                                        >
                                            <PrivacyTipIcon sx={{ fontSize: 32, color: getScoreColor(privacyScore), mb: 1 }} />
                                            <Typography variant="h5" sx={{ color: getScoreColor(privacyScore) }}>
                                                {privacyScore}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Privacy Score
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                )}

                                {/* Battery Score if available */}
                                {batteryScore > 0 && (
                                    <Grid item xs={6} sm={4}>
                                        <Paper
                                            variant="outlined"
                                            sx={{
                                                p: 2,
                                                textAlign: 'center',
                                                borderColor: getScoreColor(batteryScore),
                                                borderWidth: 2
                                            }}
                                        >
                                            <BatteryIcon sx={{ fontSize: 32, color: getScoreColor(batteryScore), mb: 1 }} />
                                            <Typography variant="h5" sx={{ color: getScoreColor(batteryScore) }}>
                                                {batteryScore}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Battery Efficiency
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                )}

                                {/* Issues Summary */}
                                <Grid item xs={12} sm={8}>
                                    <Paper
                                        variant="outlined"
                                        sx={{ p: 2 }}
                                    >
                                        <Typography variant="subtitle2" gutterBottom>
                                            Issues Summary
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Typography variant="h5" color="error">
                                                    {totalCriticalIssues}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Critical
                                                </Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Typography variant="h5" sx={{ color: theme.palette.severity.high }}>
                                                    {totalHighIssues}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    High
                                                </Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Typography variant="h5" sx={{ color: theme.palette.severity.medium }}>
                                                    {totalMediumIssues}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Medium
                                                </Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Typography variant="h5" sx={{ color: theme.palette.severity.low }}>
                                                    {totalLowIssues}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Low
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Total: {totalCriticalIssues + totalHighIssues + totalMediumIssues + totalLowIssues} issues identified
                                        </Typography>
                                    </Paper>
                                </Grid>
                            </Grid>

                            {/* Technologies */}
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Technologies Detected
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {Array.from(allTechnologies).map((tech, index) => (
                                        <Chip
                                            key={index}
                                            label={tech}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>
                            </Box>

                            {/* Report Summary */}
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Report Summary
                                </Typography>
                                <Typography variant="body2" paragraph>
                                    This comprehensive report analyzes {report.analyses.length} application{report.analyses.length !== 1 ? 's' : ''} including {report.analyses.filter(a => a.type === 'apk').length} APK and {report.analyses.filter(a => a.type === 'github').length} GitHub repositories. The overall security score is {securityScore}/100 indicating {getSecurityLevel(securityScore)} level. A total of {totalCriticalIssues + totalHighIssues + totalMediumIssues + totalLowIssues} issues were identified with {totalCriticalIssues} critical issues requiring immediate attention.
                                </Typography>
                                <Typography variant="body2">
                                    {totalCriticalIssues > 0 ?
                                        'Critical security vulnerabilities were detected that require immediate remediation.' :
                                        'No critical security vulnerabilities were detected in the analyzed applications.'}
                                    {' '}
                                    {performanceScore < 60 ?
                                        'Performance optimization is recommended to improve application responsiveness and resource usage.' :
                                        'Performance metrics are within acceptable ranges.'}
                                    {' '}
                                    {privacyScore > 0 && privacyScore < 70 ? 'Privacy concerns were identified that may impact user data security.' : ''}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>

            {/* Security Analysis */}
            <Accordion
                expanded={expandedSection === 'security'}
                onChange={() => handleSectionChange('security')}
                sx={{ mb: 2 }}
            >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SecurityIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">Security Analysis</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={5}>
                            <Card>
                                <CardHeader
                                    title="Security Issues by Severity"
                                    titleTypographyProps={{ variant: 'subtitle1' }}
                                />
                                <Divider />
                                <CardContent>
                                    <Box sx={{ height: 300 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={severityData.filter(d => d.value > 0)}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={true}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                                >
                                                    {severityData.map((entry, index) => (
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
                        <Grid item xs={12} md={7}>
                            <Card>
                                <CardHeader
                                    title="Critical Security Findings"
                                    titleTypographyProps={{ variant: 'subtitle1' }}
                                />
                                <Divider />
                                <CardContent>
                                    {totalCriticalIssues + totalHighIssues > 0 ? (
                                        <List>
                                            {report.analyses.map((analysis, analysisIndex) => (
                                                <React.Fragment key={analysisIndex}>
                                                    {/* This would be expanded in a full implementation to list actual issues from result_details */}
                                                    {(analysis.summary.critical_issues > 0 || analysis.summary.high_issues > 0) && (
                                                        <ListItem alignItems="flex-start">
                                                            <ListItemIcon>
                                                                {analysis.type === 'apk' ? <AndroidIcon /> : <GitHubIcon />}
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={analysis.title}
                                                                secondary={
                                                                    <>
                                                                        <Typography variant="body2" component="span">
                                                                            Critical Issues: {analysis.summary.critical_issues}, High Issues: {analysis.summary.high_issues}
                                                                        </Typography>
                                                                        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                                            <Chip
                                                                                icon={<ErrorIcon fontSize="small" />}
                                                                                label="Critical"
                                                                                size="small"
                                                                                sx={{
                                                                                    backgroundColor: `${theme.palette.severity.critical}20`,
                                                                                    color: theme.palette.severity.critical
                                                                                }}
                                                                            />
                                                                            {/* Additional security details would go here */}
                                                                        </Box>
                                                                    </>
                                                                }
                                                            />
                                                        </ListItem>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </List>
                                    ) : (
                                        <Box sx={{ p: 2, textAlign: 'center' }}>
                                            <CheckCircleIcon sx={{ fontSize: 48, color: theme.palette.success.main, mb: 2 }} />
                                            <Typography variant="body1" gutterBottom>
                                                No critical or high severity issues detected
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                The analyzed applications have passed major security checks.
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Security Recommendations */}
                            <Card sx={{ mt: 3 }}>
                                <CardHeader
                                    title="Security Recommendations"
                                    titleTypographyProps={{ variant: 'subtitle1' }}
                                />
                                <Divider />
                                <CardContent>
                                    <List>
                                        {totalCriticalIssues > 0 && (
                                            <ListItem>
                                                <ListItemIcon>
                                                    <ErrorIcon color="error" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary="Address Critical Vulnerabilities"
                                                    secondary="Fix the identified critical security issues immediately to prevent potential exploitation"
                                                />
                                            </ListItem>
                                        )}
                                        {totalHighIssues > 0 && (
                                            <ListItem>
                                                <ListItemIcon>
                                                    <WarningIcon color="warning" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary="Remediate High Severity Issues"
                                                    secondary="Prioritize and address high severity security issues in the next development cycle"
                                                />
                                            </ListItem>
                                        )}
                                        {/* Generic security recommendations */}
                                        <ListItem>
                                            <ListItemIcon>
                                                <InfoIcon color="info" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary="Implement Security Testing"
                                                secondary="Integrate automated security testing into the CI/CD pipeline to catch vulnerabilities early"
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon>
                                                <InfoIcon color="info" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary="Regular Dependency Updates"
                                                secondary="Keep all dependencies updated to their latest secure versions"
                                            />
                                        </ListItem>
                                    </List>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>

            {/* Performance Analysis */}
            <Accordion
                expanded={expandedSection === 'performance'}
                onChange={() => handleSectionChange('performance')}
                sx={{ mb: 2 }}
            >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SpeedIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">Performance Analysis</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Typography variant="body1" paragraph>
                        The performance analysis section assesses application responsiveness, resource utilization, and overall efficiency. With an average score of {performanceScore}/100, the application{report.analyses.length !== 1 ? 's' : ''} {performanceScore > 70 ? 'demonstrate good performance characteristics' : 'have room for performance optimization'}.
                    </Typography>

                    {/* More performance metrics would be added here */}
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Key Performance Metrics
                        </Typography>
                        <Grid container spacing={2}>
                            {report.analyses.filter(a => a.type === 'apk').map((analysis, analysisIndex) => (
                                <Grid item xs={12} key={analysisIndex}>
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="subtitle1" gutterBottom>
                                            {analysis.title}
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={6} sm={3}>
                                                <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="h6" color="primary">
                                                        {analysis.summary.performance_score}/100
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Performance Score
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={6} sm={3}>
                                                <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="h6">
                                                        {formatFileSize(analysis.summary.file_size)}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Application Size
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            {/* Additional performance metrics would go here */}
                                        </Grid>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Code Quality Analysis */}
            <Accordion
                expanded={expandedSection === 'quality'}
                onChange={() => handleSectionChange('quality')}
                sx={{ mb: 2 }}
            >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CodeIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">Code Quality Analysis</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Typography variant="body1" paragraph>
                        The code quality analysis evaluates the maintainability, readability, and structural integrity of the codebase. With an average quality score of {qualityScore}/100, the codebase demonstrates {qualityScore > 70 ? 'good' : qualityScore > 50 ? 'moderate' : 'concerning'} quality characteristics.
                    </Typography>

                    {/* GitHub analyses would be featured here with more code quality metrics */}
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Repository Analyses
                        </Typography>
                        <Grid container spacing={2}>
                            {report.analyses.filter(a => a.type === 'github').map((analysis, analysisIndex) => (
                                <Grid item xs={12} key={analysisIndex}>
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="subtitle1" gutterBottom>
                                            {analysis.title}
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={6} sm={3}>
                                                <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="h6" color="primary">
                                                        {analysis.summary.quality_score}/100
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Quality Score
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            {analysis.summary.dependencies_count && (
                                                <Grid item xs={6} sm={3}>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Typography variant="h6">
                                                            {analysis.summary.dependencies_count}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Dependencies
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            )}
                                            {analysis.summary.outdated_dependencies_count && (
                                                <Grid item xs={6} sm={3}>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Typography variant="h6" color="warning.main">
                                                            {analysis.summary.outdated_dependencies_count}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Outdated Dependencies
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            )}
                                            {analysis.summary.vulnerable_dependencies_count && (
                                                <Grid item xs={6} sm={3}>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Typography variant="h6" color="error">
                                                            {analysis.summary.vulnerable_dependencies_count}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Vulnerable Dependencies
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Privacy Analysis (if applicable) */}
            {privacyScore > 0 && (
                <Accordion
                    expanded={expandedSection === 'privacy'}
                    onChange={() => handleSectionChange('privacy')}
                    sx={{ mb: 2 }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PrivacyTipIcon sx={{ mr: 1 }} />
                            <Typography variant="h6">Privacy Analysis</Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography variant="body1" paragraph>
                            The privacy analysis evaluates data collection, storage, and transmission practices. With an average privacy score of {privacyScore}/100, the application{report.analyses.length !== 1 ? 's' : ''} {privacyScore > 70 ? 'demonstrate good privacy practices' : privacyScore > 50 ? 'show some privacy concerns' : 'have significant privacy issues that should be addressed'}.
                        </Typography>

                        {/* Privacy metrics would be detailed here */}
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Privacy Concerns
                            </Typography>
                            <List>
                                {report.analyses.filter(a => a.type === 'apk' && a.summary.dangerous_permissions_count && a.summary.dangerous_permissions_count > 0).map((analysis, analysisIndex) => (
                                    <ListItem key={analysisIndex}>
                                        <ListItemIcon>
                                            <WarningIcon color="warning" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={`${analysis.title} uses ${analysis.summary.dangerous_permissions_count} dangerous permissions`}
                                            secondary="Dangerous permissions may collect sensitive user data"
                                        />
                                    </ListItem>
                                ))}
                                {/* Additional privacy issues would be listed here */}
                            </List>
                        </Box>
                    </AccordionDetails>
                </Accordion>
            )}

            {/* Recommendations */}
            <Accordion
                expanded={expandedSection === 'recommendations'}
                onChange={() => handleSectionChange('recommendations')}
                sx={{ mb: 2 }}
            >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <BugReportIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">Key Recommendations</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardHeader
                                    title="Security Recommendations"
                                    titleTypographyProps={{ variant: 'subtitle1' }}
                                    avatar={<SecurityIcon />}
                                />
                                <Divider />
                                <CardContent>
                                    <List>
                                        {totalCriticalIssues > 0 && (
                                            <ListItem>
                                                <ListItemIcon>
                                                    <ErrorIcon color="error" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary="Fix Critical Vulnerabilities"
                                                    secondary="Address all critical security issues as a top priority"
                                                />
                                            </ListItem>
                                        )}
                                        <ListItem>
                                            <ListItemIcon>
                                                <InfoIcon color="info" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary="Implement Security Testing"
                                                secondary="Integrate security testing into your CI/CD pipeline"
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon>
                                                <InfoIcon color="info" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary="Keep Dependencies Updated"
                                                secondary="Regularly update all dependencies to their latest secure versions"
                                            />
                                        </ListItem>
                                    </List>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardHeader
                                    title="Performance Recommendations"
                                    titleTypographyProps={{ variant: 'subtitle1' }}
                                    avatar={<SpeedIcon />}
                                />
                                <Divider />
                                <CardContent>
                                    <List>
                                        {report.analyses.some(a => a.type === 'apk' && a.summary.file_size && a.summary.file_size > 10 * 1024 * 1024) && (
                                            <ListItem>
                                                <ListItemIcon>
                                                    <WarningIcon color="warning" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary="Optimize App Size"
                                                    secondary="Reduce application size to improve download and installation experience"
                                                />
                                            </ListItem>
                                        )}
                                        <ListItem>
                                            <ListItemIcon>
                                                <InfoIcon color="info" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary="Optimize UI Rendering"
                                                secondary="Improve UI rendering performance to enhance user experience"
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon>
                                                <InfoIcon color="info" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary="Implement Resource Pooling"
                                                secondary="Reuse resources where possible to reduce memory consumption"
                                            />
                                        </ListItem>
                                    </List>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12}>
                            <Button variant="contained" color="primary" fullWidth>
                                Generate Detailed Recommendations Report
                            </Button>
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>

            {/* Analysis Timeline */}
            <Accordion
                expanded={expandedSection === 'timeline'}
                onChange={() => handleSectionChange('timeline')}
                sx={{ mb: 2 }}
            >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DescriptionIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">Analysis Timeline</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Stepper orientation="vertical" activeStep={report.analyses.length}>
                        {report.analyses.map((analysis, index) => (
                            <Step key={analysis.id} completed={true}>
                                <StepLabel>
                                    <Typography variant="subtitle1">
                                        {analysis.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {analysis.type === 'apk' ? 'APK Analysis' : 'GitHub Analysis'} • {formatDate(analysis.created_at)}
                                    </Typography>
                                </StepLabel>
                            </Step>
                        ))}
                        <Step key="report-generation" completed={true}>
                            <StepLabel>
                                <Typography variant="subtitle1">
                                    Comprehensive Report Generated
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {formatDate(report.created_at)}
                                </Typography>
                            </StepLabel>
                        </Step>
                    </Stepper>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};

export default ComprehensiveReportPanel;// frontend/src/components/reports/ComprehensiveReportPanel.tsx
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
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Button,
    IconButton,
    Stepper,
    Step,
    StepLabel,
    Tooltip,
    useTheme
} from '@mui/material';
import {
    Description as DescriptionIcon,
    Security as SecurityIcon,
    BugReport as BugReportIcon,
    Speed as SpeedIcon,
    Code as CodeIcon,
    PrivacyTip as PrivacyTipIcon,
    Battery as BatteryIcon,
    Android as AndroidIcon,
    GitHub as GitHubIcon,
    CloudDownload as CloudDownloadIcon,
    Print as PrintIcon,
    Share as ShareIcon,
    ExpandMore as ExpandMoreIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    Legend,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from 'recharts';

// Types
interface AnalysisResult {
    id: string;
    title: string;
    description: string;
    type: 'apk' | 'github';
    created_at: string;
    status: string;
    summary: {
        security_score: number;
        performance_score: number;
        quality_score: number;
        privacy_score?: number;
        battery_score?: number;
        issues_count: number;
        critical_issues: number;
        high_issues: number;
        medium_issues: number;
        low_issues: number;
        technologies: string[];
        permissions_count