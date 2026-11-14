// Метаданные проекта и общие сведения для документации.
export const PROJECT = {
  name: 'Шаурма-Мастер',
  tagline: 'Интернет-магазин шаурмы с доставкой и самовывозом',
  repo: 'https://github.com/PavelKhlynovQA/shawarma-shop',
  version: '1.0.0',
  releaseDate: '14.11.2026',
  author: 'Pavel Khlynov',
  role: 'QA Engineer',
  stack: 'Node.js 24, Express 4, PostgreSQL 16, Docker, Vanilla JS, Playwright, Allure',
  environments: [
    { name: 'Local (SQLite)', db: 'SQLite ./data/*.db', url: 'http://localhost:3000', run: 'npm start' },
    { name: 'Docker (PostgreSQL)', db: 'PostgreSQL 16', url: 'http://localhost:3000', run: 'docker compose up --build -d' },
    { name: 'CI', db: 'SQLite in-memory', url: '—', run: 'GitHub Actions' },
  ],
  accounts: [
    { role: 'Администратор', email: 'admin@shawarma.ru', password: 'Admin123!' },
    { role: 'Покупатель', email: 'customer@test.ru', password: 'Test123!' },
    { role: 'Покупатель по телефону', email: '—', password: 'код из SMS (демо: показывается на экране)' },
  ],
  promocodes: [
    { code: 'SHAWARMA10', discount: '10%', state: 'активен', use: 'позитивные проверки' },
    { code: 'FIRSTORDER', discount: '15%', state: 'активен', use: 'позитивные проверки' },
    { code: 'SUMMER20', discount: '20%', state: 'неактивен', use: 'негативный тест PROMO_INACTIVE' },
    { code: 'EXPIRED5', discount: '5%', state: 'просрочен (01.01.2024)', use: 'негативный тест PROMO_EXPIRED' },
  ],
  testCards: [
    { number: '4111 1111 1111 1111', expiry: '12/30', cvv: '123', result: 'успешная оплата' },
    { number: '0000 1111 2222 3333', expiry: '12/30', cvv: '123', result: 'отказ банка, 402 CARD_DECLINED' },
  ],
};
