import { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Container,
  Box,
  CssBaseline,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { FiMoon, FiSun } from "react-icons/fi";
import {
  MdDashboard,
  MdQueryStats,
  MdAccountBalance,
  MdSettings
} from "react-icons/md";

import Dashboard from "./components/Dashboard/Dashboard";
import Timeline from "./components/Timeline/Timeline";
import FinancialAnalysis from "./components/FinancialAnalysis/FinancialAnalysis";
import BaseIncomeConfig from "./components/BaseIncomeConfig/BaseIncomeConfig";
import RecurringExpenseForm from "./components/RecurringExpenseForm/RecurringExpenseForm";
import RecurringExpenseList from "./components/RecurringExpenseList/RecurringExpenseList";
import ExpenseForm from "./components/ExpenseForm/ExpenseForm";
import ExpenseList from "./components/ExpenseList/ExpenseList";
import IncomeForm from "./components/IncomeForm/IncomeForm";
import IncomeList from "./components/IncomeList/IncomeList";
import Backup from "./components/Backup/Backup";
import UpdateBanner from "./components/UpdateBanner/UpdateBanner";
import "./App.css";

function App() {
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const theme = createTheme({
    palette: {
      mode: isDark ? "dark" : "light",
      primary: { main: "#10b981" },
      secondary: { main: "#059669" },
    },
    shape: { borderRadius: 10 },
  });

  const handleUpdate = () => setUpdateTrigger((prev) => prev + 1);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", pb: 7 }}>
        {/* AppBar superior simplificado */}
        <AppBar position="static" color="primary" elevation={2}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
              💰 Expense Tracker
            </Typography>
            <IconButton color="inherit" onClick={() => setIsDark(!isDark)} edge="end">
              {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Contenido principal */}
        <Container sx={{ flexGrow: 1, py: 3, mb: 2 }}>
          {activeTab === "dashboard" && <Dashboard key={updateTrigger} />}

          {activeTab === "analisis" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Timeline updateTrigger={updateTrigger} />
              <FinancialAnalysis updateTrigger={updateTrigger} />
            </Box>
          )}

          {activeTab === "finanzas" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <BaseIncomeConfig onConfigUpdate={handleUpdate} />
              <IncomeForm onIncomeAdded={handleUpdate} />
              <IncomeList updateTrigger={updateTrigger} onListChange={handleUpdate} />
              <RecurringExpenseForm onExpenseAdded={handleUpdate} />
              <RecurringExpenseList updateTrigger={updateTrigger} onListChange={handleUpdate} />
              <ExpenseForm onExpenseAdded={handleUpdate} />
              <ExpenseList updateTrigger={updateTrigger} onListChange={handleUpdate} />
            </Box>
          )}

          {activeTab === "config" && (
            <Box>
              <Backup onDataRestored={handleUpdate} />
            </Box>
          )}
        </Container>

        {/* BottomNavigation fija */}
        <Paper
          sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
          elevation={3}
        >
          <BottomNavigation
            value={activeTab}
            onChange={(event, newValue) => setActiveTab(newValue)}
            showLabels
          >
            <BottomNavigationAction
              label="Dashboard"
              value="dashboard"
              icon={<MdDashboard size={24} />}
            />
            <BottomNavigationAction
              label="Análisis"
              value="analisis"
              icon={<MdQueryStats size={24} />}
            />
            <BottomNavigationAction
              label="Finanzas"
              value="finanzas"
              icon={<MdAccountBalance size={24} />}
            />
            <BottomNavigationAction
              label="Config"
              value="config"
              icon={<MdSettings size={24} />}
            />
          </BottomNavigation>
        </Paper>

        <UpdateBanner />
      </Box>
    </ThemeProvider>
  );
}

export default App;
