function calculateAngle(p0, p1, p2) {
  var pp1 = Phaser.Point.subtract(p1, p0);
  var pp2 = Phaser.Point.subtract(p2, p0);


  var angle1 = Phaser.Point.angle(pp1, new Phaser.Point(0, 0)) - Math.PI / 4;
  var angle2 = Phaser.Point.angle(pp2, new Phaser.Point(0, 0)) - Math.PI / 4;

  var resultInDegree = Phaser.Math.radToDeg(angle2 - angle1);
  if (resultInDegree > 180) resultInDegree -= 360;
  if (resultInDegree < -180) resultInDegree += 360;
  return resultInDegree;
}

function toPoint(v) {
  return new Phaser.Point(v.x, v.y);
}

function toVector(p) {
  return new Victor(p.x, p.y);
}


function gameLogic(game) {
  //----------------------------------
  // game state
  var background;

  var spaceship;
  var spaceshipSpeed = __speed__;
  var spaceshipRotateSpeed = __rotate__;

  var missiles;

  var missileProfile = [{
    speed : 7,
    rotate : 2
  }, {
    speed : 10,
    rotate : 2
  }, {
    speed : 6,
    rotate : 3
  }, {
    speed : 7,
    rotate : 3
  }, {
    speed : 15,
    rotate : 3
  }, {
    speed : 8,
    rotate : 2
  }];

  var explosions;

  var timeLabel;
  var timeText;
  var time = 0;

  var gameoverText;

  var mousePressed;

  var isStarted = true;

  //----------------------------------
  // game logic
  var ns = collar.ns("com.collarjs.game.2d.spaceship");

  // game module input
  var gameModuleInput = ns.input("game module input");

  var gameSceneSensor = ns.sensor("game scene sensor", function(options) {
    if (options == "init game scene") {
      game.input.onDown.add(() =>{
        mousePressed = true;
      }, this);
      game.input.onUp.add(() =>{
        mousePressed = false;
      }, this);
      game.input.addMoveCallback((pointer, x, y) => {
        if (mousePressed) {
          this.send({
            event : "new target direction",
            x : x,
            y : y
          })
        }
      });

      game.time.events.loop(Phaser.Timer.SECOND * 5, () => {
        if (isStarted)
          // this.send({
          //   event : "enemy fires"
          // }, false)
          for (let i = 0; i < gameLevel; i++) {
            this.send({
              event : "enemy fires"
            }, false);
          }
      }, this);

      for (let i = 0; i < gameLevel; i++) {
        this.send({
          event : "enemy fires"
        }, false);
      }

      game.input.onTap.add(() => {
        this.send({
          event : "restart"
        });
      },this);
    }
  });
  gameSceneSensor.to(gameModuleInput);

  gameModuleInput
    .when("load resources", signal => signal.get("event") === "load resources")
    .do("load resources", signal => {
      game.load.image('missile', 'images/missile.png');
      game.load.image('background', 'images/background.png');
      game.load.image('spaceship', 'images/spaceship.png');
      game.load.spritesheet('explosion', 'images/explode.png', 128, 128);
    })
    .errors((signal) => {
      console.error(signal.error);
    })

  gameModuleInput
    .when("init game scene", signal => signal.get("event") === "init game scene")
    .do("init world settings", signal => {
      game.physics.startSystem(Phaser.Physics.ARCADE);
    })
    .do("render background", signal => {
      background = game.add.tileSprite(0, 0, __width__, __height__, 'background');
    })
    .do("render spaceship", signal => {
      spaceship = game.add.sprite(game.world.centerX,game.world.centerY, 'spaceship');
      spaceship.anchor.setTo(0.5, 0.5);
      game.physics.enable(spaceship, Phaser.Physics.ARCADE);
      spaceship._flySpeed = spaceshipSpeed;
      spaceship._rotateSpeed = spaceshipRotateSpeed;
      spaceship._direction = new Phaser.Point(spaceship.x, spaceship.y - spaceship._flySpeed);

    })
    .do("render missiles", signal => {
      missiles = game.add.group();
      missiles.enableBody = true;
      missiles.physicsBodyType = Phaser.Physics.ARCADE;
      missiles.createMultiple(30, 'missile');
      missiles.setAll('anchor.x', 0.5);
      missiles.setAll('anchor.y', 1);
      missiles.setAll('outOfBoundsKill', false);
      missiles.setAll('checkWorldBounds', true);
    })
    .do("render explosion", signal => {
      explosions = game.add.group();
      explosions.createMultiple(30, 'explosion');
      explosions.forEach((v) => {
        v.anchor.x = 0.5;
        v.anchor.y = 0.5;
        v.animations.add('explosion');
      }, this);
    })
    .do("render ui elements", signal => {
      timeLabel = 'Time : ';
      timeText = game.add.text(10, 10, timeLabel + time, { font: '34px Arial', fill: '#fff' });
      time = game.time.now;

      gameoverText = game.add.text(game.world.centerX,game.world.centerY,' ', { font: '34px Arial', fill: '#fff' });
      gameoverText.anchor.setTo(0.5, 0.5);
      gameoverText.visible = false;
    })
    .do("init game scene sensor", signal => {
      gameSceneSensor.watch("init game scene");
    })
    .errors((signal) => {
      console.error(signal.error);
    });

  gameModuleInput
    // this event will be received 60 times per second
    .when("update event", signal => signal.get("event") === "update")
    .do("update spaceship position", signal => {
      if (!spaceship._target) spaceship._target = new Phaser.Point(spaceship._direction.x, spaceship._direction.y);

      var angle = calculateAngle(
        new Phaser.Point(spaceship.x, spaceship.y),
        spaceship._direction,
        spaceship._target
      );

      var rotated = spaceship._rotateSpeed;
      if (angle > 0) {
        spaceship.angle += spaceship._rotateSpeed;
        rotated = spaceship._rotateSpeed;
      } else {
        spaceship.angle -= spaceship._rotateSpeed;
        rotated = -spaceship._rotateSpeed
      }

      spaceship._direction = Phaser.Point.rotate(spaceship._direction, spaceship.x, spaceship.y, rotated, true)

      background.tilePosition.x -= (spaceship._direction.x - spaceship.x);
      background.tilePosition.y -= (spaceship._direction.y - spaceship.y);
    })
    .do("update missile position", signal => {
      var deltaX = 0;
      var deltaY = 0;
      for (var missile of missiles.children) {
        if (missile.hasOwnProperty("_direction")) {
          // calculate angle
          var angle = calculateAngle(
            new Phaser.Point(missile.x, missile.y),
            missile._direction,
            new Phaser.Point(spaceship.x, spaceship.y)
          );

          var d = Phaser.Point.distance(missile._direction, new Phaser.Point(missile.x, missile.y));

          var rotated = angle;
          if (angle > 0) {
            missile.angle += missile._rotateSpeed;
            rotated = missile._rotateSpeed;
          } else {
            missile.angle -= missile._rotateSpeed;
            rotated = -missile._rotateSpeed;
          }

          missile._direction = Phaser.Point.rotate(missile._direction, missile.x, missile.y, rotated, true);
          d = Phaser.Point.distance(missile._direction, new Phaser.Point(missile.x, missile.y));

          missile._relativeDirection = toPoint(
              toVector(missile._direction).subtract(new Victor(missile.x, missile.y))
              .add(toVector(spaceship._direction).subtract(new Victor(spaceship.x, spaceship.y)).invert())
              .add(new Victor(missile.x, missile.y))
            );

          deltaX = (missile._relativeDirection.x - missile.x);
          deltaY = (missile._relativeDirection.y - missile.y);

          missile.x += deltaX;
          missile.y += deltaY;
          missile._direction.x += deltaX;
          missile._direction.y += deltaY;
          missile._relativeDirection.x += deltaX;
          missile._relativeDirection.y += deltaY;
        }
      }
    })
    .do("update time score", signal => {
      if (isStarted)
        timeText.text = timeLabel + Math.floor((game.time.now - time) / 1000);
    })
    .do("collision detection", signal => {
      game.physics.arcade.overlap(missiles, spaceship, (spaceship,missile) => {
        missile.kill();

        //  And create an explosion :)
        var explosion = explosions.getFirstExists(false);
        explosion.reset(spaceship.body.x, spaceship.body.y);
        explosion.play('explosion', 30, false, true);

        if (!invincible) {
          missiles.callAll('kill');

          gameoverText.text=" GAME OVER \n Click to restart";
          gameoverText.visible = true;

          isStarted = false;
        }
      }, null, this);

      game.physics.arcade.overlap(missiles, missiles, (missile1,missile2) => {
        missile1.kill();
        missile2.kill();

        //  And create an explosion :)
        var explosion = explosions.getFirstExists(false);
        explosion.reset(missile1.body.x, missile1.body.y);
        explosion.play('explosion', 30, false, true);

        var explosion = explosions.getFirstExists(false);
        explosion.reset(missile2.body.x, missile2.body.y);
        explosion.play('explosion', 30, false, true);
      }, null, this);
    })
    .errors((signal) => {
      console.error(signal.error);
    });

  gameModuleInput
    .when("new spaceship target direction", signal => {
      return signal.get("event") === "new target direction";
    })
    .do("update spaceship's target direction", signal => {
      var target = new Phaser.Point(signal.get("x"), signal.get("y"));
      spaceship._target = target;
    })
    .errors((signal) => {
      console.error(signal.error);
    });

  gameModuleInput
    .when("restart", signal => signal.get("event") === "restart" && isStarted == false)
    .do("restart the game", signal => {
      isStarted = true;
      gameoverText.visible = false;
      time = game.time.now;
    })
    .errors((signal) => {
      console.error(signal.error);
    });

  gameModuleInput
    .when("enemy fires", signal => {
      return signal.get("event") === "enemy fires";
    })
    .do("create a new missile", signal => {
      missile = missiles.getFirstExists(false);
      // calculate its initial position
      var angle = (game.rnd.frac() - 0.5) * 180;

      var x = game.rnd.pick([-1, 1]) * window.innerWidth / 2 * Math.cos(angle / 180 * Math.PI) + spaceship.x;
      var y = game.rnd.pick([-1, 1]) * window.innerHeight / 2 * Math.sin(angle / 180 * Math.PI) + spaceship.y;

      missile.reset(x, y);
      var profileIdx = game.rnd.integerInRange(0, missileProfile.length - 1);
      missile._flySpeed = missileProfile[profileIdx].speed;
      missile._rotateSpeed = missileProfile[profileIdx].rotate;
      missile._direction = new Phaser.Point(missile.x, missile.y - missile._flySpeed);

      var angle = calculateAngle(
        new Phaser.Point(missile.x, missile.y),
        missile._direction,
        new Phaser.Point(spaceship.x, spaceship.y)
      );

      missile.angle += angle;

      missile._direction = Phaser.Point.rotate(missile._direction, missile.x, missile.y, angle, true);
    })
    .errors((signal) => {
      console.error(signal.error);
    });


  return {
    inputs : {
      "input" : gameModuleInput
    }
  }
}
