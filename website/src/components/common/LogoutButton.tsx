import { useAuth } from '../../contexts/AuthContext';

interface LogoutButtonProps {
  className?: string;
  onClick?: () => void;
}

export const LogoutButton = ({ className, onClick }: LogoutButtonProps) => {
  const { logout } = useAuth();

  const handleLogout = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    logout();
    if (onClick) onClick();
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleLogout}
    >
      Logout
    </button>
  );
};
