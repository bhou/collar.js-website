(function carousel () {
  window.carousel = function () {
    window.collar.enableDevtool();

    var ns,
        id;

    ns = window.collar.ns('com.collartechs.example.carousel');

    const input = ns.input('carousel input');
    const output = ns.output('carousel output');


    var id; // element id for container
    var carouselTemplate = `
    <div class="carousel">
      <ol class="carousel-content"></ol>
      <div class="carousel-prev">&lsaquo;</div>
      <div class="carousel-next">&rsaquo;</div>
    </div>
    `;

    var data = {
      items: [], // the list of items
      current: 0 // the index of current item
    }

    const carouselItemTemplate = '<li class="carousel-item {CURRENT}">' +
      '<img src="{IMG}"/>' +
      '<div class="carousel-desc">' +
        '<div class="carousel-title">' +
          '<h1>{TITLE}</h1>' +
        '</div>' +
        '<div class="carousel-calories">' +
          'Subtitle: <span>{SUBTITLE}</span>' +
        '</div>' +
      '</div>' +
    '</li>';

    var uiSensor = ns.sensor('carousel UI sensor', function (options) {
        var sensor = this;
        if (options === 'init carousel') {
          // watch clicking prev event, and send 'prev item' message
          document.querySelector('#' + id + ' .carousel-prev')
            .addEventListener('click', function () {
              sensor.send({ msg: 'prev item' });
            });
          // watch clicking next event, and send 'next item' message
          document.querySelector('#' + id + ' .carousel-next')
            .addEventListener('click', function () {
              sensor.send({ msg: 'next item' });
            });
        }
      });

    uiSensor.to(input);

    input
      .when('init carousel', function (signal) {
        return signal.get('msg') === 'init carousel';
      })
      .do('init carousel container', function (signal) {
        id = signal.get('id');
        var container = document.querySelector('#' + id);
        container.innerHTML = carouselTemplate;
      })
      .do('init UI sensor', function (signal) {
        uiSensor.watch('init carousel');
      })
			.map('generate "carousel initiated" message', function (signal) {
				return signal.new({
					msg: 'init carousel',
					id: signal.get('id')
				});
			})
      .to(output);


    input
      .when('set items', function (signal) {
        return signal.get('msg') === 'set items';
      })
      .do('store items in memory', function (signal) {
        data.items = signal.get('items');
      })
      .do('create items elements', function (signal) {
        var carouselElemItemStr = '';
        for (var i = 0; i < data.items.length; i++) {
          carouselElemItemStr += carouselItemTemplate
            .replace('{CURRENT}', '')
            .replace('{IMG}', data.items[i].img)
            .replace('{TITLE}', data.items[i].title)
            .replace('{SUBTITLE}', data.items[i].subtitle);
        }
        var carouselContentEle = document.querySelector('#' + id + ' .carousel-content');
        carouselContentEle.innerHTML = carouselElemItemStr;
      })
      .do('change current index to 0', function (signal) {
        data.current = 0;
      })
      .do('show current item', function (signal) {
        var oldCurrentItem = document.querySelector('.current');
        if (oldCurrentItem) oldCurrentItem.classList.remove('current');

        var newCurrentItem = document.querySelector('#' + id + ' li.carousel-item:nth-of-type(' + (data.current+1) + ')');
        if (newCurrentItem) newCurrentItem.classList.add('current');
      })
			.map('generate "items changed" message', function (signal) {
				return signal.new({
					msg: 'items changed',
					items: signal.get('items')
				});
			})
      .to(output);

    input
      .when('next item', function (signal) {
        return signal.get('msg') === 'next item';
      })
      .do('change current index to next', function (signal) {
        data.current = (data.current + 1) % data.items.length;
      })
      .do('show current item', function (signal) {
        var oldCurrentItem = document.querySelector('.current');
        if (oldCurrentItem) oldCurrentItem.classList.remove('current');

        var newCurrentItem = document.querySelector('#' + id + ' li.carousel-item:nth-of-type(' + (data.current+1) + ')');
        if (newCurrentItem) newCurrentItem.classList.add('current');
      })
			.map('generate "current item changed" message', function (signal) {
				return signal.new({
					msg: 'current item changed',
					current: data.current
				})
			})
      .to(output);

    input
      .when('prev item', function (signal) {
        return signal.get('msg') === 'prev item';
      })
      .do('change current index to previous', function (signal) {
        data.current = data.current === 0 ? data.items.length - 1 : data.current - 1;
      })
      .do('show current item', function (signal) {
        var oldCurrentItem = document.querySelector('.current');
        if (oldCurrentItem) oldCurrentItem.classList.remove('current');

        var newCurrentItem = document.querySelector('#' + id + ' li.carousel-item:nth-of-type(' + (data.current+1) + ')');
        if (newCurrentItem) newCurrentItem.classList.add('current');
      })
			.map('generate "current item changed" message', function (signal) {
				return signal.new({
					msg: 'current item changed',
					current: data.current
				})
			})
      .to(output);

    var func = collar.toNode(input, output);

    return {
      input: input,
      api: {
        init: function (eleId, done) {
          func({
            msg: 'init carousel',
            id: eleId
          }, done);
        },
        setItems: function (items, done) {
          func({
            msg: 'set items',
            items: items
          });
        },
        showPrev: function () {
          func({
            msg: 'prev item'
          });
        },
        showNext: function () {
          func({
            msg: 'next item'
          })
        },
        showItem: function (n) {
        },
	
				// sync api
				initSync: function (eleId) {
					func({
						msg: 'init carousel',
						id: eleId
					}, function(){}, false);
				},
				setItemsSync: function (items) {
					func({
						msg: 'set items',
						items: items
					}, function(){}, false);
				},
				showPrevSync: function () {
					func({
						msg: 'prev item'
					}, function(){}, false);
				},
				showNextSync: function () {
					func({
						msg: 'next item'
					}, function(){}, false);
				}
      }
    }
  }
}());
