import useCafeDetail from './useCafeDetail';
import CafeDetailNav from './CafeDetailNav';
import CafeHero from './CafeHero';
import CafeInfoPanel from './CafeInfoPanel';
import CafeEditForm from './CafeEditForm';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';
import styles from './CafeDetail.module.css';

function HeartIcon({ active }) {
  const stroke = active ? '#eb5757' : '#ccc';
  const fill = active ? '#eb5757' : 'none';
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill={fill} stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function BookmarkIcon({ active }) {
  const stroke = active ? '#f2c94c' : '#888';
  const fill = active ? '#f2c94c' : 'none';
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill={fill} stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default function CafeDetail() {
  const {
    cafe, loading, error,
    isOwner, handleDelete,
    isEditing, editData, startEditing, cancelEditing, handleEditSubmit, handleEditChange,
    posts, postsTotal, loadingMorePosts, loadMorePosts, togglePostLike,
    deletePost, updatePost, bumpPostRepliesCount,
    formData, handleReviewChange, handleReviewSubmit, setRating,
    editCoverFile,
    setEditCoverFile,
    postPhotoFile,
    setPostPhotoFile,
    formRef, reviewTextRef,
    isLoggedIn, me,
    scrollToForm,
    toggleLike,
    toggleSave,
  } = useCafeDetail();

  if (loading) {
    return (
      <div className={styles.cdPage}>
        <p className={styles.cdStatus}>Loading...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.cdPage}>
        <p className={`${styles.cdStatus} ${styles.cdStatusError}`}>Error: {error}</p>
      </div>
    );
  }
  if (!cafe) {
    return (
      <div className={styles.cdPage}>
        <p className={styles.cdStatus}>Cafe not found.</p>
      </div>
    );
  }

  const liked = Boolean(cafe.viewerHasLiked);
  const saved = Boolean(cafe.viewerHasSaved);
  const likesCount = cafe.likesCount ?? 0;

  return (
    <div className={styles.cdPage}>
      <CafeDetailNav
        name={cafe.name}
        isOwner={isOwner}
        onEdit={startEditing}
        onDelete={handleDelete}
      />

      <div className={styles.cdBody}>
        {/* Left column */}
        <div className={styles.cdLeft}>
          <CafeHero coverImage={cafe.cover_image} name={cafe.name} />

          {isEditing ? (
            <CafeEditForm
              editData={editData}
              onChange={handleEditChange}
              onSubmit={handleEditSubmit}
              onCancel={cancelEditing}
              onCoverFileChange={setEditCoverFile}
              coverFile={editCoverFile}
            />
          ) : (
            <CafeInfoPanel
              name={cafe.name}
              address={cafe.address}
              hasGoodWifi={cafe.has_good_wifi}
              isQuiet={cafe.is_quiet}
              rating={cafe.rating}
              postsTotal={postsTotal}
              savesCount={cafe.savesCount ?? 0}
            />
          )}
        </div>

        {/* Right column */}
        <div className={styles.cdRight}>
          <div className={styles.cdRh}>
            <span className={styles.cdRhTitle}>posts &amp; reviews</span>
            <span className={styles.cdRhCount}>{postsTotal} reviews</span>
          </div>

          <ReviewList
            posts={posts}
            postsTotal={postsTotal}
            loadingMorePosts={loadingMorePosts}
            onLoadMore={loadMorePosts}
            onTogglePostLike={togglePostLike}
            onDeletePost={deletePost}
            onUpdatePost={updatePost}
            onBumpPostRepliesCount={bumpPostRepliesCount}
          >
            <ReviewForm
              ref={formRef}
              formData={formData}
              onChange={handleReviewChange}
              onSubmit={handleReviewSubmit}
              onSetRating={setRating}
              isLoggedIn={isLoggedIn}
              displayName={me?.username || me?.email}
              reviewTextRef={reviewTextRef}
              onPhotoFileChange={setPostPhotoFile}
              photoFile={postPhotoFile}
            />
          </ReviewList>

          <div className={styles.cdBar}>
            <div className={styles.cdBarInputRow}>
              <button type="button" className={styles.cdBarPill} onClick={scrollToForm}>
                ✏️ write a review
              </button>
            </div>
            <div className={styles.cdBarActions}>
              <button
                type="button"
                className={`${styles.cdBarAct} ${styles.cdBarBtn}`}
                onClick={toggleLike}
                aria-pressed={liked}
              >
                <HeartIcon active={liked} />
                <span>{likesCount} likes</span>
              </button>
              <button
                type="button"
                className={`${styles.cdBarAct} ${styles.cdBarBtn}`}
                onClick={toggleSave}
                aria-pressed={saved}
              >
                <BookmarkIcon active={saved} />
                <span>{saved ? 'saved' : 'save'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
