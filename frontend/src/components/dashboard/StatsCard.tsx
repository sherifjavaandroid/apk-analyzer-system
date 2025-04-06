// frontend/src/components/dashboard/StatsCard.tsx
import React from 'react';
import {
    Box,
    Typography,
    Paper,
    IconButton,
    Chip,
    useTheme
} from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';

interface StatsCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    trend?: 'up' | 'down';
    trendValue?: string;
    onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({
                                                 title,
                                                 value,
                                                 icon,
                                                 color,
                                                 trend,
                                                 trendValue,
                                                 onClick
                                             }) => {
    const theme = useTheme();

    return (
        <Paper
            sx={{
                p: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderLeft: `4px solid ${color}`,
                transition: 'transform 0.2s',
                cursor: onClick ? 'pointer' : 'default',
                '&:hover': {
                    transform: onClick ? 'translateY(-4px)' : 'none',
                    boxShadow: onClick ? 4 : 1
                }
            }}
            onClick={onClick}
            elevation={1}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={500} sx={{ flexGrow: 1 }}>
                    {title}
                </Typography>
                <Box
                    sx={{
                        backgroundColor: `${color}20`,
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: color
                    }}
                >
                    {icon}
                </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {value}
                </Typography>
                {trend && trendValue && (
                    <Chip
                        size="small"
                        label={trendValue}
                        icon={trend === 'up' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
                        sx={{
                            ml: 1,
                            mb: 0.5,
                            backgroundColor: trend === 'up' ? `${theme.palette.success.main}20` : `${theme.palette.error.main}20`,
                            color: trend === 'up' ? theme.palette.success.main : theme.palette.error.main,
                            '& .MuiChip-icon': {
                                color: trend === 'up' ? theme.palette.success.main : theme.palette.error.main
                            }
                        }}
                    />
                )}
            </Box>
        </Paper>
    );
};

export default StatsCard;