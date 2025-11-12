import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Login to Your Account",
  description: "Access your MyHomeworkHelp student or expert portal",
  robots: {
    index: true,  // Allow Google to index login page
    follow: false
  }
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}