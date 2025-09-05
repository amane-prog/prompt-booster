export const metadata = {
  title: "Prompt Booster",
  description: "Boost your prompts"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}