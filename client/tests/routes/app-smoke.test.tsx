import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';

describe('application shell', () => {
  it('mounts the application shell', async () => {
    render(<App />);

    expect(await screen.findByRole('main')).toBeInTheDocument();
  });
});
