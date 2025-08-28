import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';

import { KanbanBoard } from './KanbanBoard';

describe('KanbanBoard', () => {
  it('renders initial columns and tasks', () => {
    render(<KanbanBoard />);
    // Column titles
    expect(screen.getByText('Backlog')).toBeInTheDocument();
    expect(screen.getByText('Zu erledigen')).toBeInTheDocument();
    expect(screen.getByText('In Bearbeitung')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    // Task titles
    expect(
      screen.getByText('Qualitätskontrolle Metallteile'),
    ).toBeInTheDocument();
    expect(screen.getByText('CNC Maschine kalibrieren')).toBeInTheDocument();
    expect(screen.getByText('Dashboard überarbeiten')).toBeInTheDocument();
  });
});
