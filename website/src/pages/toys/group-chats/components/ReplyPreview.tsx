interface ReplyPreviewProps {
  senderNickname: string;
  contentPreview: string;
  onClear?: () => void;
}

const ReplyPreview = ({ senderNickname, contentPreview, onClear }: ReplyPreviewProps) => {
  return (
    <div className="reply-preview">
      <div className="reply-preview__content">
        <span className="reply-preview__sender">{senderNickname}</span>
        <span className="reply-preview__text">{contentPreview}</span>
      </div>
      {onClear && (
        <button className="reply-preview__clear" onClick={onClear} title="Cancel reply">
          <i className="fas fa-times"></i>
        </button>
      )}
    </div>
  );
};

export default ReplyPreview;
