function gameLogic(game) {
  var ns = collar.ns("com.collarjs.game.2d.spaceship");

  // game module input
  var gameModuleInput = ns.input("game module input");

  var gameSceneSensor = ns.sensor("game scene sensor");
  gameSceneSensor.to(gameModuleInput);

  gameModuleInput
    .when("load resources")
    .do("load resources")

  gameModuleInput
    .when("init game scene")
    .do("init world settings")
    .do("render layer 0")
    .do("render layer 1")
    .do("render layer 2")
    .do("render layer 3")
    .do("init game scene sensor")

  gameModuleInput
    // this event will be received 60 times per second
    .when("update event")
    .do("update game states");

  gameModuleInput
    .when("user input")
    .do("react to user input");

  return {
    inputs : {
      "input" : gameModuleInput
    }
  }
}
