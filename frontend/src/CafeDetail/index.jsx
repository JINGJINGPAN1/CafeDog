import useCafeDetail from './useCafeDetail';
import CafeDetailNav from './CafeDetailNav';
import CafeHero from './CafeHero';
import CafeInfoPanel from './CafeInfoPanel';
import CafeEditForm from './CafeEditForm';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';
import styles from './CafeDetail.module.css';

const heartSvg = (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#ccc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const bookmarkSvg = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

export default function CafeDetail() {
  const {
    cafe, loading, error,
    isOwner, handleDelete,
    isEditing, editData, startEditing, cancelEditing, handleEditSubmit, handleEditChange,
    posts, postsTotal, loadingMorePosts, loadMorePosts,
    formData, handleReviewChange, handleReviewSubmit, setRating,
    formRef, reviewTextRef,
    isLoggedIn, me,
    scrollToForm,
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
            />
          ) : (
            <CafeInfoPanel
              name={cafe.name}
              address={cafe.address}
              hasGoodWifi={cafe.has_good_wifi}
              isQuiet={cafe.is_quiet}
              rating={cafe.rating}
              postsTotal={postsTotal}
            />
          )}
        </div>

        {/* Right column */}
        <div className={styles.cdRight}>
          <div className={styles.cdRh}>
            <span className={styles.cdRhTitle}>check-ins &amp; reviews</span>
            <span className={styles.cdRhCount}>{postsTotal} reviews</span>
          </div>

          <ReviewList
            posts={posts}
            postsTotal={postsTotal}
            loadingMorePosts={loadingMorePosts}
            onLoadMore={loadMorePosts}
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
            />
          </ReviewList>

          <div className={styles.cdBar}>
            <div className={styles.cdBarInputRow}>
              <button type="button" className={styles.cdBarPill} onClick={scrollToForm}>
                ✏️ write a review
              </button>
            </div>
            <div className={styles.cdBarActions}>
              <span className={styles.cdBarAct}>{heartSvg} <span>0 likes</span></span>
              <span className={styles.cdBarAct}>{bookmarkSvg} <span>save</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
