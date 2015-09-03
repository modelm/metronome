/**
 * depends on Mousetrap for keyboard shortcuts: http://craig.is/killing/mice
 */

var getRandomInt = function(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

var Metronome = {
	interval: null, // used to store the result of setInterval() while ticking

	beat: 0, // beat counter, reset to 1 on downbeats

	time: 0, // the time signature beats per measure

	groupings: [], // if the time signature is asymmetric, this will contain each group. otherwise it will contain only one element: beats per measure

	strongBeats: [], // strong beats discovered by parsing the time input will be appended to this

	taps: [], // will contain times when the tap button was clicked (shift()ed every tap after the second one)

	context: new (window.AudioContext || window.webkitAudioContext), // audio context in which to create and use the tone generator

	defaults: {
		tempo: 120,
		time: 0,
		duration: 0.01,
		frequencies: {
			downbeat: 2500,
			strong: 2000,
			weak: 1500,
		},
	},

	inputs: {
		tempo: document.getElementById('tempo'),
		time: document.getElementById('time'),
		duration: document.getElementById('duration'),
		frequencies: {
			downbeat: document.getElementById('frequency-downbeat'),
			strong: document.getElementById('frequency-strong'),
			weak: document.getElementById('frequency-weak'),
		}
	},


	tick: function() {
		var osc = Metronome.context.createOscillator();

		if ((Metronome.time !== '0') && (Metronome.beat) >= eval(Metronome.time)) { // downbeat
			Metronome.beat = 1;
		} else {
			Metronome.beat++;
		}

		// determine & set beat type: downbeat, strong beat, or weak beat
		if ((Metronome.time !== '0') && (Metronome.beat === 1)) {
			osc.frequency.value = Metronome.inputs.frequencies.downbeat.value;
			document.getElementById('metronome').className = 'downbeat';
		} else if ((Metronome.time !== '0') && (Metronome.strongBeats.indexOf(Metronome.beat) > -1)) {
			osc.frequency.value = Metronome.inputs.frequencies.strong.value;
			document.getElementById('metronome').className = 'strong';
		} else {
			osc.frequency.value = Metronome.inputs.frequencies.weak.value;
			document.getElementById('metronome').className = 'weak';
		}

		// visual tick
		document.getElementById('visual-target').innerHTML = Metronome.beat;

		// audio tick
		osc.connect(Metronome.context.destination);
		osc.start(Metronome.context.currentTime);
		osc.stop(Metronome.context.currentTime + Metronome.defaults.duration);

		console.log('metronome tick');
	},

	start: function() {
		var tempo = parseInt(Metronome.inputs.tempo.value) || Metronome.defaults.tempo;
		var tickInterval = (60 / tempo) * 1000;

		Metronome.inputs.tempo.value = tempo; // just in case a bad value made it in here somehow, set it to what we're actually using

		// ios does not play html5 audio on a page unless first triggered by a user interaction event like this
		var osc = Metronome.context.createOscillator();
		osc.connect(Metronome.context.destination);
		osc.start(Metronome.context.currentTime);
		osc.stop(Metronome.context.currentTime);

		if (tempo > 0) {
			if (Metronome.interval !== null) window.clearInterval(Metronome.interval);
			Metronome.interval = window.setInterval(Metronome.tick, tickInterval);
			document.getElementById('start').style.display = 'none';
			document.getElementById('stop').style.display = '';
			console.log('metronome started');
		} else {
			console.log('tempo must be positive', tempo); // TODO tell user
		}
	},

	stop: function() {
		window.clearInterval(Metronome.interval);
		Metronome.interval = null;
		Metronome.beat = 0;
		document.getElementById('visual-target').innerHTML = '&nbsp;';
		document.getElementById('start').style.display = '';
		document.getElementById('stop').style.display = 'none';
		console.log('metronome stopped');
	},

	restart: function() {
		//Metronome.stop();
		Metronome.start();
	},

	addToTempo: function(difference) {
		Metronome.inputs.tempo.value = parseInt(Metronome.inputs.tempo.value) + difference;
		Metronome.parseTempo();
	},

	parseTime: function() {
		Metronome.inputs.time.value = Metronome.inputs.time.value.replace(/[^1-9\+]/g, ''); // remove characters which are not numbers or '+'
		Metronome.inputs.time.value = Metronome.inputs.time.value.replace(/\++/g, '+'); // remove extraneous instances of '+'

		if (!/^\+/.test(Metronome.inputs.time.value) && !/\+$/.test(Metronome.inputs.time.value)) { // ignore input beginning or ending with '+'
			if (!Metronome.inputs.time.value.length) Metronome.inputs.time.value = Metronome.defaults.time;

			Metronome.time = Metronome.inputs.time.value;
			Metronome.groupings = Metronome.time.split('+');
			Metronome.strongBeats = [1];

			for (var i = 0; i < Metronome.groupings.length - 1; i++) {
				if (Metronome.strongBeats.length) {
					Metronome.strongBeats.push(parseInt(Metronome.groupings[i]) + Metronome.strongBeats[Metronome.strongBeats.length - 1]);
				} else {
					Metronome.strongBeats.push(parseInt(Metronome.groupings[i]));
				}
			}

			localStorage.setItem('metronome.time', Metronome.time);

			console.log('metronome parsed time: ', Metronome.time, ' groupings: ', Metronome.groupings, ' strong beats: ', Metronome.strongBeats);
		}
	},

	parseTempo: function() {
		Metronome.inputs.tempo.value = Metronome.inputs.tempo.value.replace(/[^0-9]/g, ''); // remove non-numeric characters

		localStorage.setItem('metronome.tempo', Metronome.inputs.tempo.value);
		console.log('metronome parsed tempo: ', Metronome.inputs.tempo.value, ' localStorage metronome.tempo: ', localStorage.getItem('metronome.tempo'));

		if (Metronome.interval) Metronome.restart();
	},

	handleTap: function() {
		Metronome.taps.push(Metronome.context.currentTime);

		if (Metronome.taps.length > 2) {
			Metronome.taps.shift();
		}

		if (Metronome.taps.length > 1) {
			document.getElementById('tempo').value = (function() {
				var secondsSinceLastTap = Metronome.taps[1] - Metronome.taps[0];
				console.log('metronome seconds since last tap: ', secondsSinceLastTap);
				return Math.floor(60 / secondsSinceLastTap);
			})();
		}

		Metronome.parseTempo();
		console.log('metronome taps: ', Metronome.taps);
	},

	showHelp: function() {
		var lines = [
			'beats per measure can be either of the following:\n',
			'• "0" (no grouping)',
			'• one or more numbers separated by "+" e.g. "4", "2+3", "3+2+2"',
			'\n\n',
			'keyboard shortcuts:\n',
			'• space - start/stop',
			'• up - increment tempo by 1',
			'• down - decrement tempo by 1',
			'• left - decrement tempo by 10',
			'• right - increment tempo by 10',
			'• . - tap tempo',
			'• b - focus beats per measure',
			'• t - focus tempo',
			'• ? - show this help',
		];

		alert(lines.join('\n'));

		return false;
	},

	bindControls: function() {
		// keyboard shortcuts
		Mousetrap.bindGlobal('?', Metronome.showHelp);
		Mousetrap.bindGlobal('.', function(e) {
			e.preventDefault();
			Metronome.handleTap();
		});
		Mousetrap.bindGlobal('t', function(e) {
			e.preventDefault();
			Metronome.inputs.tempo.focus();
		});
		Mousetrap.bindGlobal('b', function(e) {
			e.preventDefault();
			Metronome.inputs.time.focus();
		});
		Mousetrap.bindGlobal('space', function(e) { // start if stopped; stop if started
			e.preventDefault();
			if (Metronome.interval) {
				Metronome.stop();
			} else {
				Metronome.start();
			}
		});
		Mousetrap.bindGlobal('n', function() {
			Metronome.addToTempo(-Math.floor(parseInt(Metronome.inputs.tempo.value)/2));
		});
		Mousetrap.bindGlobal('up', function() {
			Metronome.addToTempo(1);
		});
		Mousetrap.bindGlobal('down', function() {
			Metronome.addToTempo(-1);
		});
		Mousetrap.bindGlobal('right', function() {
			Metronome.addToTempo(10);
		});
		Mousetrap.bindGlobal('left', function() {
			Metronome.addToTempo(-10);
		});
		Mousetrap.bindGlobal('m', function() {
			Metronome.addToTempo(parseInt(Metronome.inputs.tempo.value));
		});

		// tempo / beats per minute
		Metronome.inputs.tempo.onkeyup = Metronome.parseTempo;

		// time / beats per measure
		Metronome.inputs.time.onkeyup = Metronome.parseTime;
		document.getElementById('reset-time').onclick = function() {
			Metronome.inputs.time.value = '';
			Metronome.parseTime();
		}

		// start/stop buttons
		document.getElementById('start').onclick = Metronome.start;
		document.getElementById('stop').onclick = Metronome.stop;

		// increment/decrement buttons
		document.getElementById('halve').onclick = function() {
			Mousetrap.trigger('n');
		}
		document.getElementById('minus10').onclick = function() {
			Mousetrap.trigger('left');
		}
		document.getElementById('plus10').onclick = function() {
			Mousetrap.trigger('right');
		}
		document.getElementById('minus1').onclick = function() {
			Mousetrap.trigger('down');
		}
		document.getElementById('plus1').onclick = function() {
			Mousetrap.trigger('up');
		}
		document.getElementById('double').onclick = function() {
			Mousetrap.trigger('m');
		}

		// tap tempo button
		document.getElementById('tap').onclick = Metronome.handleTap;

		// help anchor
		document.getElementById('show-help').onclick = Metronome.showHelp;

		// small window popout button
		document.getElementById('popout').onclick = function() {
			Metronome.stop();
			window.open('index.html', '_blank', 'width=320,height=400,resizable=no,scrollbars=no,menubar=no,location=no,status=no,toolbar=no');
		}

		// randomize
		document.getElementById('randomize-tempo').onclick = Metronome.randomizeTempo;
		document.getElementById('randomize-time').onclick = Metronome.randomizeTime;
		document.getElementById('randomize-both').onclick = function() {
			Metronome.randomizeTempo();
			Metronome.randomizeTime();
		}
	},

	randomizeTempo: function() {
		Metronome.inputs.tempo.value = getRandomInt(25, 960);
		Metronome.parseTempo();
	},

	randomizeTime: function() {
		var groups = [];

		for (var i = 0; i < getRandomInt(0, 3); i++) {
			groups.push(getRandomInt(2, 4));
		}

		Metronome.inputs.time.value = groups.join('+');
		Metronome.parseTime();
	},

	init: function() {
		console.log(localStorage);

		Metronome.inputs.tempo.value = localStorage.getItem('metronome.tempo') || Metronome.defaults.tempo;
		Metronome.inputs.time.value = localStorage.getItem('metronome.time') || Metronome.defaults.time;

		Metronome.inputs.duration.value = localStorage.getItem('metronome.duration') || Metronome.defaults.duration;

		Metronome.inputs.frequencies.downbeat.value = localStorage.getItem('metronome.frequencies.downbeat') || Metronome.defaults.frequencies.downbeat;
		Metronome.inputs.frequencies.strong.value = localStorage.getItem('metronome.frequencies.strong') || Metronome.defaults.frequencies.strong;
		Metronome.inputs.frequencies.weak.value = localStorage.getItem('metronome.frequencies.weak') || Metronome.defaults.frequencies.weak;

		Metronome.parseTempo();
		Metronome.parseTime();
		Metronome.bindControls();
	}
}

Metronome.init();
