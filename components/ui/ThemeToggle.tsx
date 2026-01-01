
import React, { useId } from 'react';

interface Props {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeToggle: React.FC<Props> = ({ isDarkMode, toggleTheme }) => {
  const id = useId();
  
  return (
    <label htmlFor={id} className="toggle" title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
      <input 
        id={id}
        type="checkbox" 
        className="input switch-input" 
        checked={isDarkMode} 
        onChange={toggleTheme} 
      />
      <div className="icon icon--moon">
        <i className="fa-solid fa-moon"></i>
      </div>
      <div className="icon icon--sun">
        <i className="fa-solid fa-sun"></i>
      </div>
    </label>
  );
};

export default ThemeToggle;
