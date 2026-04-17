type WorkspaceBannerProps = {
  message?: string;
};

function WorkspaceBanner({
  message = "That location is outside the current workspace and can't be opened here.",
}: WorkspaceBannerProps) {
  return (
    <div className="workspace-banner" role="alert">
      <svg
        className="workspace-banner__icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M12 3.75L21 19.5H3L12 3.75ZM12 9.25C11.59 9.25 11.25 9.59 11.25 10V13.75C11.25 14.16 11.59 14.5 12 14.5C12.41 14.5 12.75 14.16 12.75 13.75V10C12.75 9.59 12.41 9.25 12 9.25ZM12 16.5C11.45 16.5 11 16.95 11 17.5C11 18.05 11.45 18.5 12 18.5C12.55 18.5 13 18.05 13 17.5C13 16.95 12.55 16.5 12 16.5Z"
          fill="currentColor"
        />
      </svg>
      <p className="workspace-banner__copy">{message}</p>
    </div>
  );
}

export default WorkspaceBanner;
