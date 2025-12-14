import { useState } from 'react';

export const Tabs = ({ children, defaultValue, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <div className={`tabs ${className}`} data-active-tab={activeTab}>
      {typeof children === 'function'
        ? children({ activeTab, setActiveTab })
        : children}
    </div>
  );
};

export const TabsList = ({ children, className = '' }) => {
  return <div className={`tabs-list ${className}`}>{children}</div>;
};

export const TabsTrigger = ({ value, children, className = '' }) => {
  const handleClick = (e) => {
    const tabsContainer = e.target.closest('[data-active-tab]');
    if (tabsContainer) {
      const event = new CustomEvent('tab-change', { detail: { value } });
      tabsContainer.dispatchEvent(event);
    }
  };

  return (
    <button
      className={`tabs-trigger ${className}`}
      onClick={handleClick}
      data-value={value}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, className = '' }) => {
  return (
    <div className={`tabs-content ${className}`} data-tab-value={value}>
      {children}
    </div>
  );
};
