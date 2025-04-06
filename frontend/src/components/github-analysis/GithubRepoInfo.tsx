// frontend/src/components/github-analysis/GithubRepoInfo.tsx
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
    Avatar,
    Link,
    Stack,
    useTheme
} from '@mui/material';
import {
    GitHub as GitHubIcon,
    StarOutline as StarIcon,
    CallSplit as ForkIcon,
    BugReport as BugReportIcon,
    Storage as StorageIcon,
    AccountTree as AccountTreeIcon,
    Code as CodeIcon,
    Folder as FolderIcon,
    Description as DescriptionIcon,
    Gavel as GavelIcon,
    Schedule as ScheduleIcon,
    Public as PublicIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// Types
interface RepositoryInfo {
    name: string;
    owner: string;
    description?: string;
    default_branch: string;
    stars: number;
    forks: number;
    open_issues: number;
    language?: string;
    license?: string;
    size: number;
    last_commit?: string;
    created_at?: string;
    updated_at?: string;
}

interface FileInfo {
    path: string;
    type: string;
    size?: number;
    extension?: string;
    language?: string;
}

interface RepositoryStructure {
    files_count: number;
    directories_count: number;
    size_bytes: number;
    languages: Record<string, number>;
    file_extensions: Record<string, number>;
    files: FileInfo[];
    top_directories: string[];
}

interface GithubRepoInfoProps {
    repoInfo?: RepositoryInfo;
    repoStructure?: RepositoryStructure;
}

const GithubRepoInfo: React.FC<GithubRepoInfoProps> = ({ repoInfo, repoStructure }) => {
    const theme = useTheme();

    if (!repoInfo || !repoStructure) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                    Repository information not available.
                </Typography>
            </Box>
        );
    }

    // Format date
    const formatDate = (dateString?: string): string => {
        if (!dateString) return 'Not available';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Format file size
    const formatSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Prepare language chart data
    const languageData = Object.entries(repoStructure.languages).map(([name, lines]) => ({
        name,
        value: lines,
        color: getLanguageColor(name)
    })).sort((a, b) => b.value - a.value);

    // Get random color for languages
    function getLanguageColor(language: string): string {
        // Map common languages to specific colors
        const languageColors: Record<string, string> = {
            JavaScript: '#f7df1e',
            TypeScript: '#3178c6',
            Python: '#3572A5',
            Java: '#b07219',
            Ruby: '#701516',
            PHP: '#4F5D95',
            'C#': '#178600',
            'C++': '#f34b7d',
            C: '#555555',
            Go: '#00ADD8',
            Rust: '#dea584',
            Swift: '#ffac45',
            Kotlin: '#A97BFF',
            Dart: '#00B4AB',
            HTML: '#e34c26',
            CSS: '#563d7c',
            SCSS: '#c6538c'
        };

        return languageColors[language] ||
            theme.palette.primary.main; // Fallback to primary color
    }

    // File extensions data for chart
    const extensionData = Object.entries(repoStructure.file_extensions)
        .map(([ext, count]) => ({ name: ext || 'No Extension', value: count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10); // Only show top 10

    return (
        <Box>
            {/* Repository Main Info */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item>
                        <Avatar
                            sx={{ width: 60, height: 60, bgcolor: theme.palette.primary.main }}
                            alt={repoInfo.owner}
                        >
                            <GitHubIcon sx={{ fontSize: 40 }} />
                        </Avatar>
                    </Grid>
                    <Grid item xs>
                        <Typography variant="h5" gutterBottom>
                            {repoInfo.name}
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            {repoInfo.owner} / {repoInfo.name}
                        </Typography>
                        {repoInfo.description && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                {repoInfo.description}
                            </Typography>
                        )}
                    </Grid>
                    <Grid item>
                        <Link
                            href={`https://github.com/${repoInfo.owner}/${repoInfo.name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Chip
                                icon={<GitHubIcon />}
                                label="View on GitHub"
                                clickable
                                color="primary"
                            />
                        </Link>
                    </Grid>
                </Grid>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={4}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <StarIcon fontSize="small" color="action" />
                            <Typography variant="body2">{repoInfo.stars} stars</Typography>
                        </Stack>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <ForkIcon fontSize="small" color="action" />
                            <Typography variant="body2">{repoInfo.forks} forks</Typography>
                        </Stack>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <BugReportIcon fontSize="small" color="action" />
                            <Typography variant="body2">{repoInfo.open_issues} open issues</Typography>
                        </Stack>
                    </Grid>
                </Grid>
            </Paper>

            {/* Overview Cards */}
            <Grid container spacing={3}>
                {/* Repository Details */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader
                            title="Repository Details"
                            titleTypographyProps={{ variant: 'h6' }}
                            avatar={<DescriptionIcon />}
                        />
                        <Divider />
                        <CardContent>
                            <List dense>
                                <ListItem>
                                    <ListItemIcon>
                                        <CodeIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Primary Language"
                                        secondary={repoInfo.language || 'Not specified'}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon>
                                        <StorageIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Repository Size"
                                        secondary={formatSize(repoInfo.size)}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon>
                                        <AccountTreeIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Default Branch"
                                        secondary={repoInfo.default_branch}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon>
                                        <GavelIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="License"
                                        secondary={repoInfo.license || 'Not specified'}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon>
                                        <ScheduleIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Last Commit"
                                        secondary={formatDate(repoInfo.last_commit)}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon>
                                        <PublicIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Created At"
                                        secondary={formatDate(repoInfo.created_at)}
                                    />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Repository Structure */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader
                            title="Repository Structure"
                            titleTypographyProps={{ variant: 'h6' }}
                            avatar={<FolderIcon />}
                        />
                        <Divider />
                        <CardContent>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                                        <Typography variant="h5" color="primary">
                                            {repoStructure.files_count}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Files
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                                        <Typography variant="h5" color="secondary">
                                            {repoStructure.directories_count}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Directories
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            <Typography variant="subtitle2" gutterBottom>
                                Top Directories
                            </Typography>
                            <List dense>
                                {repoStructure.top_directories.slice(0, 5).map((dir, index) => (
                                    <ListItem key={index}>
                                        <ListItemIcon>
                                            <FolderIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={dir || '/'}
                                            primaryTypographyProps={{ noWrap: true }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Languages Distribution */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader
                            title="Languages Distribution"
                            titleTypographyProps={{ variant: 'h6' }}
                            avatar={<CodeIcon />}
                            subheader="Based on lines of code"
                        />
                        <Divider />
                        <CardContent>
                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={languageData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        >
                                            {languageData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => [`${value} lines`, 'Lines of Code']} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* File Extensions */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader
                            title="File Extensions"
                            titleTypographyProps={{ variant: 'h6' }}
                            avatar={<DescriptionIcon />}
                            subheader="Top 10 file extensions"
                        />
                        <Divider />
                        <CardContent>
                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={extensionData}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            tick={{ fontSize: 12 }}
                                            width={80}
                                        />
                                        <Tooltip formatter={(value) => [`${value} files`, 'Count']} />
                                        <Bar dataKey="value" fill={theme.palette.primary.main} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default GithubRepoInfo;