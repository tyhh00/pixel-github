// GitHub API service for fetching user data and repositories

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  updated_at: string;
  homepage: string | null;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
}

export interface GitHubProfileData {
  user: GitHubUser;
  repos: GitHubRepo[];
  totalStars: number;
}

const GITHUB_API_BASE = 'https://api.github.com';

// Fetch user profile
export async function fetchGitHubUser(username: string): Promise<GitHubUser | null> {
  try {
    const response = await fetch(`${GITHUB_API_BASE}/users/${username}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        // Add auth token in production for higher rate limits
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        }),
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching GitHub user:', error);
    return null;
  }
}

// Fetch user repositories sorted by stars
export async function fetchGitHubRepos(
  username: string,
  limit: number = 5
): Promise<GitHubRepo[]> {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/users/${username}/repos?sort=stars&direction=desc&per_page=${limit}`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          }),
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    return [];
  }
}

// Fetch complete profile data
export async function fetchGitHubProfile(username: string): Promise<GitHubProfileData | null> {
  const [user, repos] = await Promise.all([
    fetchGitHubUser(username),
    fetchGitHubRepos(username, 5),
  ]);

  if (!user) {
    return null;
  }

  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);

  return {
    user,
    repos,
    totalStars,
  };
}

// Format star count (e.g., 1234 -> "1.2k")
export function formatStarCount(count: number): string {
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k';
  }
  return count.toString();
}

// Fetch README content for a repository
export async function fetchRepoReadme(owner: string, repo: string): Promise<string | null> {
  try {
    // GitHub API returns README in base64
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/readme`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          }),
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    // Decode base64 content
    const content = atob(data.content.replace(/\n/g, ''));
    return content;
  } catch (error) {
    console.error('Error fetching README:', error);
    return null;
  }
}
