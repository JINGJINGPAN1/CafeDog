import ProfilePostCard from './ProfilePostCard';
import ProfileCafeCard from './ProfileCafeCard';
import styles from './Profile.module.css';

function EmptyState({ message }) {
  return (
    <div className={styles.pfEmpty}>
      <span className={styles.pfEmptyIcon}>&#9749;</span>
      <p className={styles.pfEmptyText}>{message}</p>
    </div>
  );
}

function PostList({ items }) {
  if (items.length === 0) return <EmptyState message="No posts yet." />;
  return (
    <div className={styles.pfPostList}>
      {items.map((p, i) => (
        <ProfilePostCard key={p._id} post={p} isLast={i === items.length - 1} />
      ))}
    </div>
  );
}

export default function ProfileGrid({ tab, posts, likedPosts, likedCafes, savedCafes }) {
  if (tab === 'posts') return <PostList items={posts} />;
  if (tab === 'liked') return <PostList items={likedPosts} />;

  return (
    <div className={styles.pfGrid}>
      {tab === 'likedCafes' &&
        (likedCafes.length === 0 ? (
          <EmptyState message="No liked cafes yet." />
        ) : (
          likedCafes.map((c, i) => <ProfileCafeCard key={c._id} cafe={c} index={i} />)
        ))}

      {tab === 'saved' &&
        (savedCafes.length === 0 ? (
          <EmptyState message="No saved cafes yet." />
        ) : (
          savedCafes.map((c, i) => <ProfileCafeCard key={c._id} cafe={c} index={i} />)
        ))}
    </div>
  );
}
