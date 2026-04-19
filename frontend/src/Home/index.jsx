import useHome from './useHome';
import HomeNavbar from './HomeNavbar';
import HomeTabs from './HomeTabs';
import HomeFilters from './HomeFilters';
import CafeGrid from './CafeGrid';
import AddCafeModal from './AddCafeModal';
import styles from './Home.module.css';

export default function Home() {
  const {
    cafes,
    initialLoading,
    searching,
    loadingMore,
    error,
    total,
    searchTerm,
    setSearchTerm,
    filterWifi,
    toggleWifi,
    filterQuiet,
    toggleQuiet,
    locating,
    activeTab,
    setActiveTab,
    categories,
    showForm,
    openForm,
    closeForm,
    formData,
    handleFormChange,
    handleFormSubmit,
    handlePlaceSelect,
    coverFile,
    setCoverFile,
    handleLoadMore,
    me,
    isLoggedIn,
    logout,
    initials,
  } = useHome();

  if (initialLoading) {
    return (
      <div className={styles.hPage}>
        <p className={styles.hStatus}>Loading cafes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.hPage}>
        <p className={`${styles.hStatus} ${styles.hStatusError}`}>Something went wrong: {error}</p>
      </div>
    );
  }

  return (
    <div className={styles.hPage}>
      <HomeNavbar isLoggedIn={isLoggedIn} meId={me?._id} initials={initials} logout={logout} />

      <div className={styles.hContainer}>
        <HomeTabs
          categories={categories}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          locating={locating}
        />
        <HomeFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterWifi={filterWifi}
          onToggleWifi={toggleWifi}
          filterQuiet={filterQuiet}
          onToggleQuiet={toggleQuiet}
        />

        <p className={styles.hCount}>
          Showing {cafes.length} of {total} cafe{total !== 1 ? 's' : ''}
        </p>

        <div className={styles.hGridWrap}>
          {searching && <div className={styles.hSearchingOverlay} />}
          <CafeGrid
            cafes={cafes}
            total={total}
            loadingMore={loadingMore}
            onLoadMore={handleLoadMore}
          />
        </div>
      </div>

      <button type="button" className={styles.hFab} onClick={openForm} aria-label="Add cafe">
        <svg
          viewBox="0 0 24 24"
          width="26"
          height="26"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <AddCafeModal
        showForm={showForm}
        onClose={closeForm}
        formData={formData}
        onChange={handleFormChange}
        onSubmit={handleFormSubmit}
        onPlaceSelect={handlePlaceSelect}
        onCoverFileChange={setCoverFile}
        coverFile={coverFile}
      />
    </div>
  );
}
