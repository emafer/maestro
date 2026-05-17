import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './lib/AuthContext'
import Root from './Root'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </React.StrictMode>
)
