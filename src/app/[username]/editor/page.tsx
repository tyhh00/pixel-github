import { redirect } from 'next/navigation';
import { getCurrentUser, isProfileOwner } from '@/lib/supabase/server';
import { WorldEditor } from '@/components/Editor/WorldEditor';

interface EditorPageProps {
  params: Promise<{ username: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { username } = await params;

  // Check if user is logged in and owns this profile
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/?login=required&returnTo=/${username}/editor`);
  }

  const isOwner = await isProfileOwner(username);

  if (!isOwner) {
    redirect(`/${username}`);
  }

  return <WorldEditor username={username} />;
}

export async function generateMetadata({ params }: EditorPageProps) {
  const { username } = await params;

  return {
    title: `Edit World - ${username} | Pixel GitHub`,
    description: `Customize your Pixel GitHub world`,
  };
}
