import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/$')({ component: NotFoundPage });

function NotFoundPage() {
  return (
    <section>
      <h1>Ничего не найдено</h1>
      <p>Такой страницы не существует.</p>
      <Link to="/rooms">Вернуться к комнатам</Link>
    </section>
  );
}
