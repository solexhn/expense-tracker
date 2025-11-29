import { useState } from 'react';
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

function App() {
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const handleUpdate = () => {
    setUpdateTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="w-full justify-start rounded-none h-16 bg-transparent border-b-0 gap-1 overflow-x-auto">
              <TabsTrigger
                value="dashboard"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-base px-4 py-3 h-full"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="cronograma"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-base px-4 py-3 h-full"
              >
                Cronograma
              </TabsTrigger>
              <TabsTrigger
                value="analisis"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-base px-4 py-3 h-full"
              >
                Análisis
              </TabsTrigger>
              <TabsTrigger
                value="ingresos"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-base px-4 py-3 h-full"
              >
                Ingresos
              </TabsTrigger>
              <TabsTrigger
                value="gastos-fijos"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-base px-4 py-3 h-full"
              >
                Gastos Fijos
              </TabsTrigger>
              <TabsTrigger
                value="gastos-variables"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-base px-4 py-3 h-full"
              >
                Gastos Variables
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

            <TabsContent value="cronograma" className="mt-0">
              <Timeline updateTrigger={updateTrigger} />
            </TabsContent>

            <TabsContent value="analisis" className="mt-0">
              <FinancialAnalysis updateTrigger={updateTrigger} />
            </TabsContent>

            <TabsContent value="ingresos" className="mt-0">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <BaseIncomeConfig onConfigUpdate={handleUpdate} />
                <IncomeForm onIncomeAdded={handleUpdate} />
                <IncomeList updateTrigger={updateTrigger} onListChange={handleUpdate} />
              </div>
            </TabsContent>

            <TabsContent value="gastos-fijos" className="mt-0">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <RecurringExpenseForm onExpenseAdded={handleUpdate} />
                <RecurringExpenseList updateTrigger={updateTrigger} onListChange={handleUpdate} />
              </div>
            </TabsContent>

            <TabsContent value="gastos-variables" className="mt-0">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <ExpenseForm onExpenseAdded={handleUpdate} />
                <ExpenseList updateTrigger={updateTrigger} onListChange={handleUpdate} />
              </div>
            </TabsContent>

            <TabsContent value="config" className="mt-0">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <Backup onDataRestored={handleUpdate} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default App;