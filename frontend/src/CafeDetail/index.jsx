import useCafeDetail from './useCafeDetail';
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
    isReviewFormOpen,
    setIsReviewFormOpen,
    isLoggedIn,
    me,
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
              isOpen={isReviewFormOpen}
              onToggleOpen={() => setIsReviewFormOpen((v) => !v)}
            />
          </ReviewList>

          <div className={styles.cdBar}>
            <button type="button" className={styles.cdBarPill} onClick={scrollToForm}>
              ✏️ write a review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
