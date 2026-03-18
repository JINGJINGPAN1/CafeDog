import styles from './Profile.module.css';

function getInitials(name) {
  if (!name) return '?';
  return name.slice(0, 2).toUpperCase();
}

export default function ProfileHeader({ username, email, createdAt, bio, isSelf }) {
  return (
    <div className={styles.pfHeader}>
      <div className={styles.pfAvatar}>{getInitials(username)}</div>
      <div className={styles.pfInfo}>
        <div className={styles.pfNameRow}>
          <h1 className={styles.pfName}>{username}</h1>
          {isSelf ? <span className={styles.pfBadge}>You</span> : null}
        </div>
        <p className={styles.pfEmail}>{email}</p>
        <p className={styles.pfJoined}>Joined {new Date(createdAt).toLocaleDateString()}</p>
        {bio ? <p className={styles.pfBio}>{bio}</p> : null}
      </div>
      <button type="button" className={styles.pfEditBtn}>Edit Profile</button>
    </div>
  );
}
