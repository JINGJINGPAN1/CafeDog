import { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './CommentForm.module.css';

export default function CommentForm({ disabled, onSubmit }) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(text);
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.commentForm} onSubmit={submit}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={disabled ? 'Log in to comment' : 'Write a comment...'}
        rows={3}
        disabled={disabled || submitting}
      />
      {error ? <div className={styles.commentFormError}>{error}</div> : null}
      <button
        className={styles.commentSubmit}
        type="submit"
        disabled={disabled || submitting || !text.trim()}
      >
        {submitting ? 'Posting...' : 'Post comment'}
      </button>
    </form>
  );
}

CommentForm.propTypes = {
  disabled: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
