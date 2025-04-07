// frontend/src/components/common/CircularProgressWithLabel.tsx
import React from 'react';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';

interface CircularProgressWithLabelProps {
    value: number;
    size?: number;
    thickness?: number;
    color?: string;
}

const CircularProgressWithLabel: React.FC<CircularProgressWithLabelProps> = ({
                                                                                 value,
                                                                                 size = 100,
                                                                                 thickness = 4,
                                                                                 color
                                                                             }) => {
    const theme = useTheme();

    return (
        <Box position="relative" display="inline-flex">
            <Box
                sx={{
                    position: 'relative',
                    display: 'inline-flex',
                }}
            >
                <CircularProgress
                    variant="determinate"
                    value={100}
                    size={size}
                    thickness={thickness}
                    sx={{ color: theme.palette.grey[200] }}
                />
                <CircularProgress
                    variant="determinate"
                    value={value}
                    size={size}
                    thickness={thickness}
                    sx={{
                        position: 'absolute',
                        left: 0,
                        color: color,
                        top: 0
                    }}
                />
            </Box>
            <Box
                sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography
                    variant="h4"
                    component="div"
                    color={color || 'text.primary'}
                    sx={{ fontWeight: 'bold' }}
                >
                    {Math.round(value)}
                </Typography>
            </Box>
        </Box>
    );
};

export default CircularProgressWithLabel;