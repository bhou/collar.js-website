// enable dev tool
collar.enableDevtool();
// create a namespace
var ns = collar.ns("com.collarjs.example.login");

var loginPipeline = ns.sensor("listen to UI event",function(options) {
  $( "#signin-btn" ).click(() => {
    this.send({
      event : 'signin'
    });
  });
})
  .when("user click 'signin' button", signal => {
    return signal.get('event') === 'signin';
  })
  .do("get email and password from UI", signal => {
    var email = $( "#emailInput" ).val();
    var password = $( "#passwordInput" ).val();

    return {
      email : email,
      password : password
    }
  })
  .do("check email and password pair", signal => {
    var email = signal.getResult().email;
    var password = signal.getResult().password;

    if (email === "test@collarjs.com" && password === "collarjs") {
      return "ok";
    } else {
      return "email and password not match";
    }
  });

loginPipeline
  .when("email and password match", signal => {
    return signal.getResult() === "ok";
  })
  .do("alert 'login ok'", signal => {
    alert("login ok");
  });

loginPipeline
  .when("email and password not match", signal => {
    return signal.getResult() !== "ok";
  })
  .do("alert 'login not ok'", signal => {
    alert("login failed");
  });
