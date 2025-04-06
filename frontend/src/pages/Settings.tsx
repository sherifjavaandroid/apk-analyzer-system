// frontend/src/pages/Settings.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Card,
    CardContent,
    CardHeader,
    Button,
    Divider,
    TextField,
    FormControlLabel,
    Switch,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    Snackbar,
    ListItemText,
    IconButton,
    Tabs,
    Tab,
    Avatar,
    useTheme,
    SelectChangeEvent
} from '@mui/material';
import {
    Person as PersonIcon,
    VpnKey as VpnKeyIcon,
    Notifications as NotificationsIcon,
    Palette as PaletteIcon,
    Security as SecurityIcon,
    Code as CodeIcon,
    Save as SaveIcon,
    Refresh as RefreshIcon,
    Delete as DeleteIcon,
    IntegrationInstructions as IntegrationsIcon
} from '@mui/icons-material';

// Redux
import { RootState, AppDispatch } from '../store';
import { toggleDarkMode, setDarkMode } from '../store/slices/uiSlice';

// Constants
import { AI_PROVIDERS, AI_MODELS, FEATURES } from '../config';

// Tab panel interface
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

// Tab panel component
const TabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`settings-tabpanel-${index}`}
            aria-labelledby={`settings-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
};

const Settings: React.FC = () => {
    const theme = useTheme();
    const dispatch = useDispatch<AppDispatch>();

    // Redux state
    const { darkMode } = useSelector((state: RootState) => state.ui);
    const { user } = useSelector((state: RootState) => state.auth);

    // Local state
    const [tabValue, setTabValue] = useState(0);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

    // User profile form state
    const [profileForm, setProfileForm] = useState({
        fullName: user?.full_name || '',
        email: user?.email || '',
        username: user?.username || '',
    });

    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Appearance settings
    const [themeMode, setThemeMode] = useState(darkMode ? 'dark' : 'light');

    // API keys state
    const [apiKeys, setApiKeys] = useState({
        openaiKey: localStorage.getItem('openai_api_key') || '',
        anthropicKey: localStorage.getItem('anthropic_api_key') || '',
        githubToken: localStorage.getItem('github_token') || ''
    });

    // AI settings state
    const [aiSettings, setAiSettings] = useState({
        defaultProvider: localStorage.getItem('default_ai_provider') || 'anthropic',
        defaultModel: localStorage.getItem('default_ai_model') || 'claude-2',
        enableExplanations: localStorage.getItem('enable_ai_explanations') !== 'false',
        enableCodeGen: localStorage.getItem('enable_ai_codegen') !== 'false'
    });

    // Notification settings
    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: localStorage.getItem('email_notifications') !== 'false',
        analysisCompleted: localStorage.getItem('notify_analysis_completed') !== 'false',
        securityAlerts: localStorage.getItem('notify_security_alerts') !== 'false',
        reportGenerated: localStorage.getItem('notify_report_generated') !== 'false'
    });

    // Integration settings
    const [integrationSettings, setIntegrationSettings] = useState({
        jiraEnabled: localStorage.getItem('jira_enabled') === 'true',
        jiraUrl: localStorage.getItem('jira_url') || '',
        jiraToken: localStorage.getItem('jira_token') || '',
        slackEnabled: localStorage.getItem('slack_enabled') === 'true',
        slackWebhook: localStorage.getItem('slack_webhook') || '',
        githubEnabled: localStorage.getItem('github_enabled') === 'true'
    });

    // Handle tab change
    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // Handle theme change
    const handleThemeChange = (event: SelectChangeEvent) => {
        const mode = event.target.value as string;
        setThemeMode(mode);
        dispatch(setDarkMode(mode === 'dark'));
    };

    // Handle profile form changes
    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileForm({
            ...profileForm,
            [name]: value
        });
    };

    // Handle password form changes
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordForm({
            ...passwordForm,
            [name]: value
        });
    };

    // Handle API key changes
    const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setApiKeys({
            ...apiKeys,
            [name]: value
        });
    };

    // Handle AI settings changes
    const handleAISettingChange = (e: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent) => {
        const { name, value } = e.target;
        setAiSettings({
            ...aiSettings,
            [name]: value
        });
    };

    // Handle toggle switches
    const handleToggleChange = (settingType: string, name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;

        if (settingType === 'notifications') {
            setNotificationSettings({
                ...notificationSettings,
                [name]: checked
            });
        } else if (settingType === 'ai') {
            setAiSettings({
                ...aiSettings,
                [name]: checked
            });
        } else if (settingType === 'integrations') {
            setIntegrationSettings({
                ...integrationSettings,
                [name]: checked
            });
        }
    };

    // Handle integration setting changes
    const handleIntegrationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setIntegrationSettings({
            ...integrationSettings,
            [name]: value
        });
    };

    // Save profile changes
    const saveProfile = () => {
        // Mock implementation - in a real app, this would call an API
        setSnackbarMessage('Profile updated successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
    };

    // Save password changes
    const savePassword = () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setSnackbarMessage('Passwords do not match');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }

        // Mock implementation - in a real app, this would call an API
        setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setSnackbarMessage('Password updated successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
    };

    // Save API keys
    const saveApiKeys = () => {
        // Store in localStorage - in a real app, these might be stored securely
        localStorage.setItem('openai_api_key', apiKeys.openaiKey);
        localStorage.setItem('anthropic_api_key', apiKeys.anthropicKey);
        localStorage.setItem('github_token', apiKeys.githubToken);

        setSnackbarMessage('API keys saved successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
    };

    // Save AI settings
    const saveAISettings = () => {
        localStorage.setItem('default_ai_provider', aiSettings.defaultProvider);
        localStorage.setItem('default_ai_model', aiSettings.defaultModel);
        localStorage.setItem('enable_ai_explanations', String(aiSettings.enableExplanations));
        localStorage.setItem('enable_ai_codegen', String(aiSettings.enableCodeGen));

        setSnackbarMessage('AI settings saved successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
    };

    // Save notification settings
    const saveNotificationSettings = () => {
        localStorage.setItem('email_notifications', String(notificationSettings.emailNotifications));
        localStorage.setItem('notify_analysis_completed', String(notificationSettings.analysisCompleted));
        localStorage.setItem('notify_security_alerts', String(notificationSettings.securityAlerts));
        localStorage.setItem('notify_report_generated', String(notificationSettings.reportGenerated));

        setSnackbarMessage('Notification settings saved successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
    };

    // Save integration settings
    const saveIntegrationSettings = () => {
        localStorage.setItem('jira_enabled', String(integrationSettings.jiraEnabled));
        localStorage.setItem('jira_url', integrationSettings.jiraUrl);
        localStorage.setItem('jira_token', integrationSettings.jiraToken);
        localStorage.setItem('slack_enabled', String(integrationSettings.slackEnabled));
        localStorage.setItem('slack_webhook', integrationSettings.slackWebhook);
        localStorage.setItem('github_enabled', String(integrationSettings.githubEnabled));

        setSnackbarMessage('Integration settings saved successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Settings
            </Typography>

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab icon={<PersonIcon />} label="Profile" />
                    <Tab icon={<VpnKeyIcon />} label="Security" />
                    <Tab icon={<PaletteIcon />} label="Appearance" />
                    <Tab icon={<CodeIcon />} label="API Keys" />
                    <Tab icon={<SecurityIcon />} label="AI Settings" />
                    <Tab icon={<NotificationsIcon />} label="Notifications" />
                    <Tab icon={<IntegrationsIcon />} label="Integrations" />
                </Tabs>

                {/* Profile Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                                <Avatar
                                    sx={{
                                        width: 100,
                                        height: 100,
                                        mb: 2,
                                        bgcolor: theme.palette.primary.main
                                    }}
                                >
                                    {user?.username ? user.username[0].toUpperCase() : 'U'}
                                </Avatar>
                                <Button variant="outlined" size="small">
                                    Change Avatar
                                </Button>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <Typography variant="h6" gutterBottom>
                                User Profile
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Full Name"
                                        name="fullName"
                                        value={profileForm.fullName}
                                        onChange={handleProfileChange}
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Username"
                                        name="username"
                                        value={profileForm.username}
                                        onChange={handleProfileChange}
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        name="email"
                                        type="email"
                                        value={profileForm.email}
                                        onChange={handleProfileChange}
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<SaveIcon />}
                                        onClick={saveProfile}
                                    >
                                        Save Changes
                                    </Button>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Security Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Typography variant="h6" gutterBottom>
                        Change Password
                    </Typography>
                    <Grid container spacing={2} sx={{ maxWidth: 500 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Current Password"
                                name="currentPassword"
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={handlePasswordChange}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="New Password"
                                name="newPassword"
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={handlePasswordChange}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Confirm New Password"
                                name="confirmPassword"
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={handlePasswordChange}
                                margin="normal"
                                error={passwordForm.newPassword !== passwordForm.confirmPassword && passwordForm.confirmPassword !== ''}
                                helperText={passwordForm.newPassword !== passwordForm.confirmPassword && passwordForm.confirmPassword !== '' ? "Passwords don't match" : ''}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<SaveIcon />}
                                onClick={savePassword}
                                disabled={!passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                            >
                                Update Password
                            </Button>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Appearance Tab */}
                <TabPanel value={tabValue} index={2}>
                    <Typography variant="h6" gutterBottom>
                        Appearance Settings
                    </Typography>
                    <Grid container spacing={2} sx={{ maxWidth: 500 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Theme Mode</InputLabel>
                                <Select
                                    value={themeMode}
                                    label="Theme Mode"
                                    onChange={handleThemeChange}
                                >
                                    <MenuItem value="light">Light</MenuItem>
                                    <MenuItem value="dark">Dark</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* API Keys Tab */}
                <TabPanel value={tabValue} index={3}>
                    <Typography variant="h6" gutterBottom>
                        API Keys
                    </Typography>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        API keys are stored locally and are used to authenticate with third-party services.
                    </Alert>
                    <Grid container spacing={2} sx={{ maxWidth: 600 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="OpenAI API Key"
                                name="openaiKey"
                                value={apiKeys.openaiKey}
                                onChange={handleApiKeyChange}
                                margin="normal"
                                type="password"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Anthropic API Key"
                                name="anthropicKey"
                                value={apiKeys.anthropicKey}
                                onChange={handleApiKeyChange}
                                margin="normal"
                                type="password"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="GitHub Personal Access Token"
                                name="githubToken"
                                value={apiKeys.githubToken}
                                onChange={handleApiKeyChange}
                                margin="normal"
                                type="password"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<SaveIcon />}
                                onClick={saveApiKeys}
                            >
                                Save API Keys
                            </Button>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* AI Settings Tab */}
                <TabPanel value={tabValue} index={4}>
                    <Typography variant="h6" gutterBottom>
                        AI Settings
                    </Typography>
                    <Grid container spacing={2} sx={{ maxWidth: 600 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Default AI Provider</InputLabel>
                                <Select
                                    name="defaultProvider"
                                    value={aiSettings.defaultProvider}
                                    label="Default AI Provider"
                                    onChange={handleAISettingChange}
                                >
                                    {AI_PROVIDERS.map((provider) => (
                                        <MenuItem key={provider.value} value={provider.value}>
                                            {provider.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Default AI Model</InputLabel>
                                <Select
                                    name="defaultModel"
                                    value={aiSettings.defaultModel}
                                    label="Default AI Model"
                                    onChange={handleAISettingChange}
                                >
                                    {AI_MODELS[aiSettings.defaultProvider as keyof typeof AI_MODELS]?.map((model) => (
                                        <MenuItem key={model.value} value={model.value}>
                                            {model.label}
                                        </MenuItem>
                                    )) || <MenuItem value="">Select a provider first</MenuItem>}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={aiSettings.enableExplanations}
                                        onChange={handleToggleChange('ai', 'enableExplanations')}
                                        color="primary"
                                    />
                                }
                                label="Enable AI Explanations"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={aiSettings.enableCodeGen}
                                        onChange={handleToggleChange('ai', 'enableCodeGen')}
                                        color="primary"
                                    />
                                }
                                label="Enable AI Code Generation"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<SaveIcon />}
                                onClick={saveAISettings}
                            >
                                Save AI Settings
                            </Button>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Notifications Tab */}
                <TabPanel value={tabValue} index={5}>
                    <Typography variant="h6" gutterBottom>
                        Notification Settings
                    </Typography>
                    <Grid container spacing={2} sx={{ maxWidth: 600 }}>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={notificationSettings.emailNotifications}
                                        onChange={handleToggleChange('notifications', 'emailNotifications')}
                                        color="primary"
                                    />
                                }
                                label="Email Notifications"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={notificationSettings.analysisCompleted}
                                        onChange={handleToggleChange('notifications', 'analysisCompleted')}
                                        color="primary"
                                    />
                                }
                                label="Analysis Completion Notifications"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={notificationSettings.securityAlerts}
                                        onChange={handleToggleChange('notifications', 'securityAlerts')}
                                        color="primary"
                                    />
                                }
                                label="Security Alert Notifications"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={notificationSettings.reportGenerated}
                                        onChange={handleToggleChange('notifications', 'reportGenerated')}
                                        color="primary"
                                    />
                                }
                                label="Report Generation Notifications"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<SaveIcon />}
                                onClick={saveNotificationSettings}
                            >
                                Save Notification Settings
                            </Button>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Integrations Tab */}
                <TabPanel value={tabValue} index={6}>
                    <Typography variant="h6" gutterBottom>
                        Integration Settings
                    </Typography>
                    <Grid container spacing={3}>
                        {/* Jira Integration */}
                        <Grid item xs={12}>
                            <Card>
                                <CardHeader
                                    title="Jira Integration"
                                    titleTypographyProps={{ variant: 'h6' }}
                                    subheader={integrationSettings.jiraEnabled ? "Enabled" : "Disabled"}
                                    action={
                                        <Switch
                                            checked={integrationSettings.jiraEnabled}
                                            onChange={handleToggleChange('integrations', 'jiraEnabled')}
                                            color="primary"
                                        />
                                    }
                                />
                                <Divider />
                                <CardContent>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Jira URL"
                                                name="jiraUrl"
                                                value={integrationSettings.jiraUrl}
                                                onChange={handleIntegrationChange}
                                                disabled={!integrationSettings.jiraEnabled}
                                                margin="normal"
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Jira API Token"
                                                name="jiraToken"
                                                value={integrationSettings.jiraToken}
                                                onChange={handleIntegrationChange}
                                                disabled={!integrationSettings.jiraEnabled}
                                                margin="normal"
                                                type="password"
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Slack Integration */}
                        <Grid item xs={12}>
                            <Card>
                                <CardHeader
                                    title="Slack Integration"
                                    titleTypographyProps={{ variant: 'h6' }}
                                    subheader={integrationSettings.slackEnabled ? "Enabled" : "Disabled"}
                                    action={
                                        <Switch
                                            checked={integrationSettings.slackEnabled}
                                            onChange={handleToggleChange('integrations', 'slackEnabled')}
                                            color="primary"
                                        />
                                    }
                                />
                                <Divider />
                                <CardContent>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Slack Webhook URL"
                                                name="slackWebhook"
                                                value={integrationSettings.slackWebhook}
                                                onChange={handleIntegrationChange}
                                                disabled={!integrationSettings.slackEnabled}
                                                margin="normal"
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* GitHub Integration */}
                        <Grid item xs={12}>
                            <Card>
                                <CardHeader
                                    title="GitHub Integration"
                                    titleTypographyProps={{ variant: 'h6' }}
                                    subheader={integrationSettings.githubEnabled ? "Enabled" : "Disabled"}
                                    action={
                                        <Switch
                                            checked={integrationSettings.githubEnabled}
                                            onChange={handleToggleChange('integrations', 'githubEnabled')}
                                            color="primary"
                                        />
                                    }
                                />
                                <Divider />
                                <CardContent>
                                    <Typography variant="body2" color="text.secondary">
                                        GitHub integration uses the Personal Access Token configured in the API Keys section.
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<SaveIcon />}
                                onClick={saveIntegrationSettings}
                            >
                                Save Integration Settings
                            </Button>
                        </Grid>
                    </Grid>
                </TabPanel>
            </Paper>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={5000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbarOpen(false)}
                    severity={snackbarSeverity}
                    variant="filled"
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );