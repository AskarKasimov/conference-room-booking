import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { RoomSummaryCard } from '../../src/widgets/room-summary-card';
import { officeFixture, roomFixture } from '../support/handlers';

it('renders an SVG icon for the capacity and every room feature', () => {
  render(
    <RoomSummaryCard
      room={{
        ...roomFixture,
        office: officeFixture,
        features: [
          { code: 'display', name: 'Проектор и ТВ-панель 4К' },
          { code: 'whiteboard', name: 'Маркерная доска' },
          { code: 'video', name: 'Система видеоконференций' },
        ],
      }}
    />,
  );

  for (const name of ['capacity', 'display', 'whiteboard', 'video']) {
    expect(screen.getByTestId(`feature-icon-${name}`).tagName).toBe('svg');
  }
});
