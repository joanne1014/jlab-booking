import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Admin from './Admin';

const path = window.location.pathname;
const isAdmin = path.startsWith('/admin');

function Layout() {
  if (isAdmin) return <Admin />;
  return (
    <>
      <App />
      <div style={{
        textAlign: 'center',
        padding: '20px',
        borderTop: '1px solid #dcd4c8',
        background: '#f4ede4'
      }}>
        <a
          href="/admin"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '0.52rem',
            color: '#c0b8aa',
            textDecoration: 'none',
            letterSpacing: '0.15em',
            fontStyle: 'italic',
            transition: 'color 0.3s'
          }}
          onMouseEnter={e => e.target.style.color = '#8a7c68'}
          onMouseLeave={e => e.target.style.color = '#c0b8aa'}
        >
          STAFF LOGIN
        </a>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Layout />
  </React.StrictMode>
);
