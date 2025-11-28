import React from 'react';
import './Navigation.css';

const Navigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'config', label: 'Configuración', icon: '⚙️' },
    { id: 'gastos-fijos', label: 'Gastos Fijos', icon: '📅' },
    { id: 'gastos-variables', label: 'Gastos Variables', icon: '💳' }
  ];

  return (
    <nav className="navigation">
      <div className="nav-header">
        <h1>💰 Control de Gastos</h1>
      </div>
      <div className="nav-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;