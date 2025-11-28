import React, { useState } from 'react';
import Navigation from './components/Navigation/Navigation';
import Dashboard from './components/Dashboard/Dashboard';
import ConfigForm from './components/ConfigForm/ConfigForm';
import RecurringExpenseForm from './components/RecurringExpenseForm/RecurringExpenseForm';
import RecurringExpenseList from './components/RecurringExpenseList/RecurringExpenseList';
import ExpenseForm from './components/ExpenseForm/ExpenseForm';
import ExpenseList from './components/ExpenseList/ExpenseList';
import IncomeForm from './components/IncomeForm/IncomeForm';
import IncomeList from './components/IncomeList/IncomeList';
import Backup from './components/Backup/Backup';
import './App.css';

function App() {
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleUpdate = () => {
    setUpdateTrigger(prev => prev + 1);
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return <Dashboard key={updateTrigger} />;
      
      case 'config':
        return (
          <>
            <ConfigForm onConfigUpdate={handleUpdate} />
            <IncomeForm onIncomeAdded={handleUpdate} />
            <IncomeList updateTrigger={updateTrigger} onListChange={handleUpdate} />
            <Backup onDataRestored={handleUpdate} />
          </>
        );
      
      case 'gastos-fijos':
        return (
          <>
            <RecurringExpenseForm onExpenseAdded={handleUpdate} />
            <RecurringExpenseList updateTrigger={updateTrigger} onListChange={handleUpdate} />
          </>
        );
      
      case 'gastos-variables':
        return (
          <>
            <ExpenseForm onExpenseAdded={handleUpdate} />
            <ExpenseList updateTrigger={updateTrigger} onListChange={handleUpdate} />
          </>
        );
      
      default:
        return <Dashboard key={updateTrigger} />;
    }
  };

  return (
    <div className="App">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="content">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;