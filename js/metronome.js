var Metronome = {
	interval: null, // used to store the result of setInterval() while ticking

	beat: 0, // beat counter, reset to 1 on downbeats

	time: document.getElementById('time').value, // the time signature

	context: new(window.audioContext || window.webkitAudioContext), // audio context in which to create and use the tone generator

	tick: function() {
		var osc = Metronome.context.createOscillator();
		var groupings = Metronome.time.split('+'); // account for possible asymmetric time signature (if there's no '+', this will contain only one element: the beats per measure)
		var strongBeats = [1]; // strong beats discovered by parsing the time input will be appended to this

		if ((Metronome.time !== '0') && (Metronome.beat) >= eval(Metronome.time)) { // downbeat
			Metronome.beat = 1;
		} else {
			Metronome.beat++;
		}

		for (var i = 0; i < groupings.length; i++) {
			if (strongBeats.length) {
				strongBeats.push(parseInt(groupings[i]) + strongBeats[strongBeats.length - 1]);
			} else {
				strongBeats.push(parseInt(groupings[i]));
			}
		}

		osc.frequency.value = 2000;
		document.getElementById('metronome').className = 'weak';

		if (Metronome.time !== '0') {
			if (Metronome.beat === 1) {
				osc.frequency.value = 4000;
				document.getElementById('metronome').className = 'downbeat';
			} else if (strongBeats.indexOf(Metronome.beat) > -1) {
				osc.frequency.value = 3000;
				document.getElementById('metronome').className = 'strong';
			}

			document.getElementById('visual-target').innerHTML = Metronome.beat;
		} else {
			document.getElementById('visual-target').innerHTML = Metronome.beat;
		}


		if (!document.getElementById('mute').checked) {
			osc.connect(Metronome.context.destination);
			osc.start(Metronome.context.currentTime);
			osc.stop(Metronome.context.currentTime + 0.0005);
		}

		console.log('tick');
	},

	start: function() {
		var bpm = document.getElementById('bpm').value;
		var beepInterval = (60 / bpm) * 1000;
		if(bpm > 0) {
			if (Metronome.interval !== null) window.clearInterval(Metronome.interval);
			Metronome.interval = window.setInterval(Metronome.tick, beepInterval);
			//Metronome.tick(); // unless we call this now, we wait until beepInterval has passed before the first tick comes
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

	init: function() {
		document.getElementById('stop').style.display = 'none';

		document.getElementById('bpm').onkeyup = Metronome.restart;
		document.getElementById('start').onclick = Metronome.start;
		document.getElementById('stop').onclick = Metronome.stop;

		document.getElementById('time').onkeyup = function(){
			if ((this.value.indexOf('+') !== 0) && (this.value.indexOf('+') !== this.value.length - 1)) { // reject input beginning or ending with '+'
				this.value.replace(/[^\d\+]/,''); // remove characters which are not integers or '+'
				Metronome.time = this.value;
			}
		}

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
	}
}

Metronome.init();
