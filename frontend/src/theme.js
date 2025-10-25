import { createTheme } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";

// Create a professional theme with solid colors only
const theme = createTheme({
  // Color palette - Solid colors for clean, professional look
  palette: {
    primary: {
      main: "#1565c0", // Solid dark blue as requested
      dark: "#0d47a1", // Darker shade for hover states (no gradient)
      light: "#1976d2", // Slightly lighter for variants
      contrastText: "#ffffff", // White text on primary
    },
    secondary: {
      main: "#ffffff", // White as secondary
      dark: "#f5f5f5", // Slightly darker white for variants
      contrastText: "#000000", // Black text on secondary
    },
    background: {
      default: "#ffffff", // White background
      paper: "#ffffff", // White paper background
    },
    text: {
      primary: "#000000", // Black text for high contrast
      secondary: "#424242", // Dark gray for secondary text
    },
    // Override default Material-UI palettes with custom solid colors
    error: {
      main: "#d32f2f",
    },
    warning: {
      main: "#f57c00",
    },
    info: {
      main: "#0288d1",
    },
    success: {
      main: "#388e3c",
    },
  },

  // Typography with clear hierarchy and consistent spacing
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2.5rem", // 40px
      fontWeight: 300,
      lineHeight: 1.2,
      marginBottom: "1rem", // 16px spacing
    },
    h2: {
      fontSize: "2rem", // 32px
      fontWeight: 400,
      lineHeight: 1.25,
      marginBottom: "0.875rem", // 14px spacing
    },
    h3: {
      fontSize: "1.75rem", // 28px
      fontWeight: 400,
      lineHeight: 1.3,
      marginBottom: "0.75rem", // 12px spacing
    },
    h4: {
      fontSize: "1.5rem", // 24px
      fontWeight: 400,
      lineHeight: 1.35,
      marginBottom: "0.625rem", // 10px spacing
    },
    h5: {
      fontSize: "1.25rem", // 20px
      fontWeight: 400,
      lineHeight: 1.4,
      marginBottom: "0.5rem", // 8px spacing
    },
    h6: {
      fontSize: "1.125rem", // 18px
      fontWeight: 500,
      lineHeight: 1.45,
      marginBottom: "0.5rem", // 8px spacing
    },
    body1: {
      fontSize: "1rem", // 16px
      lineHeight: 1.5,
      marginBottom: "0.5rem", // 8px spacing
    },
    body2: {
      fontSize: "0.875rem", // 14px
      lineHeight: 1.43,
      marginBottom: "0.5rem", // 8px spacing
    },
    button: {
      fontSize: "0.875rem", // 14px
      fontWeight: 500,
      lineHeight: 1.75,
      textTransform: "none", // No uppercase
    },
    caption: {
      fontSize: "0.75rem", // 12px
      lineHeight: 1.66,
    },
  },

  // Spacing based on Material Design standards (multiples of 8px)
  spacing: 8, // Base spacing unit

  // Component overrides for specific styling
  components: {
    // Button overrides - primary dark blue background, white text
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "4px", // Consistent border radius
          padding: "8px 16px", // Comfortable internal padding
          fontSize: "0.875rem",
          fontWeight: 500,
          "&:hover": {
            backgroundColor: "#0d47a1", // Darken on hover (no gradient)
          },
          "&:focus": {
            backgroundColor: "#0d47a1", // Darken on focus
          },
        },
        containedPrimary: {
          backgroundColor: "#1565c0", // Solid dark blue
          color: "#ffffff",
          "&:hover": {
            backgroundColor: "#0d47a1", // Darker shade
          },
        },
        outlinedPrimary: {
          borderColor: "#1565c0",
          color: "#1565c0",
          "&:hover": {
            backgroundColor: "rgba(21, 101, 192, 0.04)", // Subtle hover
            borderColor: "#0d47a1",
          },
        },
      },
    },

    // Input and form element overrides - clean borders, white backgrounds
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#ffffff",
            "& fieldset": {
              borderColor: "#1565c0", // Dark blue border
              borderWidth: "1px",
            },
            "&:hover fieldset": {
              borderColor: "#0d47a1", // Darker on hover
            },
            "&.Mui-focused fieldset": {
              borderColor: "#1565c0",
              borderWidth: "2px",
            },
          },
        },
      },
    },

    // Input base overrides
    MuiInputBase: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          "& .MuiInput-underline:before": {
            borderBottomColor: "#1565c0",
          },
          "& .MuiInput-underline:hover:before": {
            borderBottomColor: "#0d47a1",
          },
          "& .MuiInput-underline:after": {
            borderBottomColor: "#1565c0",
          },
        },
      },
    },

    // Card overrides - white background with subtle shadow
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", // Subtle shadow for elevation
          border: "none", // No borders, just shadow
        },
      },
    },

    // Paper overrides for consistency
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
        },
        elevation1: {
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        },
        elevation2: {
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        },
        elevation3: {
          boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
        },
      },
    },

    // AppBar overrides - will be used for top navigation
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#1565c0", // Solid dark blue instead of gradient
          color: "#ffffff",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
        },
      },
    },

    // Drawer overrides - will be used for sidebar
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#ffffff",
          borderRight: "1px solid #e0e0e0",
        },
      },
    },

    // Global overrides for consistent spacing
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: "16px", // 2 * 8px
          paddingRight: "16px",
        },
      },
    },
  },

  // Shape for consistent border radius
  shape: {
    borderRadius: 4, // Base border radius
  },

  // Shadows for elevation without gradients
  shadows: [
    "none",
    "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)",
    "0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)",
    "0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.10)",
    "0 15px 25px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.05)",
    "0 20px 40px rgba(0, 0, 0, 0.15)",
    // ... rest of default shadows
  ],
});

export default theme;
export { CssBaseline };
