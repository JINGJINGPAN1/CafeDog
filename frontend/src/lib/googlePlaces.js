import { useEffect, useRef } from 'react';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let bootstrapped = false;

// Install Google's official inline bootstrap loader. Sets up
// window.google.maps.importLibrary() which is required to load newer APIs
// like PlaceAutocompleteElement.
function ensureBootstrap() {
  if (bootstrapped) return;
  if (window.google?.maps?.importLibrary) {
    bootstrapped = true;
    return;
  }
  // eslint-disable-next-line
  ((g) => {
    var h,
      a,
      k,
      p = 'The Google Maps JavaScript API',
      c = 'google',
      l = 'importLibrary',
      q = '__ib__',
      m = document,
      b = window;
    b = b[c] || (b[c] = {});
    var d = b.maps || (b.maps = {}),
      r = new Set(),
      e = new URLSearchParams(),
      u = () =>
        h ||
        (h = new Promise(async (f, n) => {
          await (a = m.createElement('script'));
          e.set('libraries', [...r] + '');
          for (k in g) e.set(k.replace(/[A-Z]/g, (t) => '_' + t[0].toLowerCase()), g[k]);
          e.set('callback', c + '.maps.' + q);
          a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
          d[q] = f;
          a.onerror = () => (h = n(Error(p + ' could not load.')));
          a.nonce = m.querySelector('script[nonce]')?.nonce || '';
          m.head.append(a);
        }));
    d[l]
      ? console.warn(p + ' only loads once. Ignoring:', g)
      : (d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)));
  })({ key: API_KEY, v: 'weekly' });
  bootstrapped = true;
}

function loadPlacesLibrary() {
  if (!API_KEY) {
    return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not set'));
  }
  ensureBootstrap();
  return window.google.maps.importLibrary('places').then(() => window.google);
}

export function usePlaceAutocomplete(containerRef, onSelect, { active = true, placeholder } = {}) {
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!active) return undefined;
    if (!containerRef.current) return undefined;

    let cancelled = false;
    let element = null;
    let handleSelect = null;
    let handleInput = null;
    const container = containerRef.current;

    loadPlacesLibrary()
      .then((google) => {
        if (cancelled || !container) return;
        element = new google.maps.places.PlaceAutocompleteElement();
        if (placeholder) element.setAttribute('placeholder', placeholder);
        element.style.width = '100%';

        handleSelect = async (event) => {
          try {
            const prediction = event.placePrediction;
            if (!prediction) return;
            const place = prediction.toPlace();
            await place.fetchFields({
              fields: ['id', 'displayName', 'formattedAddress', 'location'],
            });
            const loc = place.location;
            if (!loc) {
              onSelectRef.current?.(null);
              return;
            }
            onSelectRef.current?.({
              placeId: place.id,
              address: place.formattedAddress || '',
              name: typeof place.displayName === 'string' ? place.displayName : '',
              lat: typeof loc.lat === 'function' ? loc.lat() : loc.lat,
              lng: typeof loc.lng === 'function' ? loc.lng() : loc.lng,
            });
          } catch (err) {
            console.error('[places] select error:', err);
          }
        };
        handleInput = () => {
          onSelectRef.current?.(null);
        };

        element.addEventListener('gmp-select', handleSelect);
        element.addEventListener('input', handleInput);

        container.innerHTML = '';
        container.appendChild(element);
      })
      .catch((err) => {
        console.error('[places] load error:', err);
      });

    return () => {
      cancelled = true;
      if (element) {
        if (handleSelect) element.removeEventListener('gmp-select', handleSelect);
        if (handleInput) element.removeEventListener('input', handleInput);
        element.remove();
      }
      if (container) container.innerHTML = '';
    };
  }, [containerRef, active, placeholder]);
}

export const GOOGLE_MAPS_CONFIGURED = Boolean(API_KEY);
