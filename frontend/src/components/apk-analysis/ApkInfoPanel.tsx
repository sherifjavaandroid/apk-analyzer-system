// frontend/src/components/apk-analysis/ApkInfoPanel.tsx
import React from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Chip,
    List,
    ListItem,
    ListItemText,
    Divider,
    Card,
    CardContent,
    CardHeader,
    useTheme,
    Button
} from '@mui/material';
import {
    Android as AndroidIcon,
    Info as InfoIcon,
    Assessment as AssessmentIcon,
    Security as SecurityIcon,
    Smartphone as SmartphoneIcon,
    Apps as AppsIcon,
    Storage as StorageIcon,
    Code as CodeIcon,
    ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

// APK Info type
interface ApkInfo {
    package_name: string | null;
    version_name: string | null;
    version_code: number | string | null;
    min_sdk_version: number | null;
    target_sdk_version: number | null;
    permissions: string[];
    activities: string[];
    services: string[];
    receivers: string[];
    providers: string[];
    file_size: number | null;
    dex_files: string[];
    resources: any;
    libraries: any[];
    assets: string[];
    icon: string | null;
    frameworks: any | null;
}

interface ApkInfoPanelProps {
    apkInfo: ApkInfo | undefined;
}

const ApkInfoPanel: React.FC<ApkInfoPanelProps> = ({ apkInfo }) => {
    const theme = useTheme();

    if (!apkInfo) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                    APK information not available.
                </Typography>
            </Box>
        );
    }

    // Format file size
    const formatSize = (bytes: number | null): string => {
        if (bytes === null || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Map SDK version to Android version
    const mapSdkToAndroidVersion = (sdkLevel: number | null): string => {
        if (sdkLevel === null) return 'Unknown';

        const sdkMap: Record<number, string> = {
            33: 'Android 13',
            32: 'Android 12L',
            31: 'Android 12',
            30: 'Android 11',
            29: 'Android 10',
            28: 'Android 9 (Pie)',
            27: 'Android 8.1 (Oreo)',
            26: 'Android 8.0 (Oreo)',
            25: 'Android 7.1 (Nougat)',
            24: 'Android 7.0 (Nougat)',
            23: 'Android 6.0 (Marshmallow)',
            22: 'Android 5.1 (Lollipop)',
            21: 'Android 5.0 (Lollipop)',
            19: 'Android 4.4 (KitKat)',
            18: 'Android 4.3 (Jelly Bean)',
            17: 'Android 4.2 (Jelly Bean)',
            16: 'Android 4.1 (Jelly Bean)',
            15: 'Android 4.0.3 (Ice Cream Sandwich)',
            14: 'Android 4.0 (Ice Cream Sandwich)',
        };

        return sdkMap[sdkLevel] || `Android API ${sdkLevel}`;
    };

    // Determine primary framework
    const getPrimaryFramework = (): string => {
        if (!apkInfo.frameworks) return 'Native Android';

        const frameworks = apkInfo.frameworks;

        if (frameworks.flutter) return 'Flutter';
        if (frameworks.react_native) return 'React Native';
        if (frameworks.xamarin) return 'Xamarin';
        if (frameworks.cordova) return 'Cordova/PhoneGap';
        if (frameworks.unity) return 'Unity';

        return 'Native Android';
    };

    const primaryFramework = getPrimaryFramework();

    return (
        <Box>
            {/* APK Main Info */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item>
                        <Box
                            sx={{
                                width: 60,
                                height: 60,
                                borderRadius: 2,
                                backgroundColor: theme.palette.primary.main + '20',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <AndroidIcon
                                sx={{ fontSize: 40, color: theme.palette.primary.main }}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs>
                        <Typography variant="h6" gutterBottom>
                            {apkInfo.package_name || 'Unknown Package'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                            <Chip
                                label={`v${apkInfo.version_name || '?'}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                            <Chip
                                label={primaryFramework}
                                size="small"
                                color="secondary"
                                variant="outlined"
                            />
                            <Chip
                                label={formatSize(apkInfo.file_size)}
                                size="small"
                                variant="outlined"
                            />
                        </Box>
                    </Grid>
                    <Grid item>
                        <Button variant="outlined" endIcon={<ArrowForwardIcon />}>
                            Detailed Report
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Details Grid */}
            <Grid container spacing={3}>
                {/* Basic Info Card */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader
                            title="Application Information"
                            titleTypographyProps={{ variant: 'h6' }}
                            avatar={<InfoIcon />}
                        />
                        <Divider />
                        <CardContent>
                            <List dense>
                                <ListItem>
                                    <ListItemText
                                        primary="Package Name"
                                        secondary={apkInfo.package_name || 'Not specified'}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="Version"
                                        secondary={`${apkInfo.version_name || '?'} (${apkInfo.version_code || '?'})`}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="Min SDK"
                                        secondary={apkInfo.min_sdk_version ?
                                            `${apkInfo.min_sdk_version} (${mapSdkToAndroidVersion(apkInfo.min_sdk_version)})` :
                                            'Not specified'}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="Target SDK"
                                        secondary={apkInfo.target_sdk_version ?
                                            `${apkInfo.target_sdk_version} (${mapSdkToAndroidVersion(apkInfo.target_sdk_version)})` :
                                            'Not specified'}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="File Size"
                                        secondary={formatSize(apkInfo.file_size)}
                                    />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Framework Card */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader
                            title="Technologies"
                            titleTypographyProps={{ variant: 'h6' }}
                            avatar={<CodeIcon />}
                        />
                        <Divider />
                        <CardContent>
                            <Typography variant="subtitle2" gutterBottom>
                                Primary Framework
                            </Typography>
                            <Chip
                                label={primaryFramework}
                                color="primary"
                                sx={{ mb: 2 }}
                            />

                            <Typography variant="subtitle2" gutterBottom>
                                Libraries & SDKs
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                {apkInfo.libraries && apkInfo.libraries.length > 0 ? (
                                    apkInfo.libraries.slice(0, 8).map((lib, index) => (
                                        <Chip
                                            key={index}
                                            label={lib.name || lib}
                                            size="small"
                                            variant="outlined"
                                        />
                                    ))
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        No libraries detected
                                    </Typography>
                                )}

                                {apkInfo.libraries && apkInfo.libraries.length > 8 && (
                                    <Chip
                                        label={`+${apkInfo.libraries.length - 8} more`}
                                        size="small"
                                        variant="outlined"
                                    />
                                )}
                            </Box>

                            <Typography variant="subtitle2" gutterBottom>
                                DEX Files
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {apkInfo.dex_files.length} DEX files detected
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Components Card */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader
                            title="Components"
                            titleTypographyProps={{ variant: 'h6' }}
                            avatar={<AppsIcon />}
                        />
                        <Divider />
                        <CardContent>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Activities
                                    </Typography>
                                    <Typography variant="h5" color="primary" gutterBottom>
                                        {apkInfo.activities.length}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Services
                                    </Typography>
                                    <Typography variant="h5" color="secondary" gutterBottom>
                                        {apkInfo.services.length}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Receivers
                                    </Typography>
                                    <Typography variant="h5" color="info.main" gutterBottom>
                                        {apkInfo.receivers.length}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Providers
                                    </Typography>
                                    <Typography variant="h5" color="warning.main" gutterBottom>
                                        {apkInfo.providers.length}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Permissions Card */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader
                            title="Permissions"
                            titleTypographyProps={{ variant: 'h6' }}
                            avatar={<SecurityIcon />}
                            subheader={`${apkInfo.permissions.length} permissions requested`}
                        />
                        <Divider />
                        <CardContent sx={{ maxHeight: 200, overflow: 'auto' }}>
                            {apkInfo.permissions.length > 0 ? (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {apkInfo.permissions.map((permission, index) => {
                                        // Extract the last part of the permission string
                                        const permName = permission.split('.').pop() || permission;

                                        // Determine permission type/color
                                        let color = 'default';
                                        if (permission.toLowerCase().includes('dangerous')) color = 'error';
                                        else if (permission.toLowerCase().includes('location')) color = 'warning';
                                        else if (permission.toLowerCase().includes('camera') ||
                                            permission.toLowerCase().includes('record_audio') ||
                                            permission.toLowerCase().includes('contacts') ||
                                            permission.toLowerCase().includes('sms') ||
                                            permission.toLowerCase().includes('call_log')) color = 'warning';

                                        return (
                                            <Chip
                                                key={index}
                                                label={permName}
                                                size="small"
                                                color={color as any}
                                                variant="outlined"
                                            />
                                        );
                                    })}
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No permissions requested
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ApkInfoPanel;