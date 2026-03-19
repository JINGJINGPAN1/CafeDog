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

function CafeGrid({ items, emptyMsg }) {
  if (items.length === 0) return <EmptyState message={emptyMsg} />;
  return (
    <div className={styles.pfGrid}>
      {items.map((c, i) => (
        <ProfileCafeCard key={c._id} cafe={c} index={i} />
      ))}
    </div>
  );
}

export default function ProfileGrid({ tab, posts, cafes, likedPosts, likedCafes, savedCafes }) {
  if (tab === 'posts') return <PostList items={posts} />;
  if (tab === 'cafes') return <CafeGrid items={cafes} emptyMsg="No cafes created yet." />;
  if (tab === 'liked') return <PostList items={likedPosts} />;
  if (tab === 'likedCafes') return <CafeGrid items={likedCafes} emptyMsg="No liked cafes yet." />;
  if (tab === 'saved') return <CafeGrid items={savedCafes} emptyMsg="No saved cafes yet." />;
  return null;
}
