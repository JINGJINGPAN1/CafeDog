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

export default function ProfileGrid({ tab, posts, likedPosts, likedCafes, savedCafes }) {
  return (
    <div className={styles.pfGrid}>
      {tab === 'posts' &&
        (posts.length === 0 ? (
          <EmptyState message="No posts yet." />
        ) : (
          posts.map((p, i) => <ProfilePostCard key={p._id} post={p} index={i} />)
        ))}

      {tab === 'liked' &&
        (likedPosts.length === 0 ? (
          <EmptyState message="No liked posts yet." />
        ) : (
          likedPosts.map((p, i) => <ProfilePostCard key={p._id} post={p} index={i} />)
        ))}

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
