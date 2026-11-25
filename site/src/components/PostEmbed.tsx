import React from 'react';
import { Icon } from '@components/Icon';
import { getLinkedInEmbedUrl } from '@utils/linkedinEmbed';
import { usePostStatus } from '@/hooks/usePostStatus';

// The story card and the dashboard list style the embed with different classes.
// The image export looks for the story card classes `peak-post-embed-container`
// and `peak-post-unavailable`, so keep those names.
interface EmbedClasses {
  frame?: string;
  iframe: string;
  unavailable: string;
  noEmbed: string;
  icon: string;
  link: string;
}

const CLASS_NAMES: Record<'card' | 'list', EmbedClasses> = {
  card: {
    frame: 'peak-post-embed-container',
    iframe: 'peak-post-iframe',
    unavailable: 'peak-post-unavailable',
    noEmbed: 'peak-post-fallback',
    icon: 'peak-post-fallback-icon',
    link: 'post-status-link',
  },
  list: {
    iframe: 'linkedin-iframe',
    unavailable: 'post-fallback',
    noEmbed: 'post-fallback',
    icon: 'fallback-icon',
    link: 'fallback-link',
  },
};

interface PostEmbedProps {
  url: string;
  title: string;
  variant: keyof typeof CLASS_NAMES;
}

/**
 * Show the LinkedIn embed for a public post.
 * For a post that is not public, show a trophy and a link to the post.
 * For a URL with no post ID, show a pin and a link. If the status check fails, keep the embed.
 */
export const PostEmbed: React.FC<PostEmbedProps> = ({ url, title, variant }) => {
  const classes = CLASS_NAMES[variant];
  const embedUrl = getLinkedInEmbedUrl(url);
  const isPublic = usePostStatus(embedUrl ? url : undefined);

  if (embedUrl && isPublic !== false) {
    return (
      <div className={classes.frame}>
        {/* Check the sandbox tokens in a browser after a change. The embed needs scripts,
            its own origin for LinkedIn cookies, and popups for links to linkedin.com. */}
        <iframe
          src={embedUrl}
          title={title}
          className={classes.iframe}
          loading="lazy"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    );
  }

  return (
    <div className={embedUrl ? classes.unavailable : classes.noEmbed}>
      <div className={classes.icon}>
        <Icon name={embedUrl ? 'trophy' : 'pin'} />
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer" className={classes.link}>
        Open post
      </a>
    </div>
  );
};
