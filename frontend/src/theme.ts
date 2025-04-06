// frontend/src/theme.ts
import { createTheme, ThemeOptions } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

// Declare module augmentation for custom palette colors
declare module '@mui/material/styles' {
    interface Palette {
        customColors: {
            success: string;
            warning: string;
            danger: string;
            info: string;
            primaryLight: string;
            primaryDark: string;
            secondaryLight: string;
            secondaryDark: string;
            bgLight: string;
            bgDark: string;
        };
        severity: {
            critical: string;
            high: string;
            medium: string;
            low: string;
            info: string;
        };
    }

    interface PaletteOptions {
        customColors?: {
            success?: string;
            warning?: string;
            danger?: string;
            info?: string;
            primaryLight?: string;
            primaryDark?: string;
            secondaryLight?: string;
            secondaryDark?: string;
            bgLight?: string;
            bgDark?: string;
        };
        severity?: {
            critical?: string;
            high?: string;
            medium?: string;
            low?: string;
            info?: string;
        };
    }
}

// Base theme options
const baseThemeOptions: ThemeOptions = {
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontSize: '2.5rem',
            fontWeight: 600,
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 600,
        },
        h3: {
            fontSize: '1.75rem',
            fontWeight: 600,
        },
        h4: {
            fontSize: '1.5rem',
            fontWeight: 500,
        },
        h5: {
            fontSize: '1.25rem',
            fontWeight: 500,
        },
        h6: {
            fontSize: '1rem',
            fontWeight: 500,
        },
        subtitle1: {
            fontSize: '1rem',
            fontWeight: 400,
        },
        subtitle2: {
            fontSize: '0.875rem',
            fontWeight: 500,
        },
        body1: {
            fontSize: '0.875rem',
        },
        body2: {
            fontSize: '0.75rem',
        },
        button: {
            textTransform: 'none',
            fontWeight: 500,
        },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    borderRadius: 8,
                    boxShadow: 'none',
                    padding: '8px 16px',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                },
                sizeLarge: {
                    padding: '12px 24px',
                    fontSize: '1rem',
                },
                sizeSmall: {
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
                },
            },
        },
        MuiCardHeader: {
            styleOverrides: {
                root: {
                    padding: '16px 24px',
                },
            },
        },
        MuiCardContent: {
            styleOverrides: {
                root: {
                    padding: '24px',
                },
            },
        },
        MuiCardActions: {
            styleOverrides: {
                root: {
                    padding: '16px 24px',
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    fontSize: '0.875rem',
                    padding: '12px 16px',
                },
                head: {
                    fontWeight: 600,
                },
            },
        },
    },
};

// Light theme options
const lightThemeOptions: ThemeOptions = {
    ...baseThemeOptions,
    palette: {
        mode: 'light' as PaletteMode,
        primary: {
            main: '#3F51B5',
            light: '#757de8',
            dark: '#002984',
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#536DFE',
            light: '#8399FE',
            dark: '#3D5AFE',
            contrastText: '#FFFFFF',
        },
        error: {
            main: '#F44336',
            light: '#E57373',
            dark: '#D32F2F',
        },
        warning: {
            main: '#FF9800',
            light: '#FFB74D',
            dark: '#F57C00',
        },
        info: {
            main: '#2196F3',
            light: '#64B5F6',
            dark: '#1976D2',
        },
        success: {
            main: '#4CAF50',
            light: '#81C784',
            dark: '#388E3C',
        },
        grey: {
            50: '#FAFAFA',
            100: '#F5F5F5',
            200: '#EEEEEE',
            300: '#E0E0E0',
            400: '#BDBDBD',
            500: '#9E9E9E',
            600: '#757575',
            700: '#616161',
            800: '#424242',
            900: '#212121',
        },
        background: {
            default: '#F8F9FA',
            paper: '#FFFFFF',
        },
        divider: 'rgba(0, 0, 0, 0.12)',
        text: {
            primary: 'rgba(0, 0, 0, 0.87)',
            secondary: 'rgba(0, 0, 0, 0.6)',
            disabled: 'rgba(0, 0, 0, 0.38)',
        },
        customColors: {
            success: '#4CAF50',
            warning: '#FF9800',
            danger: '#F44336',
            info: '#2196F3',
            primaryLight: '#E8EAF6',
            primaryDark: '#303F9F',
            secondaryLight: '#E3F2FD',
            secondaryDark: '#1976D2',
            bgLight: '#F8F9FA',
            bgDark: '#ECEFF1',
        },
        severity: {
            critical: '#d32f2f',
            high: '#f44336',
            medium: '#ff9800',
            low: '#ffc107',
            info: '#2196f3',
        },
    },
};

// Dark theme options
const darkThemeOptions: ThemeOptions = {
    ...baseThemeOptions,
    palette: {
        mode: 'dark' as PaletteMode,
        primary: {
            main: '#536DFE',
            light: '#8399FE',
            dark: '#3D5AFE',
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#7C4DFF',
            light: '#B47CFE',
            dark: '#651FFF',
            contrastText: '#FFFFFF',
        },
        error: {
            main: '#F44336',
            light: '#E57373',
            dark: '#D32F2F',
        },
        warning: {
            main: '#FF9800',
            light: '#FFB74D',
            dark: '#F57C00',
        },
        info: {
            main: '#2196F3',
            light: '#64B5F6',
            dark: '#1976D2',
        },
        success: {
            main: '#4CAF50',
            light: '#81C784',
            dark: '#388E3C',
        },
        grey: {
            50: '#FAFAFA',
            100: '#F5F5F5',
            200: '#EEEEEE',
            300: '#E0E0E0',
            400: '#BDBDBD',
            500: '#9E9E9E',
            600: '#757575',
            700: '#616161',
            800: '#424242',
            900: '#212121',
        },
        background: {
            default: '#121212',
            paper: '#1E1E1E',
        },
        divider: 'rgba(255, 255, 255, 0.12)',
        text: {
            primary: '#FFFFFF',
            secondary: 'rgba(255, 255, 255, 0.7)',
            disabled: 'rgba(255, 255, 255, 0.5)',
        },
        customColors: {
            success: '#4CAF50',
            warning: '#FF9800',
            danger: '#F44336',
            info: '#2196F3',
            primaryLight: '#3D5AFE',
            primaryDark: '#1A237E',
            secondaryLight: '#7C4DFF',
            secondaryDark: '#6200EA',
            bgLight: '#1E1E1E',
            bgDark: '#121212',
        },
        severity: {
            critical: '#d32f2f',
            high: '#f44336',
            medium: '#ff9800',
            low: '#ffc107',
            info: '#2196f3',
        },
    },
    components: {
        ...baseThemeOptions.components,
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundColor: '#1E1E1E',
                    borderRadius: 12,
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
    },
};

// Create themes
export const lightTheme = createTheme(lightThemeOptions);
export const darkTheme = createTheme(darkThemeOptions);