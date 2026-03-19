import ReviewCard from './ReviewCard';
import styles from './CafeDetail.module.css';

export default function ReviewList({
  posts,
  postsTotal,
  loadingMorePosts,
  onLoadMore,
  onTogglePostLike,
  onDeletePost,
  onUpdatePost,
  onBumpPostRepliesCount,
  children,
}) {
  return (
    <div className={styles.cdReviews}>
      {posts.length === 0 ? (
        <p className={styles.cdEmpty}>No posts yet. Be the first to post!</p>
      ) : (
        posts.map((post, idx) => (
          <ReviewCard
            key={post._id}
            post={post}
            index={idx}
            onToggleLike={onTogglePostLike}
            onDeletePost={onDeletePost}
            onUpdatePost={onUpdatePost}
            onBumpRepliesCount={onBumpPostRepliesCount}
          />
        ))
      )}

      {posts.length < postsTotal ? (
        <div className={styles.cdMoreWrap}>
          <button
            type="button"
            className={styles.cdMore}
            onClick={onLoadMore}
            disabled={loadingMorePosts}
          >
            {loadingMorePosts ? 'Loading...' : 'Load More'}
          </button>
        </div>
      ) : null}

      {children}
    </div>
  );
}
