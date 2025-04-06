// frontend/src/components/common/CircularProgressWithLabel.tsx
import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

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
    return (
        <Box position="relative" display="inline-flex">
            <CircularProgress
                variant="determinate"
                value={value}
                size={size}
                thickness={thickness}
                sx={{ color: color }}
            />
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
                    variant="h5"
                    component="div"
                    color={color || 'text.primary'}
                    sx={{ fontWeight: 'bold' }}
                >
                    {value}
                </Typography>
            </Box>
        </Box>
    );
};

export default CircularProgressWithLabel;