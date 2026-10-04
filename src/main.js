import './styles/main.css';
import './styles/pages.css';
import { setupNavigation } from './ui/navigation.js';

setupNavigation();
if (document.body.dataset.page === 'weekly') void import('./app.js');

if (document.body.dataset.page === 'feedback') void import('./ui/feedback.js');

if (document.body.dataset.page === 'home') void import('./ui/home-motion.js');
