// collar.enableDevtool();

// create 'login' namespace
var loginNS = collar.ns("login");
var loginInputValidationNS = collar.ns("login.validation");

var loginInput = loginNS.input("login input");
var loginOutput = loginNS.output("login output");

var loginValidInput = loginInputValidationNS.input("login validation input");

var loginUISensor = loginNS.sensor("login sensor", function(options) {
  if (options == "ui event") {
    $("#signin-btn").click(() => {
      this.send({
        event : 'signin'
      })
    });

    $("#emailInput").on("input", () => {
      this.send({
        event : "typing",
        field : "email"
      })
    })

    $("#passwordInput").on("input", () => {
      this.send({
        event : "typing",
        field : "password"
      })
    })
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
  .do("get credential from UI", signal => {
    return {
      email : $("#emailInput").val(),
      password : $("#passwordInput").val()
    }
  })
  .map("prepare credential event", signal => {
    return signal.new({
      event : signal.get("event"),
      email : signal.getResult().email,
      password : signal.getResult().password
    })
  })
  .do("check credential", signal => {
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
  .map("prepare credential check result", signal => {
    return signal.new({
      event : signal.get("event"),
      email : signal.get("email"),
      valid : signal.getResult().valid,
      reason : signal.getResult().reason
    })
  })

checkCredential
  .when("credential ok", signal => {
    return signal.get("valid");
  })
  .map("prepare 'signin ok' event", signal => {
    return signal.new({
      event : 'signin ok',
      email :signal.get("email")
    });
  })
  .to(loginOutput);

checkCredential
  .when("credential not ok", signal => {
    return !signal.get("valid");
  })
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

// loginInput
//   .when("'typing' evnet", signal => {
//     return signal.get("event") == "typing";
//   })
//   .do("clear error message", signal => {
//     $("#error-banner").hide();
//   });

loginValidInput
  .when("valid", signal => {
    return signal.getResult().valid
  })
  .do("clear error message", signal => {
    $("#error-banner").hide();
  });

loginValidInput
  .when("not valid", signal => {
    return !signal.getResult().valid
  })
  .do("show error message", signal => {
    $("#error-banner").html(signal.getResult().reason);
    $("#error-banner").show();
  });

var validEmailInput = loginInput
  .when("'typing' email", signal => {
    return signal.get("event") == "typing" && signal.get("field") === "email";
  })
  .do("clear error message", signal => {
    $("#error-banner").hide();
  })
  .do("validate email", signal => {
    var email = $("#emailInput").val();
    if (email.indexOf("@") < 0) {
      return {
        valid : false,
        reason : "Invalid email format"
      }
    } else {
      return {
        valid : true,
      }
    }
  })
  .ref(loginValidInput);

var validPasswordInput = loginInput
  .when("'typing' password", signal => {
    return signal.get("event") == "typing" && signal.get("field") === "password";
  })
  .do("clear error message", signal => {
    $("#error-banner").hide();
  })
  .do("validate password", signal => {
    var password = $("#passwordInput").val();
    if (password.length < 6) {
      return {
        valid : false,
        reason : "Password MUST have at least 6 characters"
      }
    } else {
      return {
        valid : true,
      }
    }
  })
  .ref(loginValidInput);




// test

loginOutput
  .when("'signin ok'", signal => {
    return signal.get("event") === "signin ok";
  })
  .do("alert", signal => {
    alert("signin ok! " + signal.get("email"))
  })
