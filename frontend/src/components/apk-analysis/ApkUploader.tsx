// frontend/src/components/apk-analysis/ApkUploader.tsx
import React, { useState, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    LinearProgress,
    Alert,
    useTheme,
    Divider,
    Stack,
    Chip
} from '@mui/material';
import {
    CloudUpload,
    Android,
    CheckCircleOutline,
    ErrorOutline
} from '@mui/icons-material';

interface ApkUploaderProps {
    onFileSelected: (file: File) => void;
    maxSize: number;
    allowedTypes: string[];
    uploading: boolean;
    progress: number;
}

const ApkUploader: React.FC<ApkUploaderProps> = ({
                                                     onFileSelected,
                                                     maxSize,
                                                     allowedTypes,
                                                     uploading,
                                                     progress
                                                 }) => {
    const theme = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [dragActive, setDragActive] = useState<boolean>(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Format file size
    const formatSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Validate file
    const validateFile = (file: File): boolean => {
        // Check file type
        if (!allowedTypes.includes(file.type)) {
            setError(`Invalid file type. Only APK files are allowed.`);
            return false;
        }

        // Check file size
        if (file.size > maxSize) {
            setError(`File is too large. Maximum size is ${formatSize(maxSize)}.`);
            return false;
        }

        return true;
    };

    // Handle file selection
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);

        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];

            if (validateFile(file)) {
                setSelectedFile(file);
            }
        }
    };

    // Handle file drop
    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setDragActive(false);
        setError(null);

        if (event.dataTransfer.files && event.dataTransfer.files[0]) {
            const file = event.dataTransfer.files[0];

            if (validateFile(file)) {
                setSelectedFile(file);
            }
        }
    };

    // Handle drag events
    const handleDrag = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (event.type === 'dragenter' || event.type === 'dragover') {
            setDragActive(true);
        } else if (event.type === 'dragleave') {
            setDragActive(false);
        }
    };

    // Trigger file input click
    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Submit file for analysis
    const handleSubmit = () => {
        if (selectedFile) {
            setError(null);
            onFileSelected(selectedFile);
        }
    };

    // Cancel file selection
    const handleCancel = () => {
        setSelectedFile(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Paper
            sx={{
                p: 3,
                width: '100%',
                height: '100%',
                minHeight: 400,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Typography variant="h6" gutterBottom>
                APK Upload and Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Upload an Android Package (APK) file to analyze its security, performance, and technical details.
            </Typography>

            <Divider sx={{ mb: 3 }} />

            {/* Error alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Upload progress */}
            {uploading && (
                <Box sx={{ width: '100%', mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                        Uploading and analyzing...
                    </Typography>
                    <LinearProgress variant="determinate" value={progress} sx={{ mb: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                        {progress}% complete
                    </Typography>
                </Box>
            )}

            {/* File selected view */}
            {selectedFile && !uploading && (
                <Box sx={{ mb: 3 }}>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            backgroundColor: theme.palette.background.default,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                            <Android color="primary" />
                            <Typography variant="body1" fontWeight={500}>
                                {selectedFile.name}
                            </Typography>
                            <Chip
                                label={formatSize(selectedFile.size)}
                                size="small"
                                variant="outlined"
                            />
                        </Stack>

                        <CheckCircleOutline sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1 }} />
                        <Typography variant="body2" color="text.secondary" textAlign="center">
                            File ready for analysis
                        </Typography>

                        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                            <Button variant="outlined" onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button variant="contained" onClick={handleSubmit}>
                                Start Analysis
                            </Button>
                        </Stack>
                    </Paper>
                </Box>
            )}

            {/* Drag and drop area */}
            {!selectedFile && !uploading && (
                <Box
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `2px dashed ${dragActive ? theme.palette.primary.main : theme.palette.divider}`,
                        borderRadius: 2,
                        backgroundColor: dragActive
                            ? `${theme.palette.primary.main}10`
                            : theme.palette.background.default,
                        p: 4,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                    }}
                    onClick={handleUploadClick}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".apk"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />

                    <CloudUpload
                        sx={{
                            fontSize: 60,
                            color: dragActive ? theme.palette.primary.main : theme.palette.text.secondary,
                            mb: 2,
                        }}
                    />

                    <Typography variant="h6" gutterBottom align="center">
                        Drag & Drop APK file here
                    </Typography>

                    <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                        or
                    </Typography>

                    <Button variant="contained" startIcon={<CloudUpload />} sx={{ mt: 2 }}>
                        Browse Files
                    </Button>

                    <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 2 }}>
                        Maximum file size: {formatSize(maxSize)}
                    </Typography>
                </Box>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Help section */}
            <Box>
                <Typography variant="body2" color="text.secondary">
                    <strong>Note:</strong> The analysis will scan the APK for security vulnerabilities,
                    performance issues, and technical details. The scan may take a few minutes to complete.
                </Typography>
            </Box>
        </Paper>
    );
};

export default ApkUploader;