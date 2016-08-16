$("#signin-btn").click(() => {
  // get email and password
  var email = $("#emailInput").val();
  var password = $("#passwordInput").val();

  // check if match
  //
  if (email === "test@collarjs.com" && password === "collarjs") {
    // login ok
    alert("signin ok! " + email);
  } else {
    // login failed
    $("#error-banner").html("email and password not match");
    $("#error-banner").show();
  }
});


$("#emailInput").on("input", () => {
  // hide error banner
  $("#error-banner").hide();

  // validate email
  var email = $("#emailInput").val();

  if (email.indexOf("@") < 0) {
    $("#error-banner").html("Invalid email format");
    $("#error-banner").show();
  }
});


$("#passwordInput").on("input", () => {
  // hide error banner
  $("#error-banner").hide();

  // validate email
  var password = $("#passwordInput").val();

  if (password.length < 6) {
    $("#error-banner").html("Password MUST have at least 6 characters");
    $("#error-banner").show();
  }
});
