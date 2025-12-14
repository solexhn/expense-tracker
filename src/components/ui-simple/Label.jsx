export const Label = ({ children, htmlFor, className = '' }) => {
  return (
    <label htmlFor={htmlFor} className={`label ${className}`}>
      {children}
    </label>
  );
};
