/* jshint evil:true */
/* globals Mousetrap */

var Metronome = {
	interval: null, // used to store the result of setInterval() while ticking

	beat: 0, // beat counter, reset to 1 on downbeats

	groups: [], // if the time signature is asymmetric, this will contain each group. otherwise it will contain only one element: beats per measure

	strongBeats: [], // strong beats discovered by parsing the time input will be appended to this

	taps: [], // will contain times when the tap button was clicked (shift()ed every tap after the second one)

	context: new window.AudioContext() || new window.webkitAudioContext(), // audio context in which to create and use the tick tone generator

	tuner: false, // keeps track of the oscillator used for the tuning tone generator (false while tuner is off)

	settings: {
		tempo: 120,
		time: 0,
		duration: 0.01,
		frequencies: {
			downbeat: 2500,
			strong: 2000,
			weak: 1500,
			tuner: 440
		},
		debug: true
	},

	inputs: {
		tempo: document.getElementById('tempo'),
		time: document.getElementById('time'),
		duration: document.getElementById('duration'),
		frequencies: {
			downbeat: document.getElementById('frequency-downbeat'),
			strong: document.getElementById('frequency-strong'),
			weak: document.getElementById('frequency-weak'),
			tuner: document.getElementById('frequency-tuner')
		}
	},

	tick: function () {
		var osc = Metronome.context.createOscillator();

		if ((Metronome.settings.time !== '0') && (Metronome.beat) >= eval(Metronome.settings.time)) { // downbeat
			Metronome.beat = 1;
		} else {
			Metronome.beat += 1;
		}

		// determine & set beat type: downbeat, strong beat, or weak beat
		if ((Metronome.settings.time !== '0') && (Metronome.beat === 1)) {
			osc.frequency.value = Metronome.settings.frequencies.downbeat;
			document.getElementById('metronome').className = 'downbeat';
		} else if ((Metronome.settings.time !== '0') && (Metronome.strongBeats.indexOf(Metronome.beat) > -1)) {
			osc.frequency.value = Metronome.settings.frequencies.strong;
			document.getElementById('metronome').className = 'strong';
		} else {
			osc.frequency.value = Metronome.settings.frequencies.weak;
			document.getElementById('metronome').className = 'weak';
		}

		// visual tick
		document.getElementById('visual-target').innerHTML = Metronome.beat;

		// audio tick
		osc.connect(Metronome.context.destination);
		osc.start(Metronome.context.currentTime);
		osc.stop(Metronome.context.currentTime + Metronome.settings.duration);

		if (Metronome.settings.debug) {
			console.log('tick');
		}
	},

	start: function () {
		var tickInterval = (60 / Metronome.settings.tempo) * 1000;

		// ios does not play html5 audio on a page unless first triggered by a user interaction event like this
		var osc = Metronome.context.createOscillator();
		osc.connect(Metronome.context.destination);
		osc.start(Metronome.context.currentTime);
		osc.stop(Metronome.context.currentTime);

		if (Metronome.interval !== null) {
			window.clearInterval(Metronome.interval);
		}
		Metronome.interval = window.setInterval(Metronome.tick, tickInterval);
		document.getElementById('start').style.display = 'none';
		document.getElementById('stop').style.display = '';
	},

	stop: function () {
		window.clearInterval(Metronome.interval);
		Metronome.interval = null;
		Metronome.beat = 0;
		document.getElementById('visual-target').innerHTML = '&nbsp;';
		document.getElementById('start').style.display = '';
		document.getElementById('stop').style.display = 'none';
	},

	parseTime: function () {
		Metronome.inputs.time.value = Metronome.inputs.time.value.replace(/[^1-9\+]/g, ''); // remove characters which are not numbers or '+'
		Metronome.inputs.time.value = Metronome.inputs.time.value.replace(/\++/g, '+'); // remove extraneous instances of '+'

		if (!(/^\+/).test(Metronome.inputs.time.value) && !(/\+$/).test(Metronome.inputs.time.value)) { // ignore input beginning or ending with '+'
			Metronome.settings.time = Metronome.inputs.time.value || '0';
			Metronome.groups = Metronome.settings.time.split('+');
			Metronome.strongBeats = [1];

			Metronome.groups.forEach(function (group, i) {
				Metronome.groups[i] = parseInt(group);

				// stop 1 shy of the end since final beat & downbeat are one and the same
				if (i < Metronome.groups.length - 1) {
					if (Metronome.strongBeats.length) {
						Metronome.strongBeats.push(Metronome.groups[i] + Metronome.strongBeats[Metronome.strongBeats.length - 1]);
					} else {
						Metronome.strongBeats.push(Metronome.groups[i]);
					}
				}
			});

			if (Metronome.settings.debug) {
				console.log('time', Metronome.settings.time);
				console.log('groups', Metronome.groups);
				console.log('strong beats', Metronome.strongBeats);
			}
		}
	},

	parseTempo: function () {
		if (parseInt(Metronome.inputs.tempo.value) > 0) {
			Metronome.settings.tempo = parseInt(Metronome.inputs.tempo.value);
			if (Metronome.interval) {
				Metronome.start();
			}
		} else {
			if (Metronome.settings.debug) {
				console.warn('tempo must be positive');
			}
		}
	},

	parseFrequencies: function () {
		Metronome.settings.frequencies.downbeat = parseInt(Metronome.inputs.frequencies.downbeat.value);
		Metronome.settings.frequencies.strong = parseInt(Metronome.inputs.frequencies.strong.value);
		Metronome.settings.frequencies.weak = parseInt(Metronome.inputs.frequencies.weak.value);
		Metronome.settings.frequencies.tuner = parseInt(Metronome.inputs.frequencies.tuner.value);

		if (Metronome.tuner) {
			Metronome.stopTuner();
			Metronome.startTuner();
		}
	},

	handleTap: function () {
		Metronome.taps.push(Metronome.context.currentTime);

		if (Metronome.taps.length > 2) {
			Metronome.taps.shift();
		}

		if (Metronome.taps.length > 1) {
			Metronome.inputs.tempo.value = Math.floor(60 / (Metronome.taps[1] - Metronome.taps[0]));
		}

		Metronome.save();

		if (Metronome.settings.debug) {
			console.log('taps: ', Metronome.taps);
		}
	},

	showHelp: function () {
		var lines = [
			'beats per measure can be either of the following:\n',
			'• "" or "0" (no groups)',
			'• one or more numbers separated by "+" e.g. "4", "2+3", "3+2+2"',
			'\n\n',
			'keyboard shortcuts:\n',
			'• space - start/stop',
			'• up - increment tempo by 1',
			'• down - decrement tempo by 1',
			'• left - decrement tempo by 10',
			'• right - increment tempo by 10',
			'• n - halve tempo',
			'• m - double tempo',
			'• j - third tempo',
			'• k - triple tempo',
			'• . - tap',
			'• b - focus beats per measure',
			'• t - focus tempo',
			'• ? - show this help'
		];

		alert(lines.join('\n'));

		return false;
	},

	// depends on Mousetrap for keyboard shortcuts: http://craig.is/killing/mice
	bindControls: function () {
		// keyboard shortcuts
		Mousetrap.bindGlobal('?', Metronome.showHelp);
		Mousetrap.bindGlobal('.', function (e) {
			e.preventDefault();
			Metronome.handleTap();
		});
		Mousetrap.bindGlobal('t', function (e) {
			e.preventDefault();
			Metronome.inputs.tempo.focus();
		});
		Mousetrap.bindGlobal('b', function (e) {
			e.preventDefault();
			Metronome.inputs.time.focus();
		});
		Mousetrap.bindGlobal('space', function (e) { // start if stopped; stop if started
			e.preventDefault();
			if (Metronome.interval) {
				Metronome.stop();
			} else {
				Metronome.start();
			}
		});
		Mousetrap.bindGlobal('down', function () {
			Metronome.inputs.tempo.value = parseInt(Metronome.inputs.tempo.value) - 1;
			Metronome.save();
		});
		Mousetrap.bindGlobal('up', function () {
			Metronome.inputs.tempo.value = parseInt(Metronome.inputs.tempo.value) + 1;
			Metronome.save();
		});
		Mousetrap.bindGlobal('left', function () {
			Metronome.inputs.tempo.value = parseInt(Metronome.inputs.tempo.value) - 10;
			Metronome.save();
		});
		Mousetrap.bindGlobal('right', function () {
			Metronome.inputs.tempo.value = parseInt(Metronome.inputs.tempo.value) + 10;
			Metronome.save();
		});
		Mousetrap.bindGlobal('n', function () {
			Metronome.inputs.tempo.value = parseInt(Metronome.inputs.tempo.value) / 2;
			Metronome.save();
		});
		Mousetrap.bindGlobal('m', function () {
			Metronome.inputs.tempo.value = parseInt(Metronome.inputs.tempo.value) * 2;
			Metronome.save();
		});
		Mousetrap.bindGlobal('j', function () {
			Metronome.inputs.tempo.value = parseInt(Metronome.inputs.tempo.value) / 3;
			Metronome.save();
		});
		Mousetrap.bindGlobal('k', function () {
			Metronome.inputs.tempo.value = parseInt(Metronome.inputs.tempo.value) * 3;
			Metronome.save();
		});

		// start/stop buttons
		document.getElementById('start').onclick = Metronome.start;
		document.getElementById('stop').onclick = Metronome.stop;

		// increment/decrement buttons
		document.getElementById('third').onclick = function () {
			Mousetrap.trigger('j');
		};
		document.getElementById('halve').onclick = function () {
			Mousetrap.trigger('n');
		};
		document.getElementById('minus10').onclick = function () {
			Mousetrap.trigger('left');
		};
		document.getElementById('plus10').onclick = function () {
			Mousetrap.trigger('right');
		};
		document.getElementById('minus1').onclick = function () {
			Mousetrap.trigger('down');
		};
		document.getElementById('plus1').onclick = function () {
			Mousetrap.trigger('up');
		};
		document.getElementById('double').onclick = function () {
			Mousetrap.trigger('m');
		};
		document.getElementById('triple').onclick = function () {
			Mousetrap.trigger('k');
		};

		// tap tempo button
		document.getElementById('tap').onclick = Metronome.handleTap;

		// help anchor
		document.getElementById('show-help').onclick = Metronome.showHelp;

		// small window popout button
		document.getElementById('popout').onclick = function () {
			Metronome.stop();
			window.open('index.html', '_blank', 'width=320,height=400,resizable=no,scrollbars=no,menubar=no,location=no,status=no,toolbar=no');
		};

		// randomize
		document.getElementById('randomize-tempo').onclick = Metronome.randomizeTempo;
		document.getElementById('randomize-time').onclick = Metronome.randomizeTime;
		document.getElementById('randomize-both').onclick = function () {
			Metronome.randomizeTempo();
			Metronome.randomizeTime();
		};

		// tuner start/stop buttons
		document.getElementById('start-tuner').onclick = Metronome.startTuner;
		document.getElementById('stop-tuner').onclick = Metronome.stopTuner;

		// settings change handlers. onkeyup for typing directly into the input, onchange for using the type=number controls & mobile
		for (var i in Metronome.inputs) {
			if(Metronome.inputs.hasOwnProperty(i)) {
				Metronome.inputs[i].onkeyup = Metronome.save;
				Metronome.inputs[i].onchange = Metronome.save;

				// TODO is there a cleaner way to do this?
				if (i === 'frequencies') {
					for (var j in i) {
						if(Metronome.inputs.frequencies.hasOwnProperty(j)) {
							Metronome.inputs.frequencies[j].onkeyup = Metronome.save;
							Metronome.inputs.frequencies[j].onchange = Metronome.save;
						}
					}
				}
			}
		}

		// reset to defaults
		document.getElementById('reset').onclick = Metronome.reset;
	},

	getRandomInt: function (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	},

	randomizeTempo: function () {
		Metronome.inputs.tempo.value = Metronome.getRandomInt(25, 960);
		Metronome.save();
	},

	randomizeTime: function () {
		var groups = [];

		for (var i = 0; i < Metronome.getRandomInt(0, 3); i += 1) {
			groups.push(Metronome.getRandomInt(2, 4));
		}

		Metronome.inputs.time.value = groups.join('+');
		Metronome.save();
	},

	startTuner: function () {
		document.getElementById('start-tuner').style.display = 'none';
		document.getElementById('stop-tuner').style.display = '';
		Metronome.tuner = Metronome.context.createOscillator();
		Metronome.tuner.frequency.value = Metronome.settings.frequencies.tuner;
		Metronome.tuner.connect(Metronome.context.destination);
		Metronome.tuner.start();
		return false;
	},

	stopTuner: function () {
		document.getElementById('start-tuner').style.display = '';
		document.getElementById('stop-tuner').style.display = 'none';
		Metronome.tuner.stop();
		Metronome.tuner = false;
		return false;
	},

	save: function () {
		Metronome.parseTempo();
		Metronome.parseTime();
		Metronome.parseFrequencies();
		Metronome.settings.duration = parseFloat(Metronome.inputs.duration.value);

		localStorage.setItem('Metronome', JSON.stringify(Metronome));

		if (Metronome.settings.debug) {
			console.log('saved');
		}
	},

	load: function () {
		var savedMetronome = JSON.parse(localStorage.getItem('Metronome'));

		if (savedMetronome && savedMetronome.settings) {
			for (var i in savedMetronome.settings) {
				if(Metronome.settings.hasOwnProperty(i)) {
					Metronome.settings[i] = savedMetronome.settings[i];
				}
			}
		}

		Metronome.inputs.tempo.value = Metronome.settings.tempo;
		Metronome.inputs.time.value = Metronome.settings.time;

		Metronome.inputs.duration.value = Metronome.settings.duration;

		Metronome.inputs.frequencies.downbeat.value = Metronome.settings.frequencies.downbeat;
		Metronome.inputs.frequencies.strong.value = Metronome.settings.frequencies.strong;
		Metronome.inputs.frequencies.weak.value = Metronome.settings.frequencies.weak;
		Metronome.inputs.frequencies.tuner.value = Metronome.settings.frequencies.tuner;

		Metronome.parseTempo();
		Metronome.parseTime();
		Metronome.parseFrequencies();
		Metronome.settings.duration = parseFloat(Metronome.inputs.duration.value);


		if (Metronome.settings.debug) {
			console.log('loaded');
		}
	},

	reset: function () {
		localStorage.removeItem('Metronome');
		location.reload();
		return false;
	},

	init: function () {
		Metronome.load();
		Metronome.bindControls();
	}
};

Metronome.init();
