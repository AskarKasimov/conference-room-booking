import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Alert } from '../../src/shared/ui/Alert';
import { Button } from '../../src/shared/ui/Button';
import { Dialog } from '../../src/shared/ui/Dialog';
import { EmptyState } from '../../src/shared/ui/EmptyState';
import { ErrorState } from '../../src/shared/ui/ErrorState';
import { Select } from '../../src/shared/ui/Select';
import { OfficeSelector } from '../../src/features/select-office';

describe('shared UI primitives', () => {
  it('renders a loading button as disabled with status text', () => {
    render(<Button isLoading>Сохранить</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Загрузка…');
  });

  it('connects a select to its accessible label', () => {
    render(
      <Select
        label="Офис"
        value="moscow"
        onValueChange={vi.fn()}
        options={[{ value: 'moscow', label: 'Москва' }]}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Офис' })).toHaveTextContent('Москва');
  });

  it('shows the explicitly selected default option', () => {
    render(
      <Select
        label="Офис"
        value=""
        onValueChange={vi.fn()}
        options={[
          { value: '', label: 'Все офисы' },
          { value: 'moscow', label: 'Москва' },
        ]}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Офис' })).toHaveTextContent('Все офисы');
  });

  it('does not offer the empty office option after an office is chosen', async () => {
    const user = userEvent.setup();
    render(
      <OfficeSelector
        value={undefined}
        onChange={vi.fn()}
        offices={[{ id: 'moscow', name: 'Москва', address: 'Тверская', timezone: 'Europe/Moscow' }]}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Офис' }));

    expect(screen.queryByRole('option', { name: 'Выберите офис' })).not.toBeInTheDocument();
  });

  it('uses the chevron icon for the office selector trigger', () => {
    render(
      <OfficeSelector
        value="moscow"
        onChange={vi.fn()}
        offices={[{ id: 'moscow', name: 'Москва', address: 'Тверская', timezone: 'Europe/Moscow' }]}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Офис' }).querySelector('svg')).toBeTruthy();
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

  it('closes a dialog when the dimmed background is clicked', () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange} title="Подтверждение">
        <p>Содержимое</p>
      </Dialog>,
    );

    fireEvent.click(document.querySelector('[data-state="open"][data-aria-hidden="true"]')!);

    expect(onOpenChange).toHaveBeenCalledWith(false);
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
