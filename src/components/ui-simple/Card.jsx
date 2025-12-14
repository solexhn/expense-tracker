export const Card = ({ children, className = '' }) => {
  return <div className={`card ${className}`}>{children}</div>;
};

export const CardHeader = ({ children, className = '' }) => {
  return <div className={`card-header ${className}`}>{children}</div>;
};

export const CardTitle = ({ children, className = '' }) => {
  return <h3 className={`card-title ${className}`}>{children}</h3>;
};

export const CardDescription = ({ children, className = '' }) => {
  return <p className={`text-sm text-secondary ${className}`}>{children}</p>;
};

export const CardContent = ({ children, className = '' }) => {
  return <div className={className}>{children}</div>;
};
