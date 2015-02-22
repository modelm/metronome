var Metronome = {
	interval: null,

	beat: 0,

	time: document.getElementById('time').value,

	context: new(window.audioContext || window.webkitAudioContext),

	tick: function() {
		var osc = Metronome.context.createOscillator();
		var groupings = [parseInt(Metronome.time)];
		var strongBeats = [1]; // strong beats discovered by parsing the time input will be appended to this

		if (Metronome.time.indexOf('+') > -1) { // asymmetric time signature
			groupings = Metronome.time.split('+');
		}

		if ((Metronome.beat) >=	eval(Metronome.time)) { // downbeat
			Metronome.beat = 1;
		} else {
			Metronome.beat++;
		}

		for (var i = 0; i < groupings.length; i++) {
			var t = parseInt(groupings[i]);

			if (strongBeats.length) {
				strongBeats.push(t + strongBeats[strongBeats.length - 1]);
			} else {
				strongBeats.push(t);
			}
		}

		if (Metronome.beat === 1) {
			osc.frequency.value = 4000;
			document.getElementById('metronome').className = 'downbeat';
		} else if (strongBeats.indexOf(Metronome.beat) > -1) {
			osc.frequency.value = 3000;
			document.getElementById('metronome').className = 'strong';
		} else {
			osc.frequency.value = 2000;
			document.getElementById('metronome').className = 'weak';
		}

		document.getElementById('visual-target').innerHTML = Metronome.beat;

		if (!document.getElementById('mute').checked) {
			osc.connect(Metronome.context.destination);
			osc.start(Metronome.context.currentTime);
			osc.stop(Metronome.context.currentTime + 0.0005);
		}

		console.log('tick', Metronome.beat);
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
			// TODO input sanitization/error handling
			Metronome.time = this.value;
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
			window.open('index.html', '_blank', 'width=250,height=300,resizable=no,scrollbars=no,menubar=no,location=no,status=no,toolbar=no');
		}
	}
}

Metronome.init();
