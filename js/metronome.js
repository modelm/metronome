/**
 * depends on Mousetrap for keyboard shortcuts: http://cdn.craig.is/js/mousetrap/mousetrap.min.js
 */

var Metronome = {
	interval: null, // used to store the result of setInterval() while ticking

	beat: 0, // beat counter, reset to 1 on downbeats

	time: 0, // the time signature

	groupings: [], // if the time signature is asymmetric, this will contain each group. otherwise it will contain only one element: beats per measure

	strongBeats: [], // strong beats discovered by parsing the time input will be appended to this

	context: new(window.audioContext || window.webkitAudioContext), // audio context in which to create and use the tone generator

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
		var bpm = document.getElementById('bpm').value;
		var beepInterval = (60 / bpm) * 1000;

		if (bpm > 0) {
			if (Metronome.interval !== null) window.clearInterval(Metronome.interval);
			Metronome.interval = window.setInterval(Metronome.tick, beepInterval);
			document.getElementById('start').style.display = 'none';
			document.getElementById('stop').style.display = '';
			console.log('metronome started');
		} else {
			console.log('bpm must be positive', bpm); // TODO tell user
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

	addToBpm: function(difference) {
		var bpmInput = document.getElementById('bpm');
		bpmInput.value = parseInt(bpmInput.value) + difference;
		if (Metronome.interval !== null) Metronome.start();
	},

	parseTime: function() {
		var timeInput = document.getElementById('time');

		timeInput.value = timeInput.value.replace(/[^\d\+]/g, ''); // remove characters which are not numbers or '+'

		timeInput.value = timeInput.value.replace(/\++/g, '+'); // remove extraneous instances of '+'

		if (timeInput.value === '') {
			timeInput.value = 0;
		}

		if (!/^\+/.test(timeInput.value) && !/\+$/.test(timeInput.value)) { // ignore input beginning or ending with '+'
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

			console.log(Metronome.time, Metronome.groupings, Metronome.strongBeats);
		}
	},

	init: function() {
		document.getElementById('start').onclick = Metronome.start;
		document.getElementById('stop').onclick = Metronome.stop;

		document.getElementById('bpm').onkeyup = Metronome.restart;

		document.getElementById('time').onkeyup = Metronome.parseTime;

		document.getElementById('minus10').onclick = function(){
			Metronome.addToBpm(-10);
		}
		document.getElementById('minus1').onclick = function(){
			Metronome.addToBpm(-1);
		}
		document.getElementById('plus10').onclick = function(){
			Metronome.addToBpm(10);
		}
		document.getElementById('plus1').onclick = function(){
			Metronome.addToBpm(1);
		}

		document.getElementById('popout').onclick = function(){
			Metronome.stop();
			window.open('index.html', '_blank', 'width=250,height=300,resizable=no,scrollbars=no,menubar=no,location=no,status=no,toolbar=no');
		}

		Metronome.parseTime();
	}
}

Metronome.init();
