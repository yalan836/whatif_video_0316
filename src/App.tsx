/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useUIStore } from './store/uiStore';
import { LanguageSetup } from './components/setup/LanguageSetup';
import { ApiSetup } from './components/setup/ApiSetup';
import { GameSetup } from './components/setup/GameSetup';
import { MainGameUI } from './components/game/MainGameUI';

export default function App() {
  const setupStep = useUIStore(state => state.setupStep);

  if (setupStep === 'language') {
    return <LanguageSetup />;
  }

  if (setupStep === 'api') {
    return <ApiSetup />;
  }

  if (setupStep !== 'playing') {
    return <GameSetup />;
  }

  return <MainGameUI />;
}
