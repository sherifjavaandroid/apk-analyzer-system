// frontend/src/components/reports/AnalysisComparisonPanel.tsx
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
    Tabs,
    Tab,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    IconButton,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Slider,
    useTheme,
    SelectChangeEvent
} from '@mui/material';
import {
    CompareArrows as CompareArrowsIcon,
    Security as SecurityIcon,
    Speed as SpeedIcon,
    Code as CodeIcon,
    PrivacyTip as PrivacyTipIcon,
    Battery5Bar as BatteryIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    FileDownload as FileDownloadIcon,
    Print as PrintIcon,
    Share as ShareIcon
} from '@mui/icons-material';
import {
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

// Types
interface AnalysisResult {
    id: string;
    name: string;
    type: 'apk' | 'github';
    scores: {
        security: number;
        performance: number;
        quality: number;
        privacy?: number;