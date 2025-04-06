// frontend/src/components/github-analysis/DependenciesPanel.tsx
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
    ListItemText,
    ListItemIcon,
    TextField,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    IconButton,
    Button,
    Tooltip,
    useTheme
} from '@mui/material';
import {
    Storage as StorageIcon,
    Update as UpdateIcon,
    Security as SecurityIcon,
    Code as CodeIcon,
    Search as SearchIcon,
    FilterAlt as FilterIcon,
    NewReleases as NewReleasesIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    Gavel as GavelIcon,
    BugReport as BugReportIcon,
    Upgrade as UpgradeIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

// Types
interface Dependency {
    name: string;
    current_version: string;
    latest_version?: string;
    is_outdated: boolean;
    dependency_type: string;
    ecosystem: string;
    license?: string;
    vulnerabilities: Array<{
        id: string;
        severity: string;
        title: string;
        description: string;
        fixed_in?: string;
    }>;
}

interface DependenciesResult {
    ecosystems_detected: string[];
    dependencies_count: number;
    direct_dependencies_count: number;
    outdated_dependencies_count: number;
    vulnerable_dependencies_count: number;
    dependencies: Dependency[];
    dependency_graph?: Record<string, string[]>;
    summary: Record<string, any>;
}

interface DependenciesPanelProps {
    dependencies?: DependenciesResult;
}

const DependenciesPanel: React.FC<DependenciesPanelProps> = ({ dependencies }) => {
    const theme = useTheme();

    // State for dependencies table
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string | null>(null);
    const [filterEcosystem, setFilterEcosystem] = useState<string | null>(null);

    if (!dependencies) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                    Dependencies analysis results not available.
                </Typography>
            </Box>
        );
    }

    // Get dependency ecosystem color
    const getEcosystemColor = (ecosystem: string): string => {
        const ecosystemColors: Record<string, string> = {
            'npm': theme.palette.primary.main,
            'yarn': theme.palette.primary.dark,
            'pip': theme.palette.secondary.main,
            'golang': theme.palette.info.main,
            'maven': theme.palette.success.main,
            'nuget': theme.palette.warning.main,
            'composer': theme.palette.error.main,
            'cargo': theme.palette.warning.dark
        };

        return ecosystemColors[ecosystem.toLowerCase()] || theme.palette.primary.main;
    };

    // Get dependency type color
    const getDependencyTypeColor = (type: string): string => {
        const typeColors: Record<string, string> = {
            'direct': theme.palette.primary.main,
            'transitive': theme.palette.secondary.main,
            'dev': theme.palette.info.main,
            'peer': theme.palette.warning.main,
            'optional': theme.palette.success.main
        };

        return typeColors[type.toLowerCase()] || theme.palette.text.secondary;
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
            case 'info':
                return theme.palette.severity.info;
            default:
                return theme.palette.text.secondary;
        }
    };

    // Filter dependencies
    const getFilteredDependencies = () => {
        return dependencies.dependencies.filter(dep => {
            // Apply search term filter
            if (searchTerm && !dep.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }

            // Apply type filter
            if (filterType && dep.dependency_type.toLowerCase() !== filterType.toLowerCase()) {
                return false;
            }

            // Apply ecosystem filter
            if (filterEcosystem && dep.ecosystem.toLowerCase() !== filterEcosystem.toLowerCase()) {
                return false;
            }

            return true;
        });
    };

    const filteredDependencies = getFilteredDependencies();

    // Prepare ecosystems chart data
    const ecosystemData = dependencies.ecosystems_detected.map(ecosystem => {
        const count = dependencies.dependencies.filter(dep =>
            dep.ecosystem.toLowerCase() === ecosystem.toLowerCase()).length;
        return {
            name: ecosystem,
            value: count,
            color: getEcosystemColor(ecosystem)
        };
    });

    // Prepare dependency types chart data
    const typesData = Array.from(
        new Set(dependencies.dependencies.map(dep => dep.dependency_type))
    ).map(type => {
        const count = dependencies.dependencies.filter(dep =>
            dep.dependency_type.toLowerCase() === type.toLowerCase()).length;
        return {
            name: type.charAt(0).toUpperCase() + type.slice(1),
            value: count,
            color: getDependencyTypeColor(type)
        };
    });

    // Handle pagination
    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box>
            {/* Dependencies Summary */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom>
                            Dependencies Overview
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Paper
                                    variant="outlined"
                                    sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                >
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Total Dependencies
                                    </Typography>
                                    <Typography variant="h4" color="primary">
                                        {dependencies.dependencies_count}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6}>
                                <Paper
                                    variant="outlined"
                                    sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                >
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Direct Dependencies
                                    </Typography>
                                    <Typography variant="h4" color="info.main">
                                        {dependencies.direct_dependencies_count}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6}>
                                <Paper
                                    variant="outlined"
                                    sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                >
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Outdated
                                    </Typography>
                                    <Typography variant="h4" color="warning.main">
                                        {dependencies.outdated_dependencies_count}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6}>
                                <Paper
                                    variant="outlined"
                                    sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                >
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Vulnerable
                                    </Typography>
                                    <Typography variant="h4" color="error">
                                        {dependencies.vulnerable_dependencies_count}
                                    </Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="h6" gutterBottom>
                                    Ecosystems Detected
                                </Typography>
                                <Box sx={{ height: 200 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={ecosystemData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={60}
                                                fill="#8884d8"
                                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                            >
                                                {ecosystemData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip formatter={(value) => [`${value} packages`, 'Count']} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="h6" gutterBottom>
                                    Dependency Types
                                </Typography>
                                <Box sx={{ height: 200 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={typesData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={60}
                                                fill="#8884d8"
                                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                            >
                                                {typesData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip formatter={(value) => [`${value} packages`, 'Count']} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>

            {/* Dependencies Table */}
            <Card>
                <CardHeader
                    title="Dependencies"
                    titleTypographyProps={{ variant: 'h6' }}
                    avatar={<StorageIcon />}
                    action={
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<UpdateIcon />}
                                color="warning"
                                disabled={dependencies.outdated_dependencies_count === 0}
                            >
                                Update All
                            </Button>
                        </Box>
                    }
                />
                <Divider />

                {/* Search and Filters */}
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                        placeholder="Search dependencies..."
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ flexGrow: 1 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {/* Type filter chips */}
                        {Array.from(new Set(dependencies.dependencies.map(dep => dep.dependency_type))).map(type => (
                            <Chip
                                key={`type-${type}`}
                                label={type}
                                size="small"
                                icon={<FilterIcon />}
                                onClick={() => setFilterType(filterType === type ? null : type)}
                                color={filterType === type ? 'primary' : 'default'}
                                variant={filterType === type ? 'filled' : 'outlined'}
                            />
                        ))}

                        {/* Ecosystem filter chips */}
                        {dependencies.ecosystems_detected.map(ecosystem => (
                            <Chip
                                key={`eco-${ecosystem}`}
                                label={ecosystem}
                                size="small"
                                icon={<CodeIcon />}
                                onClick={() => setFilterEcosystem(filterEcosystem === ecosystem ? null : ecosystem)}
                                color={filterEcosystem === ecosystem ? 'secondary' : 'default'}
                                variant={filterEcosystem === ecosystem ? 'filled' : 'outlined'}
                            />
                        ))}

                        {/* Clear filters */}
                        {(filterType || filterEcosystem || searchTerm) && (
                            <Chip
                                label="Clear Filters"
                                size="small"
                                onClick={() => {
                                    setFilterType(null);
                                    setFilterEcosystem(null);
                                    setSearchTerm('');
                                }}
                            />
                        )}
                    </Box>
                </Box>

                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Package</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Ecosystem</TableCell>
                                <TableCell>Current Version</TableCell>
                                <TableCell>Latest Version</TableCell>
                                <TableCell>License</TableCell>
                                <TableCell>Vulnerabilities</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredDependencies
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((dep) => (
                                    <TableRow key={`${dep.ecosystem}-${dep.name}`} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>
                                                {dep.name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={dep.dependency_type}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${getDependencyTypeColor(dep.dependency_type)}20`,
                                                    color: getDependencyTypeColor(dep.dependency_type),
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={dep.ecosystem}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${getEcosystemColor(dep.ecosystem)}20`,
                                                    color: getEcosystemColor(dep.ecosystem),
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>{dep.current_version}</TableCell>
                                        <TableCell>
                                            {dep.latest_version ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Typography variant="body2">
                                                        {dep.latest_version}
                                                    </Typography>
                                                    {dep.is_outdated && (
                                                        <Tooltip title="Update available">
                                                            <NewReleasesIcon
                                                                fontSize="small"
                                                                color="warning"
                                                                sx={{ ml: 0.5 }}
                                                            />
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    Unknown
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {dep.license ? (
                                                <Tooltip title={dep.license}>
                                                    <Chip
                                                        icon={<GavelIcon fontSize="small" />}
                                                        label={dep.license}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </Tooltip>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    Unknown
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {dep.vulnerabilities && dep.vulnerabilities.length > 0 ? (
                                                <Tooltip
                                                    title={
                                                        <List dense disablePadding>
                                                            {dep.vulnerabilities.map((vuln, idx) => (
                                                                <ListItem key={idx} disablePadding sx={{ py: 0.5 }}>
                                                                    <ListItemText
                                                                        primary={vuln.title}
                                                                        secondary={`Severity: ${vuln.severity}`}
                                                                        primaryTypographyProps={{
                                                                            variant: 'body2',
                                                                            color: 'inherit'
                                                                        }}
                                                                        secondaryTypographyProps={{
                                                                            variant: 'caption',
                                                                            color: getSeverityColor(vuln.severity)
                                                                        }}
                                                                    />
                                                                </ListItem>
                                                            ))}
                                                        </List>
                                                    }
                                                >
                                                    <Chip
                                                        icon={<BugReportIcon fontSize="small" />}
                                                        label={dep.vulnerabilities.length}
                                                        size="small"
                                                        color="error"
                                                    />
                                                </Tooltip>
                                            ) : (
                                                <Chip
                                                    label="Secure"
                                                    size="small"
                                                    color="success"
                                                    variant="outlined"
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {dep.is_outdated && (
                                                <Tooltip title="Update to latest version">
                                                    <IconButton size="small" color="primary">
                                                        <UpgradeIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <Tooltip title="View details">
                                                <IconButton size="small">
                                                    <InfoIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            {filteredDependencies.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            No dependencies found matching your filters.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    component="div"
                    count={filteredDependencies.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Card>
        </Box>
    );
};

export default DependenciesPanel;