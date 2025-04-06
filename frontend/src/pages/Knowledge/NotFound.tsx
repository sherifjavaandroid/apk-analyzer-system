// frontend/src/pages/Error/NotFound.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Container,
    Paper,
    useTheme
} from '@mui/material';
import {
    SentimentDissatisfied as SadIcon,
    Home as HomeIcon
} from '@mui/icons-material';

const NotFound: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <Container maxWidth="md" sx={{ py: 8 }}>
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: 2,
                    backgroundColor: theme.palette.background.paper
                }}
            >
                <SadIcon sx={{ fontSize: 80, color: theme.palette.primary.main, mb: 2 }} />

                <Typography variant="h2" gutterBottom>
                    404
                </Typography>

                <Typography variant="h4" gutterBottom>
                    Page Not Found
                </Typography>

                <Typography variant="body1" paragraph color="text.secondary">
                    The page you are looking for might have been removed, had its name changed,
                    or is temporarily unavailable.
                </Typography>

                <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<HomeIcon />}
                    onClick={handleGoHome}
                    sx={{ mt: 3 }}
                >
                    Back to Home
                </Button>
            </Paper>
        </Container>
    );
};

export default NotFound;