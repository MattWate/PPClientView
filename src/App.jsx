import React from 'react';
import { Routes, Route, Link, HashRouter as Router } from 'react-router-dom';

// --- Simplified Diagnostic App ---
// All mock components have been removed to focus on the core routing issue.

export default function App() {
    return (
        <Router>
            {/* STEP 1: Test the Router.
                This div is OUTSIDE the <Routes> block. If you can see this text,
                it means the Router component is working correctly and the problem
                is inside the <Routes> component below. 
            */}
            <div style={{ padding: '2rem', border: '2px solid red', margin: '1rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Router Test Area</h1>
                <p>If you can see this red box, the Router has mounted successfully.</p>
                <nav>
                    <Link to="/" style={{ marginRight: '1rem', color: 'blue' }}>Go to Home</Link>
                    <Link to="/login" style={{ color: 'blue' }}>Go to Login</Link>
                </nav>
            </div>

            {/* STEP 2: Test the Routes.
                This block will only render the correct component if the path matches.
                If you see the red box but not the text below, the issue is with
                how the routes are matching the URL.
            */}
            <div style={{ padding: '2rem', border: '2px solid green', margin: '1rem' }}>
                 <Routes>
                    <Route path="/" element={
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Home Page Route</h2>
                            <p>This component is rendered because the path is "/"</p>
                        </div>
                    } />
                    <Route path="/login" element={
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Login Page Route</h2>
                             <p>This component is rendered because the path is "/login"</p>
                        </div>
                    } />
                </Routes>
            </div>
        </Router>
    );
}

