import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ProfilePostCard from './ProfilePostCard';
import ProfileCafeCard from './ProfileCafeCard';
import styles from './Profile.module.css';

const PAGE_SIZE = 8;

function EmptyState({ message }) {
  return (
    <div className={styles.pfEmpty}>
      <span className={styles.pfEmptyIcon}>&#9749;</span>
      <p className={styles.pfEmptyText}>{message}</p>
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className={styles.pfPager}>
      <button
        type="button"
        className={styles.pfPagerBtn}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        ‹ Prev
      </button>
      <span className={styles.pfPagerInfo}>
        {page} / {totalPages}
      </span>
      <button
        type="button"
        className={styles.pfPagerBtn}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next ›
      </button>
    </div>
  );
}

function PostList({ items }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(items.length / PAGE_SIZE);

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 0);
    return () => clearTimeout(t);
  }, [items]);

  if (items.length === 0) return <EmptyState message="No posts yet." />;

  const start = (page - 1) * PAGE_SIZE;
  const slice = items.slice(start, start + PAGE_SIZE);

  return (
    <>
      <div className={styles.pfPostList}>
        {slice.map((p, i) => (
          <ProfilePostCard key={p._id} post={p} isLast={i === slice.length - 1} />
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </>
  );
}

function CafeGrid({ items, emptyMsg }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(items.length / PAGE_SIZE);

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 0);
    return () => clearTimeout(t);
  }, [items]);

  if (items.length === 0) return <EmptyState message={emptyMsg} />;

  const start = (page - 1) * PAGE_SIZE;
  const slice = items.slice(start, start + PAGE_SIZE);

  return (
    <>
      <div className={styles.pfGrid}>
        {slice.map((c, i) => (
          <ProfileCafeCard key={c._id} cafe={c} index={start + i} />
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </>
  );
}

export default function ProfileGrid({ tab, posts, cafes, likedPosts, likedCafes, savedCafes }) {
  if (tab === 'posts') return <PostList items={posts} />;
  if (tab === 'cafes') return <CafeGrid items={cafes} emptyMsg="No cafes created yet." />;
  if (tab === 'liked') return <PostList items={likedPosts} />;
  if (tab === 'likedCafes') return <CafeGrid items={likedCafes} emptyMsg="No liked cafes yet." />;
  if (tab === 'saved') return <CafeGrid items={savedCafes} emptyMsg="No saved cafes yet." />;
  return null;
}

ProfileGrid.propTypes = {
  tab: PropTypes.string.isRequired,
  posts: PropTypes.arrayOf(PropTypes.object).isRequired,
  cafes: PropTypes.arrayOf(PropTypes.object).isRequired,
  likedPosts: PropTypes.arrayOf(PropTypes.object).isRequired,
  likedCafes: PropTypes.arrayOf(PropTypes.object).isRequired,
  savedCafes: PropTypes.arrayOf(PropTypes.object).isRequired,
};
