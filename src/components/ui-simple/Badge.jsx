export const Badge = ({ children, variant = 'secondary', className = '' }) => {
  const classes = ['badge'];

  if (variant === 'success') classes.push('badge-success');
  else if (variant === 'destructive' || variant === 'danger') classes.push('badge-danger');
  else if (variant === 'warning') classes.push('badge-warning');
  else if (variant === 'info') classes.push('badge-info');
  else classes.push('badge-secondary');

  if (className) classes.push(className);

  return (
    <span className={classes.join(' ')}>
      {children}
    </span>
  );
};
