import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/App';

describe('application shell', () => {
  it('mounts the application shell', () => {
    render(<App />);

    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
