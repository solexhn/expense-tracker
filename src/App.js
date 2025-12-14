import { useState, useEffect } from 'react';
import { FiMoon, FiSun } from 'react-icons/fi';
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
import UpdateBanner from './components/UpdateBanner/UpdateBanner';
import './App.css';

function App() {
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('dashboard');
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

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="tabs">
              <div className="tabs-list">
                <button className={`tabs-trigger ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
                <button className={`tabs-trigger ${activeTab === 'analisis' ? 'active' : ''}`} onClick={() => setActiveTab('analisis')}>Análisis</button>
                <button className={`tabs-trigger ${activeTab === 'finanzas' ? 'active' : ''}`} onClick={() => setActiveTab('finanzas')}>Finanzas</button>
                <button className={`tabs-trigger ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')}>Configuración</button>
              </div>
            </div>
            <button className="btn btn-icon" onClick={() => setIsDark(!isDark)}>
              {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        {activeTab === 'dashboard' && <div className="tab-panel"><Dashboard key={updateTrigger} /></div>}
        {activeTab === 'analisis' && (
          <div className="tab-panel">
            <div className="container space-y-6">
              <Timeline updateTrigger={updateTrigger} />
              <FinancialAnalysis updateTrigger={updateTrigger} />
            </div>
          </div>
        )}
        {activeTab === 'finanzas' && (
          <div className="tab-panel">
            <div className="container space-y-6">
              <BaseIncomeConfig onConfigUpdate={handleUpdate} />
              <IncomeForm onIncomeAdded={handleUpdate} />
              <IncomeList updateTrigger={updateTrigger} onListChange={handleUpdate} />
              <RecurringExpenseForm onExpenseAdded={handleUpdate} />
              <RecurringExpenseList updateTrigger={updateTrigger} onListChange={handleUpdate} />
              <ExpenseForm onExpenseAdded={handleUpdate} />
              <ExpenseList updateTrigger={updateTrigger} onListChange={handleUpdate} />
            </div>
          </div>
        )}
        {activeTab === 'config' && (
          <div className="tab-panel">
            <div className="container"><Backup onDataRestored={handleUpdate} /></div>
          </div>
        )}
      </main>
      <UpdateBanner />
    </div>
  );
}

export default App;
