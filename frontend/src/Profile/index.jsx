import useProfile from './useProfile';
import ProfileNav from './ProfileNav';
import ProfileHeader from './ProfileHeader';
import ProfileStats from './ProfileStats';
import ProfileTabs from './ProfileTabs';
import ProfileGrid from './ProfileGrid';
import styles from './Profile.module.css';

export default function Profile() {
  const { profile, loading, error, tab, setTab, isSelf } = useProfile();

  if (loading) {
    return (
      <div className={styles.pfPage}>
        <p className={styles.pfStatus}>Loading profile...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.pfPage}>
        <p className={`${styles.pfStatus} ${styles.pfStatusError}`}>Error: {error}</p>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className={styles.pfPage}>
        <p className={styles.pfStatus}>User not found.</p>
      </div>
    );
  }

  const { user, posts, cafes, likedPosts } = profile;

  return (
    <div className={styles.pfPage}>
      <ProfileNav />

      <div className={styles.pfSection}>
        <ProfileHeader
          username={user.username}
          email={user.email}
          createdAt={user.createdAt}
          bio={user.bio}
          isSelf={isSelf}
        />

        <ProfileStats
          postsCount={posts.length}
          cafesCount={cafes.length}
          likesCount={likedPosts.length}
        />

        <ProfileTabs tab={tab} onTabChange={setTab} />

        <ProfileGrid tab={tab} posts={posts} cafes={cafes} likedPosts={likedPosts} />
      </div>
    </div>
  );
}
