import useCafeDetail from './useCafeDetail';
import PropTypes from 'prop-types';
import CafeDetailNav from './CafeDetailNav';
import CafeHero from './CafeHero';
import CafeInfoPanel from './CafeInfoPanel';
import CafeEditForm from './CafeEditForm';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';
import styles from './CafeDetail.module.css';

export default function CafeDetail() {
  const {
    cafe,
    loading,
    error,
    isOwner,
    handleDelete,
    isEditing,
    editData,
    startEditing,
    cancelEditing,
    handleEditSubmit,
    handleEditChange,
    posts,
    postsTotal,
    loadingMorePosts,
    loadMorePosts,
    togglePostLike,
    deletePost,
    updatePost,
    bumpPostRepliesCount,
    formData,
    handleReviewChange,
    handleReviewSubmit,
    setRating,
    editCoverFile,
    setEditCoverFile,
    postPhotoFile,
    setPostPhotoFile,
    formRef,
    reviewTextRef,
    isLoggedIn,
    me,
    scrollToForm,
    toggleLike,
    toggleSave,
    isEditingReview,
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
      <a className="skipLink" href="#main-content">
        Skip to main content
      </a>
      <CafeDetailNav isOwner={isOwner} onEdit={startEditing} onDelete={handleDelete} />

      <main id="main-content" className={styles.cdMain}>
        <div className={styles.cdBody}>
          {/* Left column */}
          <section className={styles.cdLeft} aria-label="Café information">
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
                avgRating={cafe.avgRating}
                postsTotal={postsTotal}
                savesCount={cafe.savesCount ?? 0}
                likesCount={likesCount}
                liked={liked}
                saved={saved}
                onToggleLike={toggleLike}
                onToggleSave={toggleSave}
              />
            )}
          </section>

          {/* Right column */}
          <section className={styles.cdRight} aria-labelledby="cafe-reviews-heading">
            <div className={styles.cdRh}>
              <h2 id="cafe-reviews-heading" className={styles.cdRhTitle}>
                Reviews
              </h2>
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
                alreadyReviewed={isEditingReview}
              />
            </ReviewList>

            <div className={styles.cdBar}>
              <button type="button" className={styles.cdBarPill} onClick={scrollToForm}>
                ✏️ write a review
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

CafeDetail.propTypes = {};
