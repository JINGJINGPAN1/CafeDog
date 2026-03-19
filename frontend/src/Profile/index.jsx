import { useState } from 'react';
import useProfile from './useProfile';
import ProfileNav from './ProfileNav';
import ProfileHeader from './ProfileHeader';
import ProfileStats from './ProfileStats';
import ProfileTabs from './ProfileTabs';
import ProfileGrid from './ProfileGrid';
import EditProfileModal from './EditProfileModal';
import styles from './Profile.module.css';

export default function Profile() {
  const { profile, loading, error, tab, setTab, isSelf, refreshProfile } = useProfile();
  const [editOpen, setEditOpen] = useState(false);

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

  const { user, posts, likedPosts, likedCafes, savedCafes } = profile;

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
          onEditProfile={() => setEditOpen(true)}
        />

        <ProfileStats
          postsCount={posts.length}
          likedPostsCount={(likedPosts || []).length}
          likedCafesCount={(likedCafes || []).length}
          savedCount={(savedCafes || []).length}
        />

        <ProfileTabs tab={tab} onTabChange={setTab} />

        <ProfileGrid
          tab={tab}
          posts={posts}
          likedPosts={likedPosts || []}
          likedCafes={likedCafes || []}
          savedCafes={savedCafes || []}
        />
      </div>

      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        currentUsername={user.username}
        onSaved={() => refreshProfile()}
      />
    </div>
  );
}
