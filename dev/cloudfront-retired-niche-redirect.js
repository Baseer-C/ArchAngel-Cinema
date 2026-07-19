// CloudFront Function viewer-request example.
// Associate only after reviewing the current distribution behavior.
function handler(event) {
  var request = event.request;
  var retired = {
    '/contractors': true,
    '/contractors/': true,
    '/contractors/index.html': true,
    '/dealerships': true,
    '/dealerships/': true,
    '/dealerships/index.html': true
  };
  if (!retired[request.uri]) return request;
  return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: {
      location: { value: 'https://archangelcinema.com/' },
      'cache-control': { value: 'public, max-age=86400' }
    }
  };
}
