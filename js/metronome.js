/**
 * depends on Mousetrap for keyboard shortcuts: http://cdn.craig.is/js/mousetrap/mousetrap.min.js
 */

var Metronome = {
	interval: null, // used to store the result of setInterval() while ticking

	beat: 0, // beat counter, reset to 1 on downbeats

	time: 0, // the time signature

	groupings: [], // if the time signature is asymmetric, this will contain each group. otherwise it will contain only one element: beats per measure

	strongBeats: [], // strong beats discovered by parsing the time input will be appended to this

	taps: [], // will contain times when the tap button was clicked (shift()ed every tap after the second one)

	context: new(window.audioContext || window.webkitAudioContext), // audio context in which to create and use the tone generator

	tempoInput: document.getElementById('tempo'),

	tick: function() {
		var osc = Metronome.context.createOscillator();

		if ((Metronome.time !== '0') && (Metronome.beat) >= eval(Metronome.time)) { // downbeat
			Metronome.beat = 1;
		} else {
			Metronome.beat++;
		}

		// determine & set beat type: downbeat, strong beat, or weak beat
		if ((Metronome.time !== '0') && (Metronome.beat === 1)) {
			osc.frequency.value = 4000;
			document.getElementById('metronome').className = 'downbeat';
		} else if ((Metronome.time !== '0') && (Metronome.strongBeats.indexOf(Metronome.beat) > -1)) {
			osc.frequency.value = 3000;
			document.getElementById('metronome').className = 'strong';
		} else {
			osc.frequency.value = 2000;
			document.getElementById('metronome').className = 'weak';
		}

		// visual tick
		document.getElementById('visual-target').innerHTML = Metronome.beat;

		// audio tick
		if (!document.getElementById('mute').checked) {
			osc.connect(Metronome.context.destination);
			osc.start(Metronome.context.currentTime);
			osc.stop(Metronome.context.currentTime + 0.0005);
		}

		console.log('metronome tick');
	},

	start: function() {
		var tempo = parseInt(Metronome.tempoInput.value) || 120;
		var beepInterval = (60 / tempo) * 1000;

		Metronome.tempoInput.value = tempo; // just in case a bad value made it in here somehow, set it to what we're actually using

		if (tempo > 0) {
			if (Metronome.interval !== null) window.clearInterval(Metronome.interval);
			Metronome.interval = window.setInterval(Metronome.tick, beepInterval);
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
		document.getElementById('visual-target').innerHTML = '';
		document.getElementById('start').style.display = '';
		document.getElementById('stop').style.display = 'none';
		console.log('metronome stopped');
	},

	restart: function() {
		Metronome.stop();
		Metronome.start();
	},

	addToTempo: function(difference) {
		Metronome.tempoInput.value = parseInt(Metronome.tempoInput.value) + difference;
		if (Metronome.interval !== null) Metronome.start();
	},

	parseTime: function() {
		var timeInput = document.getElementById('time');

		timeInput.value = timeInput.value.replace(/[^\d\+]/g, ''); // remove characters which are not numbers or '+'

		timeInput.value = timeInput.value.replace(/\++/g, '+'); // remove extraneous instances of '+'

		if (!/^\+/.test(timeInput.value) && !/\+$/.test(timeInput.value)) { // ignore input beginning or ending with '+'
			if (!timeInput.value.length) timeInput.value = 0;

			Metronome.time = timeInput.value;

			Metronome.groupings = Metronome.time.split('+');

			Metronome.strongBeats = [1];

			for (var i = 0; i < Metronome.groupings.length - 1; i++) {
				if (Metronome.strongBeats.length) {
					Metronome.strongBeats.push(parseInt(Metronome.groupings[i]) + Metronome.strongBeats[Metronome.strongBeats.length - 1]);
				} else {
					Metronome.strongBeats.push(parseInt(Metronome.groupings[i]));
				}
			}

			console.log('metronome parsed time: ', Metronome.time, ' groupings: ', Metronome.groupings, ' strong beats: ', Metronome.strongBeats);
		}
	},

	bindControls: function() {
		var decrementTempoBig = function() {
			Metronome.addToTempo(-10);
		}
		var decrementTempoSmall = function() {
			Metronome.addToTempo(-1);
		}
		var incrementTempoSmall = function() {
			Metronome.addToTempo(1);
		}
		var incrementTempoBig = function() {
			Metronome.addToTempo(10);
		}

		// start/stop
		document.getElementById('start').onclick = Metronome.start;
		document.getElementById('stop').onclick = Metronome.stop;
		Mousetrap.bind('space', function() {
			if (Metronome.interval) {
				Metronome.stop();
			} else {
				Metronome.start();
			}
			return false;
		});

		// tempo / beats per minute
		document.getElementById('tempo').onkeyup = function() {
			if (Metronome.interval) {
				Metronome.restart();
			}
		}
		document.getElementById('tempo').onchange = function() {
			if (this.value === '' || parseInt(this.value) < 1) {
				this.value = 120;
			}
		}

		// time / beats per measure
		document.getElementById('time').onkeyup = Metronome.parseTime;
		document.getElementById('time').onchange = function() {
			if (this.value === '') {
				this.value = 0;
			}
		}

		// increment/decrement
		document.getElementById('minus10').onclick = decrementTempoBig;
		Mousetrap.bind('left', decrementTempoBig);

		document.getElementById('plus10').onclick = incrementTempoBig;
		Mousetrap.bind('right', incrementTempoBig);

		document.getElementById('minus1').onclick = decrementTempoSmall;
		Mousetrap.bind('down', decrementTempoSmall);

		document.getElementById('plus1').onclick = incrementTempoSmall;
		Mousetrap.bind('up', incrementTempoSmall);

		// small window popout
		document.getElementById('popout').onclick = function(){
			Metronome.stop();
			window.open('index.html', '_blank', 'width=250,height=300,resizable=no,scrollbars=no,menubar=no,location=no,status=no,toolbar=no');
		}

		// tap tempo
		document.getElementById('tap').onclick = function() {
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
		}

		// help
		document.getElementById('show-help').onclick = function() {
			var lines = [];

			lines.push('tempo can be any positive integer');

			lines.push('\n\nbeats per minute can be either:\n');
			lines.push('• "0" (no grouping)');
			lines.push('• one or more numbers separated by "+", e.g. "4", "2+3", "3+2+2"');

			lines.push('\n\nkeyboard shortcuts:\n');
			lines.push('• space: start/stop');
			lines.push('• up arrow: increment tempo by 1');
			lines.push('• down arrow: decrement tempo by 1');
			lines.push('• left arrow: decrement tempo by 10');
			lines.push('• right arrow: increment tempo by 10');

			alert(lines.join('\n'));

			return false;
		};
	},

	init: function() {
		Metronome.parseTime();
		Metronome.bindControls();
	}
}

Metronome.init();
