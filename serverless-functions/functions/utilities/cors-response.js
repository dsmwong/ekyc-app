exports.response = function(originalResponse, contentType) {
  // eslint-disable-next-line no-undef
  const corsResponse = new Twilio.Response();
  
  corsResponse.appendHeader('Access-Control-Allow-Origin', '*');
  corsResponse.appendHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
  corsResponse.appendHeader('Access-Control-Allow-Headers', 'Content-Type');

  if( contentType ) {
      corsResponse.appendHeader('Content-Type', contentType);
  } else if (typeof originalResponse === 'string' ) {
      corsResponse.appendHeader('Content-Type', 'text/html');
  } else {
      corsResponse.appendHeader('Content-Type', 'application/json');
  }
  
  corsResponse.setBody(originalResponse);
  
  return corsResponse;
};