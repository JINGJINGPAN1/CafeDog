import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import styles from './Home.module.css';
import {
  fetchPlaceSuggestions,
  fetchPlaceDetails,
  createSessionToken,
  GOOGLE_MAPS_CONFIGURED,
} from '../lib/googlePlaces';

export default function AddCafeModal({
  showForm,
  onClose,
  formData,
  onChange,
  onSubmit,
  onCoverFileChange,
  coverFile,
  onPlaceSelect,
}) {
  const fileInputRef = useRef(null);
  const addressWrapRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const debounceRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!showForm) {
      sessionTokenRef.current = null;
      queueMicrotask(() => {
        setSuggestions([]);
        setShowDropdown(false);
      });
      return;
    }
    if (GOOGLE_MAPS_CONFIGURED && !sessionTokenRef.current) {
      createSessionToken()
        .then((t) => {
          sessionTokenRef.current = t;
        })
        .catch((err) => console.error('[places] session token error:', err));
    }
  }, [showForm]);

  useEffect(() => {
    if (!showDropdown) return undefined;
    const onDocClick = (e) => {
      if (addressWrapRef.current && !addressWrapRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showDropdown]);

  const handleAddressChange = (e) => {
    onChange(e);
    const value = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim() || !GOOGLE_MAPS_CONFIGURED) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchPlaceSuggestions(value, sessionTokenRef.current)
        .then((list) => {
          setSuggestions(list);
          setShowDropdown(list.length > 0);
        })
        .catch((err) => console.error('[places] suggestions error:', err));
    }, 300);
  };

  const handleSuggestionPick = async (sug) => {
    try {
      const details = await fetchPlaceDetails(sug.prediction);
      if (details) onPlaceSelect?.(details);
      setShowDropdown(false);
      setSuggestions([]);
      sessionTokenRef.current = null;
    } catch (err) {
      console.error('[places] details error:', err);
    }
  };

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
    const url = String(formData?.cover_image || '').trim();
    return url || '';
  }, [objectUrl, formData]);

  if (!showForm) return null;

  return (
    <div className={styles.hModalBackdrop} onClick={onClose}>
      <div className={styles.hModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.hModalHeader}>
          <h3 className={styles.hModalTitle}>Recommend a Cafe</h3>
          <button type="button" className={styles.hModalClose} onClick={onClose}>
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="#666"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <form onSubmit={onSubmit} className={styles.hForm}>
          <input
            type="text"
            name="name"
            className={styles.hInput}
            placeholder="Cafe name *"
            value={formData.name}
            onChange={onChange}
            required
          />
          <div ref={addressWrapRef} className={styles.hAddressWrap}>
            <input
              type="text"
              name="address"
              className={styles.hInput}
              placeholder={
                GOOGLE_MAPS_CONFIGURED
                  ? 'Start typing an address and pick a suggestion *'
                  : 'Address * (Google Places not configured)'
              }
              value={formData.address}
              onChange={handleAddressChange}
              onFocus={() => {
                if (suggestions.length > 0) setShowDropdown(true);
              }}
              autoComplete="off"
              required
            />
            {showDropdown && suggestions.length > 0 ? (
              <ul className={styles.hSuggestions}>
                {suggestions.map((sug) => (
                  <li
                    key={sug.placeId}
                    className={styles.hSuggestionItem}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSuggestionPick(sug);
                    }}
                  >
                    <span className={styles.hSuggestionMain}>{sug.mainText || sug.fullText}</span>
                    {sug.secondaryText ? (
                      <span className={styles.hSuggestionSecondary}>{sug.secondaryText}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {GOOGLE_MAPS_CONFIGURED && !formData.placeId ? (
            <p className={styles.hHelpText}>
              Please pick a location from the dropdown so it shows up in Nearby search.
            </p>
          ) : null}
          {formData.placeId ? <p className={styles.hHelpText}>✓ {formData.address}</p> : null}
          <input
            type="number"
            name="rating"
            className={styles.hInput}
            placeholder="Rating (1-5)"
            value={formData.rating}
            onChange={onChange}
            step="0.1"
            min="1"
            max="5"
          />
          <input
            type="text"
            name="cover_image"
            className={styles.hInput}
            placeholder="Cover image URL"
            value={formData.cover_image}
            onChange={onChange}
          />
          <div className={styles.hPhotoRow}>
            <input
              ref={fileInputRef}
              type="file"
              className={styles.hFileInputHidden}
              accept="image/*"
              onChange={(e) => onCoverFileChange?.(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              className={styles.hPhotoBtn}
              onClick={() => fileInputRef.current?.click()}
            >
              {coverFile || previewUrl ? 'Change photo' : 'Add photo'}
            </button>
            {coverFile ? (
              <button
                type="button"
                className={styles.hPhotoRemove}
                onClick={() => onCoverFileChange?.(null)}
              >
                Remove
              </button>
            ) : null}
          </div>
          {previewUrl ? (
            <div className={styles.hPhotoPreviewWrap}>
              <img className={styles.hPhotoPreviewImg} src={previewUrl} alt="cover preview" />
            </div>
          ) : null}
          <div className={styles.hFormChecks}>
            <label className={styles.hCheckLabel}>
              <input
                type="checkbox"
                name="has_good_wifi"
                checked={formData.has_good_wifi}
                onChange={onChange}
              />
              Fast WiFi
            </label>
            <label className={styles.hCheckLabel}>
              <input
                type="checkbox"
                name="is_quiet"
                checked={formData.is_quiet}
                onChange={onChange}
              />
              Quiet for studying
            </label>
          </div>
          <button type="submit" className={styles.hSubmitBtn}>
            Publish
          </button>
        </form>
      </div>
    </div>
  );
}

AddCafeModal.propTypes = {
  showForm: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  formData: PropTypes.shape({
    name: PropTypes.string,
    address: PropTypes.string,
    has_good_wifi: PropTypes.bool,
    is_quiet: PropTypes.bool,
    rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    cover_image: PropTypes.string,
    lat: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    lng: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    placeId: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCoverFileChange: PropTypes.func,
  coverFile: PropTypes.any,
  onPlaceSelect: PropTypes.func,
};
