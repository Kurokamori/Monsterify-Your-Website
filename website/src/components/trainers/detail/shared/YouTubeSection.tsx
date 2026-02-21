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
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export const YouTubeSection = ({ label, value }: YouTubeSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!value || value.trim() === '' || value === '{"",""}') return null;

  const hasLink = value.includes(' || ');
  const [displayText, youtubeLink] = hasLink ? value.split(' || ') : [value, null];
  const videoId = getYouTubeVideoId(youtubeLink);

  return (
    <div className="trainer-detail__youtube-section">
      <span className="detail-label">{label}</span>
      <div className="trainer-detail__youtube-content">
        <div className="trainer-detail__youtube-display">
          <span className="detail-value">{displayText}</span>
          {hasLink && videoId && (
            <button
              className="button secondary icon sm no-flex"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? `Hide ${label.toLowerCase()} player` : `Show ${label.toLowerCase()} player`}
            >
              <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
            </button>
          )}
        </div>
        {isExpanded && hasLink && videoId && (
          <div className="trainer-detail__youtube-player">
            <iframe
              width="100%"
              height="315"
              src={`https://www.youtube.com/embed/${videoId}`}
              title={label}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        )}
      </div>
    </div>
  );
};
