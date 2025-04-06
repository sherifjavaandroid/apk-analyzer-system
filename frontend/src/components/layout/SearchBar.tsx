// frontend/src/components/layout/SearchBar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    IconButton,
    TextField,
    InputAdornment,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Typography,
    Popper,
    Grow,
    ClickAwayListener,
    Divider,
    useTheme,
    alpha
} from '@mui/material';
import {
    Search as SearchIcon,
    Close as CloseIcon,
    Android as AndroidIcon,
    GitHub as GitHubIcon,
    Description as DescriptionIcon,
    Security as SecurityIcon,
    Code as CodeIcon,
    History as HistoryIcon
} from '@mui/icons-material';

// Search result type
interface SearchResult {
    id: string;
    title: string;
    description: string;
    type: 'apk' | 'github' | 'report' | 'vulnerability' | 'knowledge';
    url: string;
}

const SearchBar: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const anchorRef = useRef<HTMLDivElement>(null);

    // State
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [expanded, setExpanded] = useState(false);

    // Toggle search box expansion
    const toggleExpanded = () => {
        setExpanded(!expanded);
        if (!expanded) {
            // Focus the input when expanded
            setTimeout(() => {
                const input = document.getElementById('global-search-input');
                if (input) {
                    input.focus();
                }
            }, 100);
        } else {
            // Clear search when collapsed
            setSearchQuery('');
            setOpen(false);
        }
    };

    // Handle input change
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchQuery(value);

        if (value.trim().length > 2) {
            setIsSearching(true);
            setOpen(true);
            // In a real app, you'd make an API call here
            // For now, we'll simulate some results
            setTimeout(() => {
                const mockResults: SearchResult[] = [
                    {
                        id: '1',
                        title: 'Sample APK Analysis',
                        description: 'Analysis of sample.apk from 2023-09-10',
                        type: 'apk',
                        url: '/apk-analysis'
                    },
                    {
                        id: '2',
                        title: 'GitHub Repo Analysis',
                        description: 'Analysis of user/repo from 2023-09-15',
                        type: 'github',
                        url: '/github-analysis'
                    },
                    {
                        id: '3',
                        title: 'Security Report',
                        description: 'Comprehensive security report from 2023-09-20',
                        type: 'report',
                        url: '/reports'
                    },
                    {
                        id: '4',
                        title: 'SQL Injection Vulnerability',
                        description: 'Information about SQL injection vulnerabilities',
                        type: 'vulnerability',
                        url: '/knowledge/vulnerability-guide'
                    }
                ].filter(result =>
                    result.title.toLowerCase().includes(value.toLowerCase()) ||
                    result.description.toLowerCase().includes(value.toLowerCase())
                );

                setSearchResults(mockResults);
                setIsSearching(false);
            }, 500); // Simulate network delay
        } else {
            setOpen(false);
            setSearchResults([]);
            setIsSearching(false);
        }
    };

    // Handle search submission
    const handleSearchSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (searchQuery.trim()) {
            // Add to search history
            setSearchHistory(prev => {
                const newHistory = [searchQuery, ...prev.filter(q => q !== searchQuery)].slice(0, 5);
                // In a real app, you might want to persist this to localStorage
                return newHistory;
            });

            // Navigate to search results page (in a real app)
            // navigate(`/search?q=${encodeURIComponent(searchQuery)}`);

            setOpen(false);
            // Don't clear the query to maintain the UI state
        }
    };

    // Handle clicking a search result
    const handleResultClick = (result: SearchResult) => {
        navigate(result.url);
        setOpen(false);
        setSearchQuery('');
        setExpanded(false);
    };

    // Close dropdown when clicking away
    const handleClickAway = () => {
        setOpen(false);
    };

    // Get icon based on result type
    const getResultIcon = (type: string) => {
        switch (type) {
            case 'apk':
                return <AndroidIcon color="primary" />;
            case 'github':
                return <GitHubIcon color="secondary" />;
            case 'report':
                return <DescriptionIcon color="info" />;
            case 'vulnerability':
                return <SecurityIcon color="error" />;
            case 'knowledge':
                return <CodeIcon color="success" />;
            default:
                return <SearchIcon />;
        }
    };

    // Clear search
    const handleClearSearch = () => {
        setSearchQuery('');
        setOpen(false);
    };

    return (
        <Box
            sx={{
                position: 'relative',
                flexGrow: { xs: 0, sm: 1 },
                mx: { xs: 0, sm: 2 },
                maxWidth: { xs: 'auto', sm: 500 }
            }}
            ref={anchorRef}
        >
            {expanded ? (
                <TextField
                    id="global-search-input"
                    placeholder="Search for APK analyses, GitHub repos, reports..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={(e) => e.key === 'Escape' && toggleExpanded()}
                    autoFocus
                    fullWidth
                    size="small"
                    sx={{
                        backgroundColor: alpha(theme.palette.common.white, 0.15),
                        borderRadius: 1,
                        '&:hover': {
                            backgroundColor: alpha(theme.palette.common.white, 0.25),
                        },
                        '& .MuiOutlinedInput-root': {
                            color: 'inherit',
                            '& fieldset': {
                                borderColor: 'transparent',
                            },
                            '&:hover fieldset': {
                                borderColor: 'transparent',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: 'transparent',
                            },
                        },
                        '& .MuiInputBase-input': {
                            color: 'inherit',
                        }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: 'inherit' }} />
                            </InputAdornment>
                        ),
                        endAdornment: searchQuery && (
                            <InputAdornment position="end">
                                <IconButton
                                    size="small"
                                    onClick={handleClearSearch}
                                    sx={{ color: 'inherit' }}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />
            ) : (
                <IconButton color="inherit" onClick={toggleExpanded}>
                    <SearchIcon />
                </IconButton>
            )}

            <Popper
                open={open}
                anchorEl={anchorRef.current}
                placement="bottom-start"
                transition
                style={{ zIndex: theme.zIndex.modal, width: anchorRef.current?.clientWidth }}
            >
                {({ TransitionProps }) => (
                    <Grow {...TransitionProps}>
                        <Paper sx={{ mt: 1, boxShadow: theme.shadows[8], width: '100%' }}>
                            <ClickAwayListener onClickAway={handleClickAway}>
                                <Box component="form" onSubmit={handleSearchSubmit}>
                                    {isSearching ? (
                                        <Box sx={{ p: 2, textAlign: 'center' }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Searching...
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <>
                                            {searchResults.length > 0 ? (
                                                <List>
                                                    {searchResults.map((result) => (
                                                        <ListItem
                                                            key={result.id}
                                                            button
                                                            onClick={() => handleResultClick(result)}
                                                        >
                                                            <ListItemIcon>
                                                                {getResultIcon(result.type)}
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={result.title}
                                                                secondary={result.description}
                                                                primaryTypographyProps={{ variant: 'body2' }}
                                                                secondaryTypographyProps={{ variant: 'caption' }}
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            ) : searchQuery.length > 0 ? (
                                                <Box sx={{ p: 2, textAlign: 'center' }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        No results found
                                                    </Typography>
                                                </Box>
                                            ) : searchHistory.length > 0 ? (
                                                <>
                                                    <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block' }}>
                                                        Recent Searches
                                                    </Typography>
                                                    <List>
                                                        {searchHistory.map((query, index) => (
                                                            <ListItem
                                                                key={index}
                                                                button
                                                                onClick={() => setSearchQuery(query)}
                                                                dense
                                                            >
                                                                <ListItemIcon>
                                                                    <HistoryIcon fontSize="small" />
                                                                </ListItemIcon>
                                                                <ListItemText
                                                                    primary={query}
                                                                    primaryTypographyProps={{ variant: 'body2' }}
                                                                />
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                </>
                                            ) : null}
                                        </>
                                    )}
                                </Box>
                            </ClickAwayListener>
                        </Paper>
                    </Grow>
                )}
            </Popper>
        </Box>
    );
};

export default SearchBar;