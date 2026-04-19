import PropTypes from 'prop-types';
import styles from './Profile.module.css';

function getInitials(name) {
  if (!name) return '?';
  return name.slice(0, 2).toUpperCase();
}

export default function ProfileHeader({ username, email, createdAt, bio, isSelf, onEditProfile }) {
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
      {isSelf ? (
        <button type="button" className={styles.pfEditBtn} onClick={() => onEditProfile?.()}>
          Edit Profile
        </button>
      ) : null}
    </div>
  );
}

ProfileHeader.propTypes = {
  username: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)])
    .isRequired,
  bio: PropTypes.string,
  isSelf: PropTypes.bool.isRequired,
  onEditProfile: PropTypes.func,
};
