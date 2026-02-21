import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export const PageHeader = ({ title, subtitle, actions, children }: PageHeaderProps) => {
  return (
    <div className="page-header">
      <div className="page-header__row">
        <div className="page-header__title-section">
          <h1 className="page-header__title">{title}</h1>
          {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-header__actions">{actions}</div>}
      </div>
      {children}
    </div>
  );
};
