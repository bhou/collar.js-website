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
  collar.enableDevtool({url : "http://localhost:8000"});
}

// create 'login' namespace
var loginNS = collar.ns("login");
var loginInputValidationNS = collar.ns("login.validation");

var loginInput = loginNS.input("login input");
var loginOutput = loginNS.output("login output");

var loginValidInput = loginInputValidationNS.input("login validation input");

var loginUISensor = loginNS.sensor("login sensor", function(options) {
  if (options == "ui event") {
    $("#signin-btn").click(() => {
      var email = $("#emailInput").val();
      var password = $("#passwordInput").val();
      this.send({
        event : 'signin',
        email : email,
        password : password
      })
    });
  } else {
    $(document).ready(() => {
      this.send({
        event : "login view loaded"
      });
    });
  }
});

loginUISensor.to(loginInput);

loginInput
  .when("'login view loaded' event", signal => {
    return signal.get("event") === 'login view loaded';
  })
  .do("setup UI sensor", signal => {
    loginUISensor.watch("ui event")
  });

var checkCredential = loginInput
  .when("'signin' event", signal => {
    return signal.get("event") === "signin";
  })
  .do("check credential", {email : "user email", password : "user password"}, {__result__ : "object with valid, and reason"}, signal => {
    var email = signal.get("email");
    var password = signal.get("password");

    // do check the credential here

    if (email === "test@collarjs.com" && password === "collarjs") {
      return {
        valid : true
      }
    } else {
      return {
        valid : false,
        reason : "email and password not match"
      }
    }
  })
  .map("prepare credential check result", {event : "event", email : "user email", __result__ : "object with valid, and reason"}, {email : "user email", valid : "boolean", reason : "why it is not valid"},
  signal => {
    return signal.new({
      event : signal.get("event"),
      email : signal.get("email"),
      valid : signal.getResult().valid,
      reason : signal.getResult().reason
    })
  });

checkCredential
  .when("credential ok", signal => signal.get("valid"))
  .map("prepare 'signin ok' event", {__result__ : "object with valid, email, and reason"},
    {event : "signin ok", email : "user email"},
    signal => {
    return signal.new({
      event : 'signin ok',
      email :signal.get("email")
    });
  })
  .to(loginOutput);

checkCredential
  .when("credential not ok", signal => !signal.get("valid"))
  .map("prepare 'signin failed' event", signal => {
    return signal.new({
      event : 'signin failed',
      msg : signal.get("reason"),
      email :signal.get("email")
    });
  })
  .do("show error message on UI", signal => {
    $("#error-banner").html(signal.get("msg"));
    $("#error-banner").show();
  })
  .to(loginOutput);

// test
loginOutput
  .when("'signin ok'", signal => signal.get("event") === "signin ok")
  .do("alert", signal => {
    alert("signin ok! " + signal.get("email"))
  })
