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

var uiNS = collar.ns('ui');
var ns = collar.ns('credential check');
var ns1 = collar.ns('credential ok');
var ns2 = collar.ns('credential not ok');

var input = ns.input('ns-input');
var input1 = ns1.input('ns1-input');
var input2 = ns2.input('ns2-input');

var loginViewSensor = uiNS.sensor('ui sensor', function(options) {
  $( "#signin-btn" ).click(() => {
    this.send({
      event : 'signin'
    });
  });
});

loginViewSensor.to(input);

var loginPipeline = input
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

loginPipeline.to(input1);


var alert = ns.do('alert login ok', signal => {
    alert("login ok!");
  });

input1
  .when('credential ok', {__result__ : "must be 'ok'"}, signal => {
    return signal.getResult() === "ok";
  })

alert.to(input1);

loginPipeline.to(input2)

input2
  .when('credential not ok', {__result__ : "must not be 'ok'"}, signal => {
    return signal.getResult() !== "ok";
  })
  .do('alert login failed', signal => {
    alert("login failed!");
  })
