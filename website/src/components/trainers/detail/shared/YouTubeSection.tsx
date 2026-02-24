import { useState } from 'react';

interface YouTubeSectionProps {
  label: string;
  value: string;
}

function getYouTubeVideoId(url: string | null): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]+)/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]+)/,
    /(?:youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getYouTubeUrl(url: string | null): string | null {
  if (!url) return null;
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
}

export const YouTubeSection = ({ label, value }: YouTubeSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [embedError, setEmbedError] = useState(false);

  if (!value || value.trim() === '' || value === '{"",""}') return null;

  const hasLink = value.includes(' || ');
  let displayText: string;
  let youtubeLink: string | null;

  if (hasLink) {
    [displayText, youtubeLink] = value.split(' || ');
  } else {
    // Check if the value itself is a YouTube URL (no separator used)
    const directVideoId = getYouTubeVideoId(value);
    if (directVideoId) {
      displayText = value;
      youtubeLink = value;
    } else {
      displayText = value;
      youtubeLink = null;
    }
  }

  const videoId = getYouTubeVideoId(youtubeLink);
  const watchUrl = getYouTubeUrl(youtubeLink);

  return (
    <div className="trainer-detail__youtube-section">
      <span className="detail-label">{label}</span>
      <div className="trainer-detail__youtube-content">
        <div className="trainer-detail__youtube-display">
          <span className="detail-value">{displayText}</span>
          {videoId && (
            <button
              className="button secondary icon sm no-flex"
              onClick={() => { setIsExpanded(!isExpanded); setEmbedError(false); }}
              title={isExpanded ? `Hide ${label.toLowerCase()} player` : `Show ${label.toLowerCase()} player`}
            >
              <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
            </button>
          )}
        </div>
        {isExpanded && videoId && (
          <div className="trainer-detail__youtube-player">
            {embedError ? (
              <div className="trainer-detail__youtube-fallback">
                <p>This video cannot be embedded due to its privacy settings.</p>
                {watchUrl && (
                  <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="button secondary">
                    <i className="fas fa-external-link-alt"></i> Watch on YouTube
                  </a>
                )}
              </div>
            ) : (
              <iframe
                width="100%"
                height="315"
                src={`https://www.youtube-nocookie.com/embed/${videoId}?origin=${encodeURIComponent(window.location.origin)}&rel=0`}
                title={label}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                onError={() => setEmbedError(true)}
              ></iframe>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
