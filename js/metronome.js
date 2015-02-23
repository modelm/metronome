/**
 * depends on Mousetrap for keyboard shortcuts: http://craig.is/killing/mice
 */

var Metronome = {
	interval: null, // used to store the result of setInterval() while ticking

	beat: 0, // beat counter, reset to 1 on downbeats

	time: 0, // the time signature

	groupings: [], // if the time signature is asymmetric, this will contain each group. otherwise it will contain only one element: beats per measure

	strongBeats: [], // strong beats discovered by parsing the time input will be appended to this

	taps: [], // will contain times when the tap button was clicked (shift()ed every tap after the second one)

	context: new (window.AudioContext || window.webkitAudioContext), // audio context in which to create and use the tone generator

	defaults: {
		tempo: 120,
		time: 0,
	},

	frequencies: {
		DOWNBEAT: 4000,
		STRONG: 5000,
		WEAK: 6000,
	},

	tempoInput: document.getElementById('tempo'),

	timeInput: document.getElementById('time'),

	tick: function() {
		var osc = Metronome.context.createOscillator();

		if ((Metronome.time !== '0') && (Metronome.beat) >= eval(Metronome.time)) { // downbeat
			Metronome.beat = 1;
		} else {
			Metronome.beat++;
		}

		// determine & set beat type: downbeat, strong beat, or weak beat
		if ((Metronome.time !== '0') && (Metronome.beat === 1)) {
			osc.frequency.value = Metronome.frequencies.DOWNBEAT;
			document.getElementById('metronome').className = 'downbeat';
		} else if ((Metronome.time !== '0') && (Metronome.strongBeats.indexOf(Metronome.beat) > -1)) {
			osc.frequency.value = Metronome.frequencies.STRONG;
			document.getElementById('metronome').className = 'strong';
		} else {
			osc.frequency.value = Metronome.frequencies.WEAK;
			document.getElementById('metronome').className = 'weak';
		}

		// visual tick
		document.getElementById('visual-target').innerHTML = Metronome.beat;

		// audio tick
		osc.connect(Metronome.context.destination);
		osc.start(Metronome.context.currentTime);
		osc.stop(Metronome.context.currentTime + 0.0005);

		console.log('metronome tick');
	},

	start: function() {
		var tempo = parseInt(Metronome.tempoInput.value) || Metronome.defaults.tempo;
		var tickInterval = (60 / tempo) * 1000;

		Metronome.tempoInput.value = tempo; // just in case a bad value made it in here somehow, set it to what we're actually using

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
		Metronome.tempoInput.value = parseInt(Metronome.tempoInput.value) + difference;
		if (Metronome.interval !== null) Metronome.start();
	},

	parseTime: function() {
		Metronome.timeInput.value = Metronome.timeInput.value.replace(/[^1-9\+]/g, ''); // remove characters which are not numbers or '+'
		Metronome.timeInput.value = Metronome.timeInput.value.replace(/\++/g, '+'); // remove extraneous instances of '+'

		if (!/^\+/.test(Metronome.timeInput.value) && !/\+$/.test(Metronome.timeInput.value)) { // ignore input beginning or ending with '+'
			if (!Metronome.timeInput.value.length) Metronome.timeInput.value = Metronome.defaults.time;

			Metronome.time = Metronome.timeInput.value;
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
		Metronome.tempoInput.value = Metronome.tempoInput.value.replace(/[^0-9]/g, ''); // remove non-numeric characters

		localStorage.setItem('metronome.tempo', Metronome.tempoInput.value);

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

		if (Metronome.interval) Metronome.start();
		console.log('metronome taps: ', Metronome.taps);
	},

	showHelp: function() {
		var lines = [
			'beats per minute can be either of the following:\n',
			'• "0" (no grouping)',
			'• one or more numbers separated by "+", e.g. "4", "2+3", "3+2+2"',
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
			Metronome.tempoInput.focus();
		});
		Mousetrap.bindGlobal('b', function(e) {
			e.preventDefault();
			Metronome.timeInput.focus();
		});
		Mousetrap.bindGlobal('space', function(e) { // start if stopped; stop if started
			e.preventDefault();
			if (Metronome.interval) {
				Metronome.stop();
			} else {
				Metronome.start();
			}
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

		// tempo / beats per minute
		Metronome.tempoInput.onkeyup = Metronome.parseTempo;

		// time / beats per measure
		Metronome.timeInput.onkeyup = Metronome.parseTime;

		// start/stop buttons
		document.getElementById('start').onclick = Metronome.start;
		document.getElementById('stop').onclick = Metronome.stop;

		// increment/decrement buttons
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

		// tap tempo button
		document.getElementById('tap').onclick = Metronome.handleTap;

		// help anchor
		document.getElementById('show-help').onclick = Metronome.showHelp;

		// small window popout button
		document.getElementById('popout').onclick = function() {
			Metronome.stop();
			window.open('index.html', '_blank', 'width=320,height=400,resizable=no,scrollbars=no,menubar=no,location=no,status=no,toolbar=no');
		}
	},

	init: function() {
		Metronome.tempoInput.value = localStorage.getItem('metronome.tempo') || Metronome.defaults.tempo;
		Metronome.timeInput.value = localStorage.getItem('metronome.time') || Metronome.defaults.time;
		Metronome.parseTime();
		Metronome.bindControls();

		// this is necessary for ios to actually play the tick more than once
		var osc = Metronome.context.createOscillator();
		osc.connect(Metronome.context.destination);
		osc.start(Metronome.context.currentTime);
		osc.stop(Metronome.context.currentTime);
	}
}

Metronome.init();
