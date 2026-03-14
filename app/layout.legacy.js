import './globals.css';

export const metadata = {
  title: 'My Next.js App',
  description: 'Starter project scaffolded manually in D:\\Rahuls\\my-next-project.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
