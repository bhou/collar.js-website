// enable dev tool
collar.enableDevtool();
// create a namespace
var ns = collar.ns("com.collarjs.example.login");

var loginPipeline = ns.sensor("listen to UI event")
  .when("user click 'signin' button")
  .do("get email and password from UI")
  .do("check email and password pair");

loginPipeline
  .when("email and password match")
  .do("alert 'login ok'");

loginPipeline
  .when("email and password not match")
  .do("alert 'login not ok'");
