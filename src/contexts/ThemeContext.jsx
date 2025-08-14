import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    const isDark = savedTheme ? savedTheme === 'dark' : prefersDark
    setDarkMode(isDark)
    
    // Apply theme to document root
    document.documentElement.classList.toggle('dark-theme', isDark)
    document.body.classList.toggle('dark-mode', isDark)
  }, [])

  const toggleTheme = () => {
    const newTheme = !darkMode
    setDarkMode(newTheme)
    
    // Save preference
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
    
    // Apply theme to document
    document.documentElement.classList.toggle('dark-theme', newTheme)
    document.body.classList.toggle('dark-mode', newTheme)
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { darkMode: newTheme } }))
  }

  const value = {
    darkMode,
    toggleTheme,
    theme: darkMode ? 'dark' : 'light'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeContext