import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Alert } from '../../src/components/ui/Alert';
import { Button } from '../../src/components/ui/Button';
import { Dialog } from '../../src/components/ui/Dialog';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { Select } from '../../src/components/ui/Select';

describe('shared UI primitives', () => {
  it('renders a loading button as disabled with status text', () => {
    render(<Button isLoading>Сохранить</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Загрузка…');
  });

  it('connects a select to its accessible label', () => {
    render(
      <Select label="Офис" value="moscow" onChange={vi.fn()}>
        <option value="moscow">Москва</option>
      </Select>,
    );

    expect(screen.getByLabelText('Офис')).toHaveValue('moscow');
  });

  it('closes a dialog on Escape and returns focus to its trigger', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const trigger = document.createElement('button');
    document.body.append(trigger);
    render(
      <Dialog
        open
        onOpenChange={onOpenChange}
        title="Подтверждение"
        returnFocusRef={{ current: trigger }}
      >
        <p>Содержимое</p>
      </Dialog>,
    );

    await user.keyboard('{Escape}');

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
  });

  it('exposes alerts and empty/error recovery states', () => {
    render(
      <>
        <Alert variant="error">Ошибка</Alert>
        <EmptyState title="Пусто" description="Ничего нет" />
        <ErrorState title="Не удалось" description="Повторите позже" onRetry={vi.fn()} />
      </>,
    );

    expect(screen.getAllByRole('alert')[0]).toHaveTextContent('Ошибка');
    expect(screen.getByRole('heading', { name: 'Пусто' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument();
  });
});
