collar.enableDevtool();

var registerNS = collar.ns("register");

function getThrottleNode(window) {
  return registerNS.node("throttle " + window + " ms", {
    onSignal : function(signal) {
      if (!this.interval) {
        this.send(signal);
        this.interval = setInterval(() => {
          if (this.buf) {
            this.send(this.buf);
            this.buf = null;
          } else {
            clearInterval(this.interval);
            this.interval = null;
          }
        }, window);
      } else {
        this.buf = signal;
        // request next
        this.request();
      }
    }
  })
}

function getDisableRegisterBtnActuator() {
  return registerNS.do("disable register button", signal => {
    $("#register-btn").addClass("disabled-btn");
  });
}

var inputValidStatus = registerNS.model("validation model", {
  emailStatus : "", // ok or error message
  passwordStatus : "" // ok or error message
});

inputValidStatus
  .when("both email and password valid", signal => {
    return signal.get("value").emailStatus === "ok" && signal.get("value").passwordStatus === "ok";
  })
  .do("enable register button", signal => {
    $("#register-btn").removeClass("disabled-btn");
  })
  .do("hide error message", signal => {
    $("#error-banner").hide();
  })

inputValidStatus
  .when("one of email and password not valid", signal => {
    return signal.get("value").emailStatus !== "ok" || signal.get("value").passwordStatus !== "ok";
  })
  .to(getDisableRegisterBtnActuator())
  .do("show error message", signal => {
    $("#error-banner").hide();

    if (inputValidStatus.get("emailStatus") &&
        inputValidStatus.get("emailStatus") != "ok" &&
        inputValidStatus.get("emailStatus") != "") {
      $("#error-banner").html(inputValidStatus.get("emailStatus"));
      $("#error-banner").show();
    } else if (inputValidStatus.get("passwordStatus") &&
        inputValidStatus.get("passwordStatus") != "ok" &&
        inputValidStatus.get("passwordStatus") != "") {
      $("#error-banner").html(inputValidStatus.get("passwordStatus"));
      $("#error-banner").show();
    }
  })


// module boundary
var registerViewInput = registerNS.input("register view input");
var registerOutput = registerNS.output("register output");

// create ui sensor
var registerViewSensor = registerNS.sensor("register view sensor", function() {
  $("#register-btn").click(() => {
    if ($("#register-btn").hasClass("disabled-btn")) {
      return;
    }

    var email = $("#email").val();
    var password = $("#password").val();

    this.send({
      event : "register",
      email : email,
      password : password
    })
  });

  $("#email").on("input", () => {
    var email = $("#email").val();
    this.send({
      event : "email changed",
      email : email
    });
  });

  $("#password").on("input", () => {
    var email = $("#password").val();
    this.send({
      event : "password changed",
      password : email
    });
  });
});

registerViewSensor.to(registerViewInput);


var users = {};
registerViewInput
  .when("'register' event", signal => signal.get("event") === "register")
  .do("registration", signal => {
    var email = signal.get("email");
    var password = signal.get("password");

    if (users.hasOwnProperty(email)) {
      return "Account already exists!"
    }

    users[email] = password;

    return "ok";
  })
  .map("prepare registration result", signal => {
    var result = signal.getResult();

    if (result == "ok") {
      return signal.new({
        event : "register ok"
      })
    } else {
      return signal.new({
        event : "register fail",
        reason : signal.getResult()
      })
    }
  })
  .to(registerOutput)
  .do("clear input & alert output", signal => {
    $("#email").val("");
    $("#password").val("");
    $("#error-banner").hide();
    alert(signal.get("event"));
  });

var emailValidationPipeline = registerViewInput
  .when("'email changed' event", signal => signal.get("event") === "email changed")
  .to(getThrottleNode(1000))
  .to(getDisableRegisterBtnActuator())
  .actuator("email validation", (signal, done) => {
    $("#email-spinner").show();
    var email = signal.get("email");

    var result = "ok";
    if (users.hasOwnProperty(email)) {
      result = "Email is already registered";
    }

    setTimeout(() => {
      $("#email-spinner").hide();
      done(null, result);
    }, 2000);
  })

emailValidationPipeline
  .map("prepare update 'input validation model'", signal => {
    return signal.new({
      operation : "set",
      path : "emailStatus",
      value : signal.getResult()
    });
  })
  .ref(inputValidStatus);

var passwordValidationPipeline = registerViewInput
  .when("'password changed' event", signal => signal.get("event") === "password changed")
  .do("disable register button", signal => {
    $("#register-btn").addClass("disabled-btn");
  })
  .do("password validation", signal => {
    var password = signal.get("password");

    var match = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);
    if (match) {
      return "ok";
    } else {
      return "Password MUST contain minimum 8 characters at least 1 Alphabet and 1 Number"
    }
  })

passwordValidationPipeline
  .map("prepare update 'input validation model'", signal => {
    return signal.new({
      operation : "set",
      path : "passwordStatus",
      value : signal.getResult()
    });
  })
  .ref(inputValidStatus);
