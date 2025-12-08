import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard/Dashboard';
import Timeline from './components/Timeline/Timeline';
import FinancialAnalysis from './components/FinancialAnalysis/FinancialAnalysis';
import BaseIncomeConfig from './components/BaseIncomeConfig/BaseIncomeConfig';
import RecurringExpenseForm from './components/RecurringExpenseForm/RecurringExpenseForm';
import RecurringExpenseList from './components/RecurringExpenseList/RecurringExpenseList';
import ExpenseForm from './components/ExpenseForm/ExpenseForm';
import ExpenseList from './components/ExpenseList/ExpenseList';
import IncomeForm from './components/IncomeForm/IncomeForm';
import IncomeList from './components/IncomeList/IncomeList';
import Backup from './components/Backup/Backup';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Moon, Sun } from 'lucide-react';
import { Button } from './components/ui/button';

function App() {
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const handleUpdate = () => {
    setUpdateTrigger(prev => prev + 1);
  };

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Tabs defaultValue="dashboard" className="flex-1">
              <TabsList className="w-full justify-start rounded-none h-12 md:h-16 bg-transparent border-b-0 gap-1 overflow-x-auto">
                <TabsTrigger
                  value="dashboard"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-base px-4 py-3 h-full"
                >
                  Dashboard
                </TabsTrigger>
                <TabsTrigger
                  value="analisis"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-base md:text-lg px-4 py-3 h-full"
                >
                  Análisis
                </TabsTrigger>
                <TabsTrigger
                  value="finanzas"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-base md:text-lg px-4 py-3 h-full"
                >
                  Finanzas
                </TabsTrigger>
                <TabsTrigger
                  value="config"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-base px-4 py-3 h-full"
                >
                  Configuración
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="mt-0">
                <Dashboard key={updateTrigger} />
              </TabsContent>

              <TabsContent value="analisis" className="mt-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                  {/* Cronograma + Análisis financiero */}
                  <Timeline updateTrigger={updateTrigger} />
                  <FinancialAnalysis updateTrigger={updateTrigger} />
                </div>
              </TabsContent>

              <TabsContent value="finanzas" className="mt-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
                  {/* Ingresos */}
                  <div className="space-y-6">
                    <BaseIncomeConfig onConfigUpdate={handleUpdate} />
                    <IncomeForm onIncomeAdded={handleUpdate} />
                    <IncomeList updateTrigger={updateTrigger} onListChange={handleUpdate} />
                  </div>

                  {/* Gastos Fijos */}
                  <div className="space-y-6">
                    <RecurringExpenseForm onExpenseAdded={handleUpdate} />
                    <RecurringExpenseList updateTrigger={updateTrigger} onListChange={handleUpdate} />
                  </div>

                  {/* Gastos Variables */}
                  <div className="space-y-6">
                    <ExpenseForm onExpenseAdded={handleUpdate} />
                    <ExpenseList updateTrigger={updateTrigger} onListChange={handleUpdate} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="config" className="mt-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                  <Backup onDataRestored={handleUpdate} />
                </div>
              </TabsContent>
            </Tabs>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="shrink-0"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;