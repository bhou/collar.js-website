function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

if (getParameterByName("dev")) {
  collar.enableDevtool();
}

var ns = collar.ns('com.collarjs.example.login');
var loginViewSensor = ns.sensor('ui sensor', function(options) {
  $( "#signin-btn" ).click(() => {
    this.send({
      event : 'signin'
    });
  });
});

var loginPipeline = loginViewSensor
  .when('user click signin button',
    {event : "must be 'signin'"}, signal => {
    return signal.get('event') === 'signin';
  })
  .do('get user credential from view',
    {},
    {__result__ : "object contains 'email' and 'password'"}, signal => {
    var email = $( "#emailInput" ).val();
    var password = $( "#passwordInput" ).val();

    return {
      email : email,
      password : password
    }
  })
  .do('check user credential',
    {"__result__.email": "user email", "__result__.password": "user password"},
    {__result__: "ok or failed reason"}, signal => {
    var email = signal.getResult().email;
    var password = signal.getResult().password;

    if (email === "test@collarjs.com" && password === "collarjs") {
      return "ok";
    } else {
      return "email and password not match";
    }
  })

loginPipeline
  .when('credential ok', {__result__ : "must be 'ok'"}, signal => {
    return signal.getResult() === "ok";
  })
  .do('alert login ok', signal => {
    alert("login ok!");
  });

loginPipeline
  .when('credential not ok', {__result__ : "must not be 'ok'"}, signal => {
    return signal.getResult() !== "ok";
  })
  .do('alert login failed', signal => {
    alert("login failed!");
  })
