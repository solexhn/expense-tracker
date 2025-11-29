import { useState } from 'react';
import Dashboard from './components/Dashboard/Dashboard';
import ConfigForm from './components/ConfigForm/ConfigForm';
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
      <div className="border-b">
        <div className="container mx-auto">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="w-full justify-start rounded-none h-12 bg-transparent border-b-0">
              <TabsTrigger value="dashboard" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="config" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Configuración
              </TabsTrigger>
              <TabsTrigger value="gastos-fijos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Gastos Fijos
              </TabsTrigger>
              <TabsTrigger value="gastos-variables" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Gastos Variables
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-0">
              <Dashboard key={updateTrigger} />
            </TabsContent>

            <TabsContent value="config" className="mt-0">
              <div className="container mx-auto p-6 space-y-6">
                <ConfigForm onConfigUpdate={handleUpdate} />
                <IncomeForm onIncomeAdded={handleUpdate} />
                <IncomeList updateTrigger={updateTrigger} onListChange={handleUpdate} />
                <Backup onDataRestored={handleUpdate} />
              </div>
            </TabsContent>

            <TabsContent value="gastos-fijos" className="mt-0">
              <div className="container mx-auto p-6 space-y-6">
                <RecurringExpenseForm onExpenseAdded={handleUpdate} />
                <RecurringExpenseList updateTrigger={updateTrigger} onListChange={handleUpdate} />
              </div>
            </TabsContent>

            <TabsContent value="gastos-variables" className="mt-0">
              <div className="container mx-auto p-6 space-y-6">
                <ExpenseForm onExpenseAdded={handleUpdate} />
                <ExpenseList updateTrigger={updateTrigger} onListChange={handleUpdate} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default App;