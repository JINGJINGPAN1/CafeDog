import { useEffect, useMemo, useRef } from 'react';
import styles from './CafeDetail.module.css';

export default function CafeEditForm({
  editData,
  onChange,
  onSubmit,
  onCancel,
  onCoverFileChange,
  coverFile,
}) {
  const fileInputRef = useRef(null);
  const objectUrl = useMemo(() => {
    if (!coverFile) return '';
    return URL.createObjectURL(coverFile);
  }, [coverFile]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const previewUrl = useMemo(() => {
    if (objectUrl) return objectUrl;
    const url = String(editData?.cover_image || '').trim();
    return url || '';
  }, [objectUrl, editData]);

  return (
    <div className={styles.cdLeftPad}>
      <form onSubmit={onSubmit} className={styles.cdEform}>
        <h3 className={styles.cdEformTitle}>Edit Cafe</h3>
        <input
          className={styles.cdInp}
          name="name"
          value={editData.name}
          onChange={onChange}
          placeholder="Name"
          required
        />
        <input
          className={styles.cdInp}
          name="address"
          value={editData.address}
          onChange={onChange}
          placeholder="Address"
          required
        />
        <div className={styles.cdEformRow}>
          <label className={styles.cdCk}>
            <input
              type="checkbox"
              name="has_good_wifi"
              checked={editData.has_good_wifi}
              onChange={onChange}
            />{' '}
            WiFi
          </label>
          <label className={styles.cdCk}>
            <input
              type="checkbox"
              name="is_quiet"
              checked={editData.is_quiet}
              onChange={onChange}
            />{' '}
            Quiet
          </label>
        </div>
        <select className={styles.cdInp} name="rating" value={editData.rating} onChange={onChange}>
          <option value="">No rating</option>
          <option value="5">5</option>
          <option value="4">4</option>
          <option value="3">3</option>
          <option value="2">2</option>
          <option value="1">1</option>
        </select>
        <input
          className={styles.cdInp}
          name="cover_image"
          value={editData.cover_image}
          onChange={onChange}
          placeholder="Cover image URL"
        />
        <div className={styles.cdPhotoRow}>
          <input
            ref={fileInputRef}
            className={styles.cdFileInputHidden}
            type="file"
            accept="image/*"
            onChange={(e) => onCoverFileChange?.(e.target.files?.[0] || null)}
          />
          <button
            type="button"
            className={styles.cdPhotoBtn}
            onClick={() => fileInputRef.current?.click()}
          >
            {coverFile || previewUrl ? 'Change photo' : 'Add photo'}
          </button>
          {coverFile ? (
            <button
              type="button"
              className={styles.cdPhotoRemove}
              onClick={() => onCoverFileChange?.(null)}
            >
              Remove
            </button>
          ) : null}
        </div>
        {previewUrl ? (
          <div className={styles.cdPhotoPreviewWrap}>
            <img className={styles.cdPhotoPreviewImg} src={previewUrl} alt="cover preview" />
          </div>
        ) : null}
        <div className={styles.cdEformActions}>
          <button type="submit" className={`${styles.cdPostBtn} ${styles.cdPostBtnFlex}`}>
            Save
          </button>
          <button type="button" className={styles.cdCancel} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
