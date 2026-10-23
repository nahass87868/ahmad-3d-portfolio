import './styles/index.css';
import { start } from './app';
import { runIntro } from './features/intro';

// The intro curtain is part of the prerendered HTML and is already on screen; count up, then boot the app
// as the curtain lifts so the hero animation plays on a visible page.
void runIntro().then(start);
