import { notFound } from 'next/navigation';
import { fetchGitHubProfile } from '@/services/github';
import { GameWrapper } from '@/components/Game/GameWrapper';
import { isProfileOwner } from '@/lib/supabase/server';

export const runtime = 'edge';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;

  // Fetch GitHub profile data
  const profileData = await fetchGitHubProfile(username);

  if (!profileData) {
    notFound();
  }

  // Check if the current user owns this profile
  const isOwner = await isProfileOwner(username);

  return (
    <GameWrapper
      username={username}
      user={profileData.user}
      repos={profileData.repos}
      totalStars={profileData.totalStars}
      isOwner={isOwner}
    />
  );
}

// Generate metadata for the page
export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  const profileData = await fetchGitHubProfile(username);

  if (!profileData) {
    return {
      title: 'User Not Found | Pixel GitHub',
    };
  }

  return {
    title: `${profileData.user.name || username}'s World | Pixel GitHub`,
    description: profileData.user.bio || `Explore ${username}'s GitHub profile in pixel art`,
  };
}
