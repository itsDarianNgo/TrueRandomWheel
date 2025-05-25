// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/global.css'; // Import Tailwind global styles

import { Provider } from 'react-redux'; // Added
import { store } from './store';      // Added

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Provider store={store}> {/* Added Redux Provider */}
            <App />
        </Provider>
    </StrictMode>,
);