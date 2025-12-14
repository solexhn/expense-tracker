export const Button = ({ children, onClick, variant = 'primary', size = 'default', className = '', ...props }) => {
  const classes = ['btn'];

  if (variant === 'primary') classes.push('btn-primary');
  else if (variant === 'danger' || variant === 'destructive') classes.push('btn-danger');
  else if (variant === 'secondary' || variant === 'ghost') classes.push('btn-secondary');

  if (size === 'icon') classes.push('btn-icon');

  if (className) classes.push(className);

  return (
    <button className={classes.join(' ')} onClick={onClick} {...props}>
      {children}
    </button>
  );
};
