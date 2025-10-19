import React from 'react';
import ReactDOM from 'react-dom/client';
// CORRECTED: Switched to HashRouter for compatibility with preview environments.
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
// The AuthProvider is commented out as it's not available in this single-file view.
// import { AuthProvider } from './contexts/AuthContext'; 
// The CSS is commented out to prevent build errors.
// import './assets/index.css';

// --- App Component (included directly in this file to make it runnable) ---
function App() {
    // In a real app, this would come from the AuthProvider/useAuth hook.
    const session = null; 
    const profile = null;

    return (
        <div style={{ fontFamily: 'sans-serif', padding: '1rem' }}>
            <h1 style={{fontSize: '2rem', fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem'}}>PristinePoint App</h1>
            <nav style={{ margin: '1rem 0' }}>
                <Link to="/" style={{ marginRight: '1rem', color: 'blue' }}>Go to Home</Link>
                <Link to="/login" style={{ color: 'blue' }}>Go to Login</Link>
            </nav>
            
            {/* The Routes will now render based on the URL hash */}
            <div style={{border: '2px solid green', padding: '1rem'}}>
                <Routes>
                    <Route path="/" element={
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Public Home Page</h2>
                            <p>This is the public landing page route.</p>
                        </div>
                    } />
                    <Route path="/login" element={
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Login Page</h2>
                            <p>This is the client login portal route.</p>
                        </div>
                    } />
                </Routes>
            </div>
        </div>
    );
}

// The root render function now uses HashRouter.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
        {/* <AuthProvider> */}
            <App />
        {/* </AuthProvider> */}
    </HashRouter>
  </React.StrictMode>,
)

