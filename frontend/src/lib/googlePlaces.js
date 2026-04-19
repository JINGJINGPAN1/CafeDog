const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let bootstrapped = false;

function ensureBootstrap() {
  if (bootstrapped) return;
  if (window.google?.maps?.importLibrary) {
    bootstrapped = true;
    return;
  }
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
        (h = new Promise((f, n) => {
          a = m.createElement('script');
          e.set('libraries', [...r] + '');
          for (k in g) {
            e.set(
              k.replace(/[A-Z]/g, (t) => '_' + t[0].toLowerCase()),
              g[k],
            );
          }
          e.set('callback', c + '.maps.' + q);
          a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
          d[q] = f;
          a.onerror = () => n(Error(p + ' could not load.'));
          a.nonce = m.querySelector('script[nonce]')?.nonce || '';
          m.head.append(a);
        }));
    d[l]
      ? console.warn(p + ' only loads once. Ignoring:', g)
      : (d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)));
  })({ key: API_KEY, v: 'weekly' });
  bootstrapped = true;
}

async function loadPlacesLibrary() {
  if (!API_KEY) throw new Error('VITE_GOOGLE_MAPS_API_KEY is not set');
  ensureBootstrap();
  await window.google.maps.importLibrary('places');
  return window.google.maps.places;
}

export async function createSessionToken() {
  const places = await loadPlacesLibrary();
  return new places.AutocompleteSessionToken();
}

export async function fetchPlaceSuggestions(input, sessionToken) {
  if (!input || !input.trim()) return [];
  const places = await loadPlacesLibrary();
  const request = { input };
  if (sessionToken) request.sessionToken = sessionToken;
  const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
  return suggestions
    .filter((s) => s.placePrediction)
    .map((s) => {
      const pred = s.placePrediction;
      return {
        placeId: pred.placeId,
        mainText: pred.mainText?.text || pred.text?.text || '',
        secondaryText: pred.secondaryText?.text || '',
        fullText: pred.text?.text || '',
        prediction: pred,
      };
    });
}

export async function fetchPlaceDetails(prediction) {
  const place = prediction.toPlace();
  await place.fetchFields({
    fields: ['id', 'displayName', 'formattedAddress', 'location'],
  });
  const loc = place.location;
  if (!loc) return null;
  return {
    placeId: place.id,
    address: place.formattedAddress || '',
    name: typeof place.displayName === 'string' ? place.displayName : '',
    lat: typeof loc.lat === 'function' ? loc.lat() : loc.lat,
    lng: typeof loc.lng === 'function' ? loc.lng() : loc.lng,
  };
}

export const GOOGLE_MAPS_CONFIGURED = Boolean(API_KEY);
